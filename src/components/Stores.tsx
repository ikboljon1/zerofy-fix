
import { useState, useEffect } from "react";
import { ShoppingBag, Store, Package2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Store as StoreType, NewStore, STATS_STORAGE_KEY } from "@/types/store";
import { loadStores, saveStores, refreshStoreStats, ensureStoreSelectionPersistence, validateApiKey } from "@/utils/storeUtils";
import { AddStoreDialog } from "./stores/AddStoreDialog";
import { StoreCard } from "./stores/StoreCard";
import { getSubscriptionStatus, SubscriptionData } from "@/services/userService";
import { Badge } from "@/components/ui/badge";
import { clearAllStoreCache, clearStoreCache } from "@/utils/warehouseCacheUtils";
import { Tariff, handleTrialExpiration, initialTariffs, applyTariffRestrictions } from "@/data/tariffs";

const TARIFFS_STORAGE_KEY = "app_tariffs";

interface StoresProps {
  onStoreSelect?: (store: { id: string; apiKey: string }) => void;
}

export default function Stores({ onStoreSelect }: StoresProps) {
  const [stores, setStores] = useState<StoreType[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [canDeleteStores, setCanDeleteStores] = useState(false);
  const [storeLimit, setStoreLimit] = useState<number>(1); // Default to 1
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      let userId = null;
      let updatedUserData = null;
      
      if (userData) {
        // Проверка на окончание пробного периода и обновление данных пользователя
        const parsedUserData = JSON.parse(userData);
        updatedUserData = handleTrialExpiration(parsedUserData);
        
        // Если данные изменились (пробный период закончился), показываем уведомление
        if (updatedUserData !== parsedUserData && updatedUserData.isInTrial === false) {
          setIsTrialExpired(true);
          toast({
            title: "Пробный период закончился",
            description: "Ваш пробный период закончился. Вы переведены на Базовый тариф.",
            variant: "destructive",
          });
        }
        
        userId = updatedUserData.id;
      }
      
      setCurrentUserId(userId);
      
      // Load and filter stores by current user
      const savedStores = ensureStoreSelectionPersistence();
      const userStores = userId 
        ? savedStores.filter(store => store.userId === userId)
        : savedStores;
      
      setStores(userStores);
      checkDeletePermissions();
      getStoreLimitFromTariff();
      
      // Make sure at least one store is selected if any stores exist
      if (userStores.length > 0 && !userStores.some(store => store.isSelected)) {
        handleToggleSelection(userStores[0].id);
      }
      
      // Если количество магазинов превышает лимит после окончания пробного периода
      if (isTrialExpired && userStores.length > storeLimit) {
        toast({
          title: "Превышен лимит магазинов",
          description: `После окончания пробного периода ваш лимит магазинов снизился до ${storeLimit}. Лишние магазины останутся в системе, но вы не сможете добавлять новые.`,
          variant: "warning",
        });
      }
    } catch (error) {
      console.error("Ошибка загрузки магазинов:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список магазинов",
        variant: "destructive",
      });
    }
  }, []);

  const getStoreLimitFromTariff = () => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (!userData) return;
    
    try {
      const user = JSON.parse(userData);
      const tariffId = user.tariffId;
      
      // Получаем тарифы из localStorage или используем значения по умолчанию
      const savedTariffsJson = localStorage.getItem(TARIFFS_STORAGE_KEY);
      const savedTariffs: Tariff[] = savedTariffsJson 
        ? JSON.parse(savedTariffsJson) 
        : initialTariffs;
      
      // Находим тариф пользователя
      const userTariff = savedTariffs.find(t => t.id === tariffId);
      
      if (userTariff) {
        // Используем storeLimit из найденного тарифа
        console.log(`Applying tariff ${userTariff.name} with store limit: ${userTariff.storeLimit}`);
        setStoreLimit(userTariff.storeLimit);
      } else {
        // Если тариф не найден, используем ограничения из функции applyTariffRestrictions
        console.log(`Tariff not found in saved tariffs, using restrictions for ID: ${tariffId}`);
        const restrictions = applyTariffRestrictions(tariffId);
        setStoreLimit(restrictions.storeLimit);
      }
    } catch (error) {
      console.error("Ошибка при получении лимита магазинов:", error);
      setStoreLimit(1); // Default to basic plan on error
    }
  };

  const checkDeletePermissions = async () => {
    // Get current user from localStorage
    const userData = localStorage.getItem('user');
    if (!userData) return;
    
    try {
      const user = JSON.parse(userData);
      
      // Get subscription information
      const subscriptionData: SubscriptionData = getSubscriptionStatus(user);
      
      if (subscriptionData && subscriptionData.endDate) {
        const subscriptionEndDate = new Date(subscriptionData.endDate);
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        // Если конец подписки более чем через месяц, значит подписка оформлена менее месяца назад
        // В этом случае удаление запрещено
        setCanDeleteStores(subscriptionEndDate.getTime() - oneMonthAgo.getTime() < 0);
      }
    } catch (error) {
      console.error("Ошибка при проверке разрешений:", error);
    }
  };

  const handleAddStore = async (newStore: NewStore) => {
    console.log("Starting store addition...");
    
    if (!newStore.marketplace || !newStore.name || !newStore.apiKey) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, заполните все поля",
        variant: "destructive",
      });
      return;
    }

    // Check if store limit has been reached
    if (stores.length >= storeLimit) {
      toast({
        title: "Ограничение тарифа",
        description: `Ваш тариф позволяет добавить максимум ${storeLimit} ${storeLimit === 1 ? 'магазин' : storeLimit < 5 ? 'магазина' : 'магазинов'}. Перейдите на более высокий тариф для добавления большего количества магазинов.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Validate API key before creating the store
      const isValidApiKey = await validateApiKey(newStore.apiKey);
      
      if (!isValidApiKey) {
        toast({
          title: "Ошибка API ключа",
          description: "Указанный API ключ некорректен. Пожалуйста, проверьте ключ и попробуйте снова.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Get current user from localStorage
      const userData = localStorage.getItem('user');
      const userId = userData ? JSON.parse(userData).id : null;

      const store: StoreType = {
        id: Date.now().toString(),
        marketplace: newStore.marketplace,
        name: newStore.name,
        apiKey: newStore.apiKey,
        isSelected: false,
        lastFetchDate: new Date().toISOString(),
        userId: userId
      };

      console.log("Created new store object:", store);

      const updatedStore = await refreshStoreStats(store);
      const storeToAdd = updatedStore || store;
      
      // Save data for Analytics and Dashboard
      if (updatedStore && updatedStore.stats) {
        const analyticsData = {
          storeId: store.id,
          dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          dateTo: new Date().toISOString(),
          data: updatedStore.stats,
          timestamp: Date.now()
        };
        
        localStorage.setItem(`marketplace_analytics_${store.id}`, JSON.stringify(analyticsData));
      }
      
      // Get all stores and add the new one
      const allStores = loadStores();
      
      // If this is the user's first store, mark it as selected and deselect others
      const userStoreCount = allStores.filter(s => s.userId === userId).length;
      
      if (userStoreCount === 0) {
        storeToAdd.isSelected = true;
        // Deselect all other stores
        allStores.forEach(s => {
          s.isSelected = false;
        });
      }
      
      const updatedStores = [...allStores, storeToAdd];
      
      // Update only current user's stores in state
      const userStores = userId 
        ? updatedStores.filter(s => s.userId === userId)
        : updatedStores;
      
      setStores(userStores);
      saveStores(updatedStores); // Save all stores
      
      console.log("Store added successfully:", storeToAdd);
      
      // Trigger selection event if this is the first store
      if (storeToAdd.isSelected) {
        window.dispatchEvent(new CustomEvent('store-selection-changed', { 
          detail: { storeId: storeToAdd.id, selected: true, timestamp: Date.now() } 
        }));
        
        if (onStoreSelect) {
          onStoreSelect({
            id: storeToAdd.id,
            apiKey: storeToAdd.apiKey
          });
        }
      }
      
      // Clear cache to ensure fresh data
      clearAllStoreCache();
      
      setIsOpen(false);
      toast({
        title: "Успешно",
        description: "Магазин успешно добавлен",
      });
    } catch (error) {
      console.error("Ошибка при добавлении магазина:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить магазин",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelection = (storeId: string) => {
    // Get all stores
    const allStores = loadStores();
    const updatedAllStores = allStores.map(store => ({
      ...store,
      isSelected: store.id === storeId
    }));
    
    // Update state only for current user's stores
    const userStores = currentUserId 
      ? updatedAllStores.filter(store => store.userId === currentUserId)
      : updatedAllStores;
    
    setStores(userStores);
    saveStores(updatedAllStores); // Save all stores

    // Save the selected store separately for better persistence
    localStorage.setItem('last_selected_store', JSON.stringify({
      storeId,
      timestamp: Date.now()
    }));

    // Clear cache for the selected store
    clearStoreCache(storeId);

    const selectedStore = stores.find(store => store.id === storeId);
    if (selectedStore && onStoreSelect) {
      onStoreSelect({
        id: selectedStore.id,
        apiKey: selectedStore.apiKey
      });
    }
  };

  const handleRefreshStats = async (store: StoreType) => {
    setIsLoading(true);
    try {
      const updatedStore = await refreshStoreStats(store);
      if (updatedStore) {
        // Get all stores
        const allStores = loadStores();
        const updatedAllStores = allStores.map(s => 
          s.id === store.id ? updatedStore : s
        );
        
        // Update state only for current user's stores
        const userStores = currentUserId 
          ? updatedAllStores.filter(s => s.userId === currentUserId)
          : updatedAllStores;
        
        setStores(userStores);
        saveStores(updatedAllStores); // Save all stores
        
        // Also update data for Analytics and Dashboard
        if (updatedStore.stats) {
          const analyticsData = {
            storeId: store.id,
            dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            dateTo: new Date().toISOString(),
            data: updatedStore.stats,
            timestamp: Date.now()
          };
          
          // Save data for analytics
          localStorage.setItem(`marketplace_analytics_${store.id}`, JSON.stringify(analyticsData));
        }
        
        toast({
          title: "Успешно",
          description: "Статистика магазина обновлена",
        });
      }
    } catch (error) {
      console.error("Ошибка при обновлении статистики:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статистику",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStore = (storeId: string) => {
    // Проверяем, можно ли удалять магазины
    if (!canDeleteStores) {
      toast({
        title: "Действие запрещено",
        description: "Удаление магазинов будет доступно через 1 месяц после активации тарифа",
        variant: "destructive",
      });
      return;
    }

    const storeToDelete = stores.find(store => store.id === storeId);
    if (!storeToDelete) return;

    // Get all stores and remove the one to delete
    const allStores = loadStores();
    const updatedAllStores = allStores.filter(store => store.id !== storeId);
    
    // Update state only for current user's stores
    const userStores = currentUserId 
      ? updatedAllStores.filter(store => store.userId === currentUserId)
      : updatedAllStores;
    
    // Clear all cache for the deleted store
    clearAllStoreCache();
    
    setStores(userStores);
    saveStores(updatedAllStores); // Save all stores
    
    localStorage.removeItem(`${STATS_STORAGE_KEY}_${storeId}`);
    localStorage.removeItem(`marketplace_analytics_${storeId}`);
    
    toast({
      title: "Магазин удален",
      description: `Магазин "${storeToDelete.name}" был успешно удален`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Магазины</h2>
          
          {/* Store count indicator */}
          <Badge variant="outline" className="flex items-center gap-1.5 ml-2 bg-blue-950/30 text-blue-400 border-blue-800">
            <Package2 className="h-3.5 w-3.5" />
            <span>{stores.length}/{storeLimit}</span>
          </Badge>
        </div>
        <AddStoreDialog
          isOpen={isOpen}
          isLoading={isLoading}
          onOpenChange={setIsOpen}
          onAddStore={handleAddStore}
          storeCount={stores.length}
          storeLimit={storeLimit}
        />
      </div>

      {isTrialExpired && (
        <Card className="border-amber-500 bg-amber-50/10">
          <CardContent className="pt-6">
            <p className="text-amber-500">
              Ваш пробный период закончился. Текущий тариф: Базовый (лимит {storeLimit} {storeLimit === 1 ? 'магазин' : 'магазина'}).
              Для получения расширенных возможностей перейдите на более высокий тариф.
            </p>
          </CardContent>
        </Card>
      )}

      {stores.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Store className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">У вас пока нет добавленных магазинов</p>
            {storeLimit > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Ваш текущий тариф позволяет добавить до {storeLimit} {storeLimit === 1 ? 'магазина' : storeLimit < 5 ? 'магазина' : 'магазинов'}
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              onToggleSelection={handleToggleSelection}
              onDelete={handleDeleteStore}
              onRefreshStats={handleRefreshStats}
              isLoading={isLoading}
              canDelete={canDeleteStores}
            />
          ))}
        </div>
      )}
    </div>
  );
}
