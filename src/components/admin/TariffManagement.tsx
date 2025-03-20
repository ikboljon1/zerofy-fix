
import { useState, useEffect } from "react";
import { 
  Tag, 
  Plus, 
  PenSquare, 
  Trash2, 
  Check, 
  X, 
  CreditCard,
  BadgePercent,
  Store,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tariff, loadTariffs, saveTariffs } from "@/data/tariffs";
import { supabase } from "@/integrations/supabase/client";

interface TariffFormData {
  id: string;
  name: string;
  price: number;
  billingPeriod: string;
  features: string[];
  isPopular: boolean;
  storeLimit: number;
}

const TariffManagement = () => {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [selectedTariff, setSelectedTariff] = useState<TariffFormData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newFeature, setNewFeature] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTariffs = async () => {
      setIsLoading(true);
      try {
        const loadedTariffs = await loadTariffs();
        console.log("Загруженные тарифы:", loadedTariffs);
        setTariffs(loadedTariffs);
      } catch (error) {
        console.error("Ошибка при загрузке тарифов:", error);
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить тарифы. Используются стандартные значения.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTariffs();
  }, [toast]);

  const handleEditTariff = (tariff: Tariff) => {
    setSelectedTariff({ 
      ...tariff, 
      billingPeriod: convertPeriodToRussian(tariff.period)
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteTariff = (tariff: Tariff) => {
    setSelectedTariff({ 
      ...tariff, 
      billingPeriod: convertPeriodToRussian(tariff.period)
    });
    setIsDeleteDialogOpen(true);
  };

  const convertPeriodToRussian = (period: string): string => {
    switch (period) {
      case 'monthly': return 'месяц';
      case 'yearly': return 'год';
      case 'weekly': return 'неделя';
      case 'daily': return 'день';
      default: return 'месяц';
    }
  };

  const convertPeriodToEnglish = (period: string): 'monthly' | 'yearly' | 'weekly' | 'daily' => {
    switch (period) {
      case 'месяц': return 'monthly';
      case 'год': return 'yearly';
      case 'неделя': return 'weekly';
      case 'день': return 'daily';
      default: return 'monthly';
    }
  };

  const confirmDeleteTariff = async () => {
    if (selectedTariff) {
      setIsSaving(true);
      try {
        // Проверяем, есть ли пользователи с этим тарифом
        const { data: usersWithTariff, error: userCheckError } = await supabase
          .from('profiles')
          .select('id')
          .eq('tariff_id', selectedTariff.id);
          
        if (userCheckError) {
          throw new Error(`Ошибка при проверке пользователей: ${userCheckError.message}`);
        }
        
        if (usersWithTariff && usersWithTariff.length > 0) {
          toast({
            title: "Невозможно удалить тариф",
            description: `Этот тариф используется ${usersWithTariff.length} пользователями. Сначала переведите их на другой тариф.`,
            variant: "destructive"
          });
          setIsSaving(false);
          setIsDeleteDialogOpen(false);
          return;
        }
          
        // Удаляем тариф из базы данных
        const { error: deleteError } = await supabase
          .from('tariffs')
          .delete()
          .eq('id', selectedTariff.id);
          
        if (deleteError) {
          throw new Error(`Ошибка при удалении тарифа: ${deleteError.message}`);
        }
        
        const updatedTariffs = tariffs.filter((tariff) => tariff.id !== selectedTariff.id);
        const success = await saveTariffs(updatedTariffs);
        
        if (success) {
          setTariffs(updatedTariffs);
          toast({
            title: "Тариф удален",
            description: `Тариф "${selectedTariff.name}" был успешно удален.`,
          });
        } else {
          toast({
            title: "Предупреждение",
            description: "Тариф удален только локально. Изменения будут синхронизированы при восстановлении соединения.",
            variant: "warning"
          });
        }
      } catch (error) {
        console.error("Ошибка при удалении тарифа:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось удалить тариф. Повторите попытку позже.",
          variant: "destructive"
        });
      } finally {
        setIsSaving(false);
        setIsDeleteDialogOpen(false);
      }
    }
  };

  const saveTariffChanges = async () => {
    if (selectedTariff) {
      setIsSaving(true);
      try {
        const updatedTariff: Tariff = {
          id: selectedTariff.id,
          name: selectedTariff.name,
          price: selectedTariff.price,
          period: convertPeriodToEnglish(selectedTariff.billingPeriod),
          description: selectedTariff.id === '00000000-0000-0000-0000-000000000001' 
            ? 'Идеально для начинающих продавцов' 
            : selectedTariff.id === '00000000-0000-0000-0000-000000000002' 
              ? 'Для растущих магазинов' 
              : 'Комплексное решение для крупных продавцов',
          features: selectedTariff.features,
          isPopular: selectedTariff.isPopular,
          isActive: true,
          storeLimit: selectedTariff.storeLimit
        };

        // Сохраняем изменения в Supabase
        const { error } = await supabase
          .from('tariffs')
          .update({
            name: updatedTariff.name,
            price: updatedTariff.price,
            period: updatedTariff.period,
            description: updatedTariff.description,
            features: updatedTariff.features,
            is_popular: updatedTariff.isPopular,
            is_active: updatedTariff.isActive,
            store_limit: updatedTariff.storeLimit,
            updated_at: new Date().toISOString()
          })
          .eq('id', updatedTariff.id);
          
        if (error) {
          throw new Error(`Ошибка при обновлении тарифа: ${error.message}`);
        }

        const updatedTariffs = tariffs.map((tariff) => 
          (tariff.id === selectedTariff.id ? updatedTariff : tariff)
        );
        
        setTariffs(updatedTariffs);
        localStorage.setItem('app_tariffs', JSON.stringify(updatedTariffs));
        
        toast({
          title: "Изменения сохранены",
          description: "Данные тарифа были успешно обновлены.",
        });
      } catch (error) {
        console.error("Ошибка при сохранении тарифа:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось сохранить изменения. Повторите попытку позже.",
          variant: "destructive"
        });
      } finally {
        setIsSaving(false);
        setIsEditDialogOpen(false);
      }
    }
  };

  const addNewTariff = async () => {
    if (selectedTariff) {
      setIsSaving(true);
      try {
        const newTariffId = crypto.randomUUID();
        
        const newTariff: Tariff = {
          id: newTariffId,
          name: selectedTariff.name,
          price: selectedTariff.price,
          period: convertPeriodToEnglish(selectedTariff.billingPeriod),
          description: 'Новый тарифный план',
          features: selectedTariff.features,
          isPopular: selectedTariff.isPopular,
          isActive: true,
          storeLimit: selectedTariff.storeLimit || 1
        };
        
        // Сохраняем новый тариф в Supabase
        const { error } = await supabase
          .from('tariffs')
          .insert({
            id: newTariff.id,
            name: newTariff.name,
            price: newTariff.price,
            period: newTariff.period,
            description: newTariff.description,
            features: newTariff.features,
            is_popular: newTariff.isPopular,
            is_active: newTariff.isActive,
            store_limit: newTariff.storeLimit,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (error) {
          throw new Error(`Ошибка при создании тарифа: ${error.message}`);
        }
        
        const updatedTariffs = [...tariffs, newTariff];
        setTariffs(updatedTariffs);
        localStorage.setItem('app_tariffs', JSON.stringify(updatedTariffs));
        
        toast({
          title: "Тариф добавлен",
          description: `Тариф "${newTariff.name}" был успешно добавлен.`,
        });
      } catch (error) {
        console.error("Ошибка при добавлении тарифа:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось добавить тариф. Повторите попытку позже.",
          variant: "destructive"
        });
      } finally {
        setIsSaving(false);
        setIsAddDialogOpen(false);
      }
    }
  };

  const startAddingTariff = () => {
    setSelectedTariff({
      id: "",
      name: "",
      price: 0,
      billingPeriod: "месяц",
      features: [],
      isPopular: false,
      storeLimit: 1
    });
    setIsAddDialogOpen(true);
  };

  const addFeature = () => {
    if (selectedTariff && newFeature.trim()) {
      setSelectedTariff({
        ...selectedTariff,
        features: [...selectedTariff.features, newFeature.trim()],
      });
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    if (selectedTariff) {
      const updatedFeatures = [...selectedTariff.features];
      updatedFeatures.splice(index, 1);
      setSelectedTariff({
        ...selectedTariff,
        features: updatedFeatures,
      });
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("ru-RU").format(price);
  };

  const getStoreLimitText = (limit: number): string => {
    if (limit === 999) return "Неограниченно";
    return `${limit} ${limit === 1 ? 'магазин' : limit < 5 ? 'магазина' : 'магазинов'}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <BadgePercent className="h-5 w-5" />
              Управление тарифами
            </h2>
            <Button onClick={startAddingTariff} disabled={isSaving}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить тариф
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {tariffs.map((tariff) => (
              <Card key={tariff.id} className={`border-2 ${tariff.isPopular ? 'border-primary' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">{tariff.name}</h3>
                    {tariff.isPopular && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary/20 text-primary">
                        Популярный
                      </span>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <span className="text-3xl font-bold">{formatPrice(tariff.price)} ₽</span>
                    <span className="text-sm text-muted-foreground">/{convertPeriodToRussian(tariff.period)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4 text-blue-600">
                    <Store className="h-4 w-4" />
                    <span>{getStoreLimitText(tariff.storeLimit)}</span>
                  </div>
                  
                  <ul className="space-y-2 mb-6">
                    {tariff.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="flex gap-2 justify-end mt-auto">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditTariff(tariff)}
                      disabled={isSaving}
                    >
                      <PenSquare className="h-4 w-4 mr-1" />
                      Изменить
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDeleteTariff(tariff)}
                      disabled={isSaving}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Удалить
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Редактировать тариф</DialogTitle>
            <DialogDescription>
              Внесите изменения в данные тарифа
            </DialogDescription>
          </DialogHeader>
          {selectedTariff && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right text-sm">
                  Название
                </label>
                <Input
                  id="name"
                  value={selectedTariff.name}
                  onChange={(e) =>
                    setSelectedTariff({ ...selectedTariff, name: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="price" className="text-right text-sm">
                  Цена (₽)
                </label>
                <Input
                  id="price"
                  type="number"
                  value={selectedTariff.price}
                  onChange={(e) =>
                    setSelectedTariff({ ...selectedTariff, price: Number(e.target.value) })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="storeLimit" className="text-right text-sm">
                  Лимит магазинов
                </label>
                <Input
                  id="storeLimit"
                  type="number"
                  min="1"
                  max="999"
                  value={selectedTariff.storeLimit}
                  onChange={(e) =>
                    setSelectedTariff({ ...selectedTariff, storeLimit: Number(e.target.value) })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="billingPeriod" className="text-right text-sm">
                  Период
                </label>
                <select
                  id="billingPeriod"
                  value={selectedTariff.billingPeriod}
                  onChange={(e) =>
                    setSelectedTariff({ ...selectedTariff, billingPeriod: e.target.value })
                  }
                  className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="день">день</option>
                  <option value="неделя">неделя</option>
                  <option value="месяц">месяц</option>
                  <option value="год">год</option>
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="isPopular" className="text-right text-sm">
                  Популярный
                </label>
                <div className="col-span-3 flex items-center">
                  <input
                    type="checkbox"
                    id="isPopular"
                    checked={selectedTariff.isPopular}
                    onChange={(e) =>
                      setSelectedTariff({ ...selectedTariff, isPopular: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="isPopular" className="ml-2 text-sm">
                    Пометить как популярный тариф
                  </label>
                </div>
              </div>
              
              <div className="mt-2">
                <label className="text-sm font-medium mb-2 block">
                  Функции тарифа
                </label>
                <div className="space-y-2">
                  {selectedTariff.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input value={feature} readOnly className="flex-1" />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFeature(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Добавить функцию..."
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={addFeature} disabled={!newFeature.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={saveTariffChanges}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Удалить тариф</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить тариф?
            </DialogDescription>
          </DialogHeader>
          {selectedTariff && (
            <div className="grid gap-4 py-4">
              <div className="flex items-center justify-center gap-3 p-4 border rounded-lg bg-muted/50">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Tag className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium">{selectedTariff.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(selectedTariff.price)} ₽/{selectedTariff.billingPeriod}
                  </p>
                </div>
              </div>
              <p className="text-center text-muted-foreground">
                Это действие нельзя отменить. Тариф будет удален навсегда.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Отмена
            </Button>
            <Button variant="destructive" onClick={confirmDeleteTariff}>
              <Trash2 className="mr-2 h-4 w-4" />
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Добавить тариф</DialogTitle>
            <DialogDescription>
              Введите данные нового тарифа
            </DialogDescription>
          </DialogHeader>
          {selectedTariff && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="new-name" className="text-right text-sm">
                  Название
                </label>
                <Input
                  id="new-name"
                  value={selectedTariff.name}
                  onChange={(e) =>
                    setSelectedTariff({ ...selectedTariff, name: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="new-price" className="text-right text-sm">
                  Цена (₽)
                </label>
                <Input
                  id="new-price"
                  type="number"
                  value={selectedTariff.price}
                  onChange={(e) =>
                    setSelectedTariff({ ...selectedTariff, price: Number(e.target.value) })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="new-storeLimit" className="text-right text-sm">
                  Лимит магазинов
                </label>
                <Input
                  id="new-storeLimit"
                  type="number"
                  min="1"
                  max="999"
                  value={selectedTariff.storeLimit}
                  onChange={(e) =>
                    setSelectedTariff({ ...selectedTariff, storeLimit: Number(e.target.value) })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="new-billingPeriod" className="text-right text-sm">
                  Период
                </label>
                <select
                  id="new-billingPeriod"
                  value={selectedTariff.billingPeriod}
                  onChange={(e) =>
                    setSelectedTariff({ ...selectedTariff, billingPeriod: e.target.value })
                  }
                  className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="день">день</option>
                  <option value="неделя">неделя</option>
                  <option value="месяц">месяц</option>
                  <option value="год">год</option>
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="new-isPopular" className="text-right text-sm">
                  Популярный
                </label>
                <div className="col-span-3 flex items-center">
                  <input
                    type="checkbox"
                    id="new-isPopular"
                    checked={selectedTariff.isPopular}
                    onChange={(e) =>
                      setSelectedTariff({ ...selectedTariff, isPopular: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="new-isPopular" className="ml-2 text-sm">
                    Пометить как популярный тариф
                  </label>
                </div>
              </div>
              
              <div className="mt-2">
                <label className="text-sm font-medium mb-2 block">
                  Функции тарифа
                </label>
                <div className="space-y-2">
                  {selectedTariff.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input value={feature} readOnly className="flex-1" />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFeature(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Добавить функцию..."
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={addFeature} disabled={!newFeature.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Отмена
            </Button>
            <Button onClick={addNewTariff}>
              <Check className="mr-2 h-4 w-4" />
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TariffManagement;
