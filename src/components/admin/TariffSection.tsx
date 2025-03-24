import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { 
  BadgeDollarSign, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  Info,
  Store
} from "lucide-react";
import { Tariff, initialTariffs } from "@/data/tariffs";

export default function TariffSection() {
  const [tariffs, setTariffs] = useState<Tariff[]>(initialTariffs);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentTariff, setCurrentTariff] = useState<Tariff | null>(null);
  const [newFeature, setNewFeature] = useState('');
  const { toast } = useToast();

  const handleEdit = (tariff: Tariff) => {
    setCurrentTariff({...tariff});
    setIsEditDialogOpen(true);
  };

  const handleSave = () => {
    if (!currentTariff) return;
    
    if (currentTariff.id) {
      setTariffs(tariffs.map(t => t.id === currentTariff.id ? currentTariff : t));
      toast({
        title: "Тариф обновлен",
        description: `Тариф "${currentTariff.name}" успешно обновлен`,
      });
    } else {
      const newTariff = {
        ...currentTariff,
        id: String(Date.now()),
      };
      setTariffs([...tariffs, newTariff]);
      toast({
        title: "Тариф добавлен",
        description: `Тариф "${newTariff.name}" успешно добавлен`,
      });
    }
    
    setIsEditDialogOpen(false);
    setCurrentTariff(null);
  };

  const handleDelete = (id: string) => {
    setTariffs(tariffs.filter(t => t.id !== id));
    toast({
      title: "Тариф удален",
      description: "Тариф был успешно удален",
      variant: "destructive",
    });
  };

  const handleAddFeature = () => {
    if (!newFeature || !currentTariff) return;
    
    setCurrentTariff({
      ...currentTariff,
      features: [...currentTariff.features, newFeature]
    });
    
    setNewFeature('');
  };

  const handleRemoveFeature = (index: number) => {
    if (!currentTariff) return;
    
    const newFeatures = [...currentTariff.features];
    newFeatures.splice(index, 1);
    
    setCurrentTariff({
      ...currentTariff,
      features: newFeatures
    });
  };

  const handleToggleStatus = (id: string) => {
    setTariffs(tariffs.map(t => {
      if (t.id === id) {
        const newStatus = !t.isActive;
        toast({
          title: newStatus ? "Тариф активирован" : "Тариф деактивирован",
          description: `Тариф "${t.name}" теперь ${newStatus ? "доступен" : "недоступен"} для пользователей`,
        });
        return { ...t, isActive: newStatus };
      }
      return t;
    }));
  };

  const handleAddNew = () => {
    setCurrentTariff({
      id: '',
      name: 'Новый тариф',
      price: 0,
      period: 'monthly',
      description: 'Описание тарифа',
      features: [],
      isPopular: false,
      isActive: true,
      storeLimit: 1
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <BadgeDollarSign className="h-6 w-6 text-blue-500" />
            Управление тарифами
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Настройте доступные тарифные планы для пользователей
          </p>
        </div>
        <Button 
          onClick={handleAddNew}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Добавить тариф
        </Button>
      </div>

      <Tabs defaultValue="grid" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="grid" className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-grid">
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
              Карточки
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-table">
                <path d="M12 3v18" />
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M3 9h18" />
                <path d="M3 15h18" />
              </svg>
              Таблица
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="grid">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tariffs.map((tariff) => (
              <motion.div
                key={tariff.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className={`border-2 h-full flex flex-col ${
                  tariff.isPopular 
                    ? 'border-blue-400 dark:border-blue-600 shadow-lg' 
                    : 'border-gray-200 dark:border-gray-700'
                } ${
                  !tariff.isActive ? 'opacity-70' : ''
                }`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl text-gray-800 dark:text-white">
                          {tariff.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {tariff.description}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        {tariff.isPopular && (
                          <Badge className="bg-blue-500">Популярный</Badge>
                        )}
                        {!tariff.isActive && (
                          <Badge variant="outline" className="text-gray-500 border-gray-300">
                            Неактивен
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="text-3xl font-bold text-gray-800 dark:text-white">
                        {tariff.price} ₽
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 ml-1">
                        /{tariff.period === 'monthly' ? 'мес' : 'год'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="mb-3 flex items-center text-blue-600 dark:text-blue-400 font-medium">
                      <Store className="mr-2 h-5 w-5" />
                      {tariff.storeLimit === 999 ? 
                        'Неограниченное количество магазинов' : 
                        `До ${tariff.storeLimit} ${tariff.storeLimit === 1 ? 'магазина' : 'магазинов'}`
                      }
                    </div>
                    <ul className="space-y-2">
                      {tariff.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(tariff)}
                      className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Изменить
                    </Button>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(tariff.id)}
                        className={tariff.isActive ? "text-amber-600" : "text-green-600"}
                      >
                        {tariff.isActive ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(tariff.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardContent className="p-0">
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-gray-700 dark:text-gray-300">
                        Название
                      </th>
                      <th scope="col" className="px-6 py-3 text-gray-700 dark:text-gray-300">
                        Цена
                      </th>
                      <th scope="col" className="px-6 py-3 text-gray-700 dark:text-gray-300">
                        Период
                      </th>
                      <th scope="col" className="px-6 py-3 text-gray-700 dark:text-gray-300">
                        Лимит магазинов
                      </th>
                      <th scope="col" className="px-6 py-3 text-gray-700 dark:text-gray-300">
                        Статус
                      </th>
                      <th scope="col" className="px-6 py-3 text-gray-700 dark:text-gray-300">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tariffs.map((tariff) => (
                      <tr 
                        key={tariff.id} 
                        className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-6 py-4 font-medium text-gray-800 dark:text-white">
                          <div className="flex items-center gap-2">
                            {tariff.name}
                            {tariff.isPopular && (
                              <Badge className="bg-blue-500">Популярный</Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {tariff.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-800 dark:text-white">
                          {tariff.price} ₽
                        </td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                          {tariff.period === 'monthly' ? 'Месячный' : 'Годовой'}
                        </td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                          {tariff.storeLimit === 999 ? 'Неограниченно' : tariff.storeLimit}
                        </td>
                        <td className="px-6 py-4">
                          <Badge 
                            variant={tariff.isActive ? "success" : "outline"}
                            className={`${tariff.isActive 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                              : 'text-gray-600 dark:text-gray-400'}`}
                          >
                            {tariff.isActive ? 'Активен' : 'Неактивен'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(tariff)}
                              className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(tariff.id)}
                              className={tariff.isActive 
                                ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20" 
                                : "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"}
                            >
                              {tariff.isActive ? (
                                <XCircle className="h-4 w-4" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(tariff.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentTariff?.id ? 'Редактирование тарифа' : 'Добавление нового тарифа'}
            </DialogTitle>
            <DialogDescription>
              Заполните информацию о тарифном плане для пользователей
            </DialogDescription>
          </DialogHeader>

          {currentTariff && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Название тарифа</Label>
                  <Input
                    id="name"
                    value={currentTariff.name}
                    onChange={(e) => setCurrentTariff({...currentTariff, name: e.target.value})}
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                  />
                </div>
                
                <div>
                  <Label htmlFor="price" className="text-gray-700 dark:text-gray-300">Цена (₽)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={currentTariff.price}
                    onChange={(e) => setCurrentTariff({...currentTariff, price: Number(e.target.value)})}
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                  />
                </div>
                
                <div>
                  <Label htmlFor="period" className="text-gray-700 dark:text-gray-300">Период оплаты</Label>
                  <div className="flex gap-4 mt-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="monthly"
                        checked={currentTariff.period === 'monthly'}
                        onChange={() => setCurrentTariff({...currentTariff, period: 'monthly'})}
                        className="h-4 w-4 text-blue-600"
                      />
                      <Label htmlFor="monthly" className="text-gray-700 dark:text-gray-300">Месячный</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="yearly"
                        checked={currentTariff.period === 'yearly'}
                        onChange={() => setCurrentTariff({...currentTariff, period: 'yearly'})}
                        className="h-4 w-4 text-blue-600"
                      />
                      <Label htmlFor="yearly" className="text-gray-700 dark:text-gray-300">Годовой</Label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-gray-700 dark:text-gray-300">Описание</Label>
                  <Textarea
                    id="description"
                    value={currentTariff.description}
                    onChange={(e) => setCurrentTariff({...currentTariff, description: e.target.value})}
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPopular"
                    checked={currentTariff.isPopular}
                    onCheckedChange={(checked) => setCurrentTariff({...currentTariff, isPopular: checked})}
                  />
                  <Label htmlFor="isPopular" className="text-gray-700 dark:text-gray-300">Отметить как популярный</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={currentTariff.isActive}
                    onCheckedChange={(checked) => setCurrentTariff({...currentTariff, isActive: checked})}
                  />
                  <Label htmlFor="isActive" className="text-gray-700 dark:text-gray-300">Активен</Label>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="storeLimit" className="text-gray-700 dark:text-gray-300">Лимит магазинов</Label>
                  <Input
                    id="storeLimit"
                    type="number"
                    min="1"
                    max="999"
                    value={currentTariff.storeLimit}
                    onChange={(e) => setCurrentTariff({...currentTariff, storeLimit: Number(e.target.value)})}
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                  />
                  <p className="text-xs text-gray-500">Установите 999 для неограниченного количества</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    Функции тарифа
                    <Info className="h-4 w-4 text-gray-400" />
                  </Label>
                  
                  <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-900 min-h-[12rem] mt-2">
                    <ul className="space-y-2">
                      {currentTariff.features.map((feature, index) => (
                        <li key={index} className="flex items-center group">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 shrink-0" />
                          <span className="flex-1 text-gray-700 dark:text-gray-300">{feature}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(index)}
                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                    
                    {currentTariff.features.length === 0 && (
                      <div className="text-gray-400 text-center py-4">
                        Нет добавленных функций
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Добавить новую функцию"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddFeature()}
                    />
                    <Button type="button" variant="outline" onClick={handleAddFeature}>
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
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
