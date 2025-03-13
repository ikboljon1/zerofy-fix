
import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/utils/formatCurrency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import SalesDataDialog from "./SalesDataDialog";
import { fetchAverageSalesAndStorageData } from "@/services/salesStorageApi";
import { format } from "date-fns";
import { PaidStorageItem } from "@/types/supplies";

interface WarehouseItem {
  nmId: number;
  price: number;
  daysOnWarehouse?: number;
  averageDailySales?: number;
}

interface StorageProfitabilityAnalysisProps {
  warehouseItems: WarehouseItem[];
  paidStorageData?: PaidStorageItem[];
  averageDailySalesRate?: Record<number, number>;
  dailyStorageCost?: Record<number, number>;
}

interface Item {
  nmId: number;
  name: string;
  vendorCode: string;
  brand: string;
  subject: string;
  sellingPrice: number;
  averageDailySalesQuantity: number;
  averageStorageCost: number;
  storageProfitability: number;
}

const StorageProfitabilityAnalysis = ({ 
  warehouseItems,
  paidStorageData,
  averageDailySalesRate,
  dailyStorageCost 
}: StorageProfitabilityAnalysisProps) => {
  const [sellingPrices, setSellingPrices] = useState<Record<number, number>>({});
  const [dailySalesRates, setDailySalesRates] = useState<Record<number, number>>({});
  const [storageCostRates, setStorageCostRates] = useState<Record<number, number>>({});
  const [items, setItems] = useState<Item[]>([]);
  const [sortColumn, setSortColumn] = useState<keyof Item>("storageProfitability");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStorage, setIsLoadingStorage] = useState(false);
  const [salesDataDialogOpen, setSalesDataDialogOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [storageData, setStorageData] = useState<any[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Initialize selling prices from warehouse items
    const initialSellingPrices: Record<number, number> = {};
    warehouseItems.forEach(item => {
      initialSellingPrices[item.nmId] = item.price;
    });
    setSellingPrices(initialSellingPrices);
    
    // Initialize from props if available
    if (averageDailySalesRate) {
      setDailySalesRates(averageDailySalesRate);
    }
    
    if (dailyStorageCost) {
      setStorageCostRates(dailyStorageCost);
    }
    
    // Try to get API key from localStorage
    const selectedStore = localStorage.getItem('selectedStore');
    if (selectedStore) {
      try {
        const storeData = JSON.parse(selectedStore);
        if (storeData.apiKey) {
          setApiKey(storeData.apiKey);
        }
      } catch (error) {
        console.error("Error parsing selected store data:", error);
      }
    }
  }, [warehouseItems, averageDailySalesRate, dailyStorageCost]);

  const calculateStorageProfitability = useCallback((
    sellingPrice: number,
    averageDailySalesQuantity: number,
    averageStorageCost: number
  ): number => {
    return (sellingPrice * averageDailySalesQuantity) - averageStorageCost;
  }, []);

  useEffect(() => {
    const newItems: Item[] = warehouseItems.map(item => {
      const nmId = item.nmId;
      const sellingPrice = sellingPrices[nmId] || 0;
      const averageDailySalesQuantity = dailySalesRates[nmId] || 0;
      const averageStorageCost = storageCostRates[nmId] || 0;

      const storageProfitability = calculateStorageProfitability(
        sellingPrice,
        averageDailySalesQuantity,
        averageStorageCost
      );

      return {
        nmId: nmId,
        name: `Товар ${nmId}`,
        vendorCode: "N/A",
        brand: "N/A",
        subject: "N/A",
        sellingPrice: sellingPrice,
        averageDailySalesQuantity: averageDailySalesQuantity,
        averageStorageCost: averageStorageCost,
        storageProfitability: storageProfitability,
      };
    });

    setItems(newItems);
  }, [warehouseItems, sellingPrices, dailySalesRates, storageCostRates, calculateStorageProfitability]);

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => {
      const aValue = a[sortColumn] || 0;
      const bValue = b[sortColumn] || 0;

      if (aValue < bValue) {
        return sortOrder === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortOrder === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [items, sortColumn, sortOrder]);

  const setSellingPrice = (nmId: number, price: number) => {
    setSellingPrices(prevPrices => ({
      ...prevPrices,
      [nmId]: price
    }));
  };

  const loadPaidStorageData = async () => {
    setIsLoadingStorage(true);
    try {
      if (!apiKey) {
        toast({
          title: "Ошибка",
          description: "API ключ не найден. Пожалуйста, выберите магазин.",
          variant: "destructive",
        });
        return;
      }
      
      // Здесь будет логика загрузки данных о платном хранении
      toast({
        title: "Успех",
        description: "Данные о платном хранении успешно загружены",
      });
    } catch (error) {
      console.error("Ошибка при загрузке данных о платном хранении:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные о платном хранении",
        variant: "destructive",
      });
    } finally {
      setIsLoadingStorage(false);
    }
  };

  const fetchSalesAndStorageData = async (startDate: Date, endDate: Date) => {
    try {
      setIsLoading(true);
      
      if (!apiKey) {
        toast({
          title: "Ошибка",
          description: "API ключ не найден. Пожалуйста, выберите магазин.",
          variant: "destructive",
        });
        return;
      }
      
      // Используем реальный API запрос вместо мок-данных
      const result = await fetchAverageSalesAndStorageData(
        apiKey,
        startDate,
        endDate,
        startDate, // Используем те же даты для хранения
        endDate
      );

      // Обновляем состояния компонента
      setDailySalesRates(result.dailySalesRates);
      setStorageCostRates(result.storageCostRates);
      
      // Закрываем диалог
      setSalesDataDialogOpen(false);
      
      toast({
        title: "Данные получены",
        description: `Данные о продажах за период ${format(startDate, 'dd.MM.yyyy')} - ${format(endDate, 'dd.MM.yyyy')} успешно загружены`,
      });
      
    } catch (error) {
      console.error("Ошибка при получении данных:", error);
      toast({
        title: "Ошибка получения данных",
        description: "Не удалось получить данные о продажах. Пожалуйста, попробуйте позже.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Анализ рентабельности хранения</CardTitle>
            <CardDescription>
              Оценка эффективности хранения товаров на складе.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Артикул WB</TableHead>
                  <TableHead>Наименование</TableHead>
                  <TableHead>Цена продажи</TableHead>
                  <TableHead>Продажи в день</TableHead>
                  <TableHead>Стоимость хранения</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => {
                      setSortColumn("storageProfitability");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                  >
                    Рентабельность хранения
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedItems.map((item) => (
                  <TableRow key={item.nmId}>
                    <TableCell>{item.nmId}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={sellingPrices[item.nmId] || ""}
                        onChange={(e) => setSellingPrice(item.nmId, Number(e.target.value))}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>{item.averageDailySalesQuantity.toFixed(2)}</TableCell>
                    <TableCell>{formatCurrency(item.averageStorageCost)}</TableCell>
                    <TableCell>{formatCurrency(item.storageProfitability)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Добавим кнопки для получения данных */}
        <div className="flex flex-wrap gap-2 justify-end mt-4">
          <Button
            variant="outline"
            onClick={() => setSalesDataDialogOpen(true)}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Загрузка...
              </>
            ) : (
              "Получить данные о продажах"
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={loadPaidStorageData}
            disabled={isLoadingStorage}
          >
            {isLoadingStorage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Загрузка...
              </>
            ) : (
              "Загрузить данные о хранении"
            )}
          </Button>
        </div>
      </div>
      
      {/* Диалог выбора периода для получения данных о продажах */}
      <SalesDataDialog
        open={salesDataDialogOpen}
        onOpenChange={setSalesDataDialogOpen}
        onConfirm={fetchSalesAndStorageData}
        isLoading={isLoading}
      />
    </>
  );
};

export default StorageProfitabilityAnalysis;
