
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, CheckCircle2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { initialTariffs, Tariff, fetchTariffs, updateTariff, createTariff, deleteTariff } from "@/data/tariffs";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type TariffFormData = {
  id: string;
  name: string;
  description: string;
  price: number;
  period: "monthly" | "yearly";
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  billingPeriod: string;
  storeLimit: number;
};

const TariffManagement = () => {
  const [tariffs, setTariffs] = useState<Tariff[]>(initialTariffs);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentTariff, setCurrentTariff] = useState<TariffFormData>({
    id: "",
    name: "",
    description: "",
    price: 0,
    period: "monthly",
    features: [],
    isPopular: false,
    isActive: true,
    billingPeriod: "Ежемесячно",
    storeLimit: 1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("available");
  const { toast } = useToast();

  useEffect(() => {
    loadTariffs();
  }, []);

  const loadTariffs = async () => {
    try {
      const data = await fetchTariffs();
      setTariffs(data);
    } catch (error) {
      console.error("Error loading tariffs:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить тарифы",
        variant: "destructive",
      });
    }
  };

  const handleEditTariff = (tariff: Tariff) => {
    setCurrentTariff({
      id: tariff.id,
      name: tariff.name,
      description: tariff.description,
      price: tariff.price,
      period: tariff.period,
      features: tariff.features,
      isPopular: tariff.isPopular,
      isActive: tariff.isActive,
      billingPeriod: tariff.billingPeriod,
      storeLimit: tariff.storeLimit
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteTariff = (tariff: Tariff) => {
    setCurrentTariff({
      id: tariff.id,
      name: tariff.name,
      description: tariff.description,
      price: tariff.price,
      period: tariff.period,
      features: tariff.features,
      isPopular: tariff.isPopular,
      isActive: tariff.isActive,
      billingPeriod: tariff.billingPeriod,
      storeLimit: tariff.storeLimit
    });
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteTariff = async () => {
    setIsSubmitting(true);
    try {
      const success = await deleteTariff(currentTariff.id);
      if (success) {
        setTariffs(tariffs.filter((t) => t.id !== currentTariff.id));
        toast({
          title: "Тариф удален",
          description: `Тариф "${currentTariff.name}" был успешно удален.`,
        });
      } else {
        throw new Error("Failed to delete tariff");
      }
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting tariff:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить тариф",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNewTariff = () => {
    setCurrentTariff({
      id: "",
      name: "",
      description: "",
      price: 0,
      period: "monthly",
      features: [],
      isPopular: false,
      isActive: true,
      billingPeriod: "Ежемесячно",
      storeLimit: 1
    });
    setIsAddDialogOpen(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCurrentTariff((prev) => ({
      ...prev,
      [name]: name === "price" || name === "storeLimit" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleFeaturesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const featuresArray = e.target.value
      .split("\n")
      .map((feature) => feature.trim())
      .filter((feature) => feature !== "");
    setCurrentTariff((prev) => ({ ...prev, features: featuresArray }));
  };

  const handlePeriodChange = (value: "monthly" | "yearly") => {
    setCurrentTariff((prev) => ({ 
      ...prev, 
      period: value,
      billingPeriod: value === "monthly" ? "Ежемесячно" : "Ежегодно"
    }));
  };

  const handleToggleChange = (name: "isPopular" | "isActive") => {
    setCurrentTariff((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const saveTariff = async () => {
    setIsSubmitting(true);
    try {
      if (!currentTariff.name || currentTariff.price <= 0) {
        toast({
          title: "Ошибка валидации",
          description: "Пожалуйста, заполните все обязательные поля",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (isEditDialogOpen) {
        // Update existing tariff
        const success = await updateTariff(currentTariff as Tariff);
        if (success) {
          const updatedTariffs = tariffs.map((t) =>
            t.id === currentTariff.id ? currentTariff as Tariff : t
          );
          setTariffs(updatedTariffs);
          setIsEditDialogOpen(false);
          toast({
            title: "Тариф обновлен",
            description: `Тариф "${currentTariff.name}" был успешно обновлен.`,
          });
        } else {
          throw new Error("Failed to update tariff");
        }
      } else {
        // Create new tariff
        const { id, ...newTariffData } = currentTariff;
        const newTariff = await createTariff(newTariffData);
        if (newTariff) {
          setTariffs([...tariffs, newTariff]);
          setIsAddDialogOpen(false);
          toast({
            title: "Тариф добавлен",
            description: `Тариф "${newTariff.name}" был успешно добавлен.`,
          });
        } else {
          throw new Error("Failed to create tariff");
        }
      }
    } catch (error) {
      console.error("Error saving tariff:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить тариф",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Управление тарифами</h2>
        <Button onClick={handleAddNewTariff}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить тариф
        </Button>
      </div>

      <Tabs defaultValue="available" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="available">Активные тарифы</TabsTrigger>
          <TabsTrigger value="archived">Архивные тарифы</TabsTrigger>
        </TabsList>

        <TabsContent value="available">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tariffs
              .filter((tariff) => tariff.isActive)
              .map((tariff) => (
                <Card
                  key={tariff.id}
                  className={`flex flex-col ${
                    tariff.isPopular
                      ? "border-blue-400 dark:border-blue-600"
                      : ""
                  }`}
                >
                  {tariff.isPopular && (
                    <div className="bg-blue-600 text-white text-center py-1 text-sm font-medium">
                      Популярный выбор
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {tariff.name}
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditTariff(tariff)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTariff(tariff)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardTitle>
                    <div className="text-3xl font-bold">
                      {tariff.price.toLocaleString()} ₽
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        /{tariff.period === "monthly" ? "мес" : "год"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tariff.description}
                    </p>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <ul className="space-y-2">
                      {tariff.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-1 shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="pt-2 flex flex-col items-start">
                    <div className="text-sm text-muted-foreground mb-2">
                      Лимит магазинов: {tariff.storeLimit === 999 ? "Неограничено" : tariff.storeLimit}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Период: {tariff.billingPeriod}
                    </div>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="archived">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tariffs
              .filter((tariff) => !tariff.isActive)
              .map((tariff) => (
                <Card
                  key={tariff.id}
                  className="flex flex-col opacity-75 hover:opacity-100 transition-opacity"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {tariff.name}
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditTariff(tariff)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTariff(tariff)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardTitle>
                    <div className="text-3xl font-bold">
                      {tariff.price.toLocaleString()} ₽
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        /{tariff.period === "monthly" ? "мес" : "год"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tariff.description}
                    </p>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="bg-destructive/10 text-destructive text-sm p-2 rounded mb-3">
                      Этот тариф находится в архиве и не отображается для
                      пользователей
                    </div>
                    <ul className="space-y-2">
                      {tariff.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-1 shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="pt-2 flex flex-col items-start">
                    <div className="text-sm text-muted-foreground mb-2">
                      Лимит магазинов: {tariff.storeLimit === 999 ? "Неограничено" : tariff.storeLimit}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Период: {tariff.billingPeriod}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            {tariffs.filter((tariff) => !tariff.isActive).length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                Нет архивных тарифов
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Tariff Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Добавить новый тариф</DialogTitle>
            <DialogDescription>
              Введите детали нового тарифного плана
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название тарифа</Label>
                <Input
                  id="name"
                  name="name"
                  value={currentTariff.name}
                  onChange={handleInputChange}
                  placeholder="Например: Базовый"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Стоимость (₽)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={currentTariff.price || ""}
                  onChange={handleInputChange}
                  placeholder="Например: 1500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                name="description"
                value={currentTariff.description}
                onChange={handleInputChange}
                placeholder="Краткое описание тарифа"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">
                Функции и возможности (каждая с новой строки)
              </Label>
              <Textarea
                id="features"
                value={currentTariff.features.join("\n")}
                onChange={handleFeaturesChange}
                placeholder="Например:
Базовая аналитика
Подключение 1 магазина
Отчеты о продажах"
                rows={6}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Период оплаты</Label>
                <RadioGroup
                  value={currentTariff.period}
                  onValueChange={(value) => handlePeriodChange(value as "monthly" | "yearly")}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <Label htmlFor="monthly" className="font-normal">
                      Ежемесячно
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yearly" id="yearly" />
                    <Label htmlFor="yearly" className="font-normal">
                      Ежегодно
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeLimit">Лимит магазинов</Label>
                <Input
                  id="storeLimit"
                  name="storeLimit"
                  type="number"
                  min="1"
                  max="999"
                  value={currentTariff.storeLimit || ""}
                  onChange={handleInputChange}
                  placeholder="Например: 1"
                />
                <p className="text-xs text-muted-foreground">
                  Введите 999 для неограниченного количества
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPopular"
                  checked={currentTariff.isPopular}
                  onCheckedChange={() => handleToggleChange("isPopular")}
                />
                <Label htmlFor="isPopular" className="font-normal">
                  Отметить как популярный
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={currentTariff.isActive}
                  onCheckedChange={() => handleToggleChange("isActive")}
                />
                <Label htmlFor="isActive" className="font-normal">
                  Активен (виден пользователям)
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={isSubmitting}
            >
              <X className="mr-2 h-4 w-4" />
              Отмена
            </Button>
            <Button onClick={saveTariff} disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="inline-block animate-spin mr-2">⟳</span>
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tariff Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать тариф</DialogTitle>
            <DialogDescription>
              Измените детали тарифного плана
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Название тарифа</Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={currentTariff.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price">Стоимость (₽)</Label>
                <Input
                  id="edit-price"
                  name="price"
                  type="number"
                  value={currentTariff.price || ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Описание</Label>
              <Textarea
                id="edit-description"
                name="description"
                value={currentTariff.description}
                onChange={handleInputChange}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-features">
                Функции и возможности (каждая с новой строки)
              </Label>
              <Textarea
                id="edit-features"
                value={currentTariff.features.join("\n")}
                onChange={handleFeaturesChange}
                rows={6}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Период оплаты</Label>
                <RadioGroup
                  value={currentTariff.period}
                  onValueChange={(value) => handlePeriodChange(value as "monthly" | "yearly")}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="monthly" id="edit-monthly" />
                    <Label htmlFor="edit-monthly" className="font-normal">
                      Ежемесячно
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yearly" id="edit-yearly" />
                    <Label htmlFor="edit-yearly" className="font-normal">
                      Ежегодно
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-storeLimit">Лимит магазинов</Label>
                <Input
                  id="edit-storeLimit"
                  name="storeLimit"
                  type="number"
                  min="1"
                  max="999"
                  value={currentTariff.storeLimit || ""}
                  onChange={handleInputChange}
                />
                <p className="text-xs text-muted-foreground">
                  Введите 999 для неограниченного количества
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isPopular"
                  checked={currentTariff.isPopular}
                  onCheckedChange={() => handleToggleChange("isPopular")}
                />
                <Label htmlFor="edit-isPopular" className="font-normal">
                  Отметить как популярный
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isActive"
                  checked={currentTariff.isActive}
                  onCheckedChange={() => handleToggleChange("isActive")}
                />
                <Label htmlFor="edit-isActive" className="font-normal">
                  Активен (виден пользователям)
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSubmitting}
            >
              <X className="mr-2 h-4 w-4" />
              Отмена
            </Button>
            <Button onClick={saveTariff} disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="inline-block animate-spin mr-2">⟳</span>
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Tariff Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удаление тарифа</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить тариф "{currentTariff.name}"? Это
              действие невозможно отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteTariff();
              }}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <span className="inline-block animate-spin mr-2">⟳</span>
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TariffManagement;
