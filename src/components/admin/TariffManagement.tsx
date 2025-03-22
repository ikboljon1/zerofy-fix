import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { initialTariffs, Tariff } from "@/data/tariffs";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Edit, Plus, Trash2 } from 'lucide-react';

interface TariffFormData {
  id: string;
  name: string;
  price: number;
  billingPeriod: string;
  period: "monthly" | "yearly";
  description: string;
  features: string[];
  isPopular: boolean; // Changed from optional to required to match expected type
  isActive: boolean; // Changed from optional to required to match expected type
  storeLimit: number; // Changed from optional to required to match expected type
}

const TariffManagement = () => {
  const [tariffs, setTariffs] = useState<Tariff[]>(initialTariffs);
  const [isEditing, setIsEditing] = useState(false);
  const [tariffForm, setTariffForm] = useState<TariffFormData>({
    id: '',
    name: '',
    price: 0,
    billingPeriod: 'Месяц',
    period: 'monthly',
    description: '',
    features: [],
    isPopular: false,
    isActive: true,
    storeLimit: 1
  });
  const { toast } = useToast();

  useEffect(() => {
    // Load tariffs from local storage or initial data
    const storedTariffs = localStorage.getItem('tariffs');
    if (storedTariffs) {
      setTariffs(JSON.parse(storedTariffs));
    }
  }, []);

  useEffect(() => {
    // Save tariffs to local storage whenever it changes
    localStorage.setItem('tariffs', JSON.stringify(tariffs));
  }, [tariffs]);

  // Fix the setTariffForm call to include all required properties
const handleEdit = (tariff: Tariff) => {
  setTariffForm({
    billingPeriod: tariff.period === "monthly" ? "Месяц" : "Год",
    id: tariff.id,
    name: tariff.name,
    price: tariff.price,
    period: tariff.period,
    description: tariff.description,
    features: tariff.features,
    isPopular: tariff.isPopular || false, // Ensure it's never undefined
    isActive: tariff.isActive || true, // Ensure it's never undefined
    storeLimit: tariff.storeLimit || 1 // Ensure it's never undefined
  });
  
  setIsEditing(true);
};

const handleAddNew = () => {
  setTariffForm({
    billingPeriod: "Месяц",
    id: '',
    name: '',
    price: 0,
    period: 'monthly',
    description: '',
    features: [],
    isPopular: false, // Ensure it's never undefined
    isActive: true, // Ensure it's never undefined
    storeLimit: 1 // Ensure it's never undefined
  });
  
  setIsEditing(true);
};

  const handleSave = () => {
    if (tariffForm.name && tariffForm.price) {
      const newTariff = {
        id: tariffForm.id || Math.random().toString(36).substring(7),
        name: tariffForm.name,
        price: tariffForm.price,
        period: tariffForm.period,
        description: tariffForm.description,
        features: tariffForm.features,
        isPopular: tariffForm.isPopular,
        isActive: tariffForm.isActive,
        storeLimit: tariffForm.storeLimit
      };

      if (tariffForm.id) {
        // Editing existing tariff
        setTariffs(tariffs.map(tariff => tariff.id === tariffForm.id ? newTariff : tariff));
        toast({
          title: "Тариф обновлен",
          description: "Тариф успешно обновлен.",
        });
      } else {
        // Adding new tariff
        setTariffs([...tariffs, newTariff]);
        toast({
          title: "Тариф добавлен",
          description: "Новый тариф успешно добавлен.",
        });
      }

      setIsEditing(false);
    }
  };

  const handleDelete = (id: string) => {
    setTariffs(tariffs.filter(tariff => tariff.id !== id));
    toast({
      title: "Тариф удален",
      description: "Тариф успешно удален.",
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Управление тарифами</CardTitle>
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить тариф
            </Button>
          </div>
          <CardDescription>Редактируйте и управляйте тарифными планами</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Цена</TableHead>
                    <TableHead>Период</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tariffs.map((tariff) => (
                    <TableRow key={tariff.id}>
                      <TableCell>{tariff.name}</TableCell>
                      <TableCell>{tariff.price}</TableCell>
                      <TableCell>{tariff.period}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(tariff)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Редактировать
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(tariff.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Удалить
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {isEditing && (
              <Card className="bg-muted">
                <CardHeader>
                  <CardTitle>{tariffForm.id ? 'Редактировать тариф' : 'Добавить тариф'}</CardTitle>
                  <CardDescription>Заполните информацию о тарифе</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Название</Label>
                      <Input
                        id="name"
                        value={tariffForm.name}
                        onChange={(e) => setTariffForm({ ...tariffForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Цена</Label>
                      <Input
                        id="price"
                        type="number"
                        value={tariffForm.price}
                        onChange={(e) => setTariffForm({ ...tariffForm, price: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Описание</Label>
                    <Textarea
                      id="description"
                      value={tariffForm.description}
                      onChange={(e) => setTariffForm({ ...tariffForm, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="features">Особенности (каждая с новой строки)</Label>
                    <Textarea
                      id="features"
                      value={tariffForm.features.join('\n')}
                      onChange={(e) => setTariffForm({ ...tariffForm, features: e.target.value.split('\n') })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Период оплаты</Label>
                      {/* Fix the period type to restrict to only "monthly" | "yearly" */}
<Select
  value={tariffForm.period}
  onValueChange={(value: "monthly" | "yearly") => // Type constraint added
    setTariffForm({ ...tariffForm, period: value })
  }
>
  <SelectTrigger>
    <SelectValue placeholder="Выберите период" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="monthly">Ежемесячно</SelectItem>
    <SelectItem value="yearly">Ежегодно</SelectItem>
  </SelectContent>
</Select>
                    </div>
                    <div>
                      <Label htmlFor="storeLimit">Лимит магазинов</Label>
                      <Input
                        id="storeLimit"
                        type="number"
                        value={tariffForm.storeLimit}
                        onChange={(e) => setTariffForm({ ...tariffForm, storeLimit: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="isPopular">Популярный</Label>
                    <Switch
                      id="isPopular"
                      checked={tariffForm.isPopular}
                      onCheckedChange={(checked) => setTariffForm({ ...tariffForm, isPopular: checked })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="isActive">Активный</Label>
                    <Switch
                      id="isActive"
                      checked={tariffForm.isActive}
                      onCheckedChange={(checked) => setTariffForm({ ...tariffForm, isActive: checked })}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={handleCancel}>
                      Отмена
                    </Button>
                    <Button onClick={handleSave}>Сохранить</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TariffManagement;
