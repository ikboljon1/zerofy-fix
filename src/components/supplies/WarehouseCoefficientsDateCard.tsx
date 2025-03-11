import React, { useMemo } from 'react';
import { WarehouseCoefficient } from '@/types/supplies';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  CheckCircle, 
  XCircle,
  TruckIcon, 
  PackageOpen, 
  DollarSign,
  CalendarIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

interface WarehouseCoefficientsDateCardProps {
  coefficients: WarehouseCoefficient[];
  selectedWarehouseId?: number;
  title?: string;
}

const WarehouseCoefficientsDateCard: React.FC<WarehouseCoefficientsDateCardProps> = ({ 
  coefficients, 
  selectedWarehouseId,
  title = "Коэффициенты приемки"
}) => {
  // Filter coefficients by selected warehouse if provided
  const filteredCoefficients = useMemo(() => {
    let filtered = coefficients;
    
    if (selectedWarehouseId) {
      filtered = filtered.filter(c => c.warehouseID === selectedWarehouseId);
    }
    
    return filtered;
  }, [coefficients, selectedWarehouseId]);
  
  // Get the next 7 days from today instead of 14
  const next7Days = useMemo(() => {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      days.push(addDays(today, i));
    }
    
    return days;
  }, []);

  // Group coefficients by date and only keep the most recent data
  const groupedCoefficients = useMemo(() => {
    const grouped = new Map<string, Map<number, WarehouseCoefficient>>();
    
    // First group by date
    filteredCoefficients.forEach(coef => {
      const date = coef.date.split('T')[0];
      if (!grouped.has(date)) {
        grouped.set(date, new Map<number, WarehouseCoefficient>());
      }
      
      // Then for each date, keep only one coefficient per box type (the most recent one)
      const dateMap = grouped.get(date)!;
      dateMap.set(coef.boxTypeID, coef);
    });
    
    return grouped;
  }, [filteredCoefficients]);

  // Map box type IDs to names for easier reference
  const boxTypeNames = {
    2: 'Короба',
    5: 'Монопаллеты',
    6: 'Суперсейф'
  };

  if (filteredCoefficients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {selectedWarehouseId 
              ? "Нет данных о коэффициентах приемки для выбранного склада"
              : "Выберите склад для просмотра коэффициентов приёмки"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {next7Days.map((date) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const dayCoefficients = groupedCoefficients.get(dateStr);

              if (!dayCoefficients || dayCoefficients.size === 0) return null;

              return (
                <Card key={dateStr} className="shadow-sm">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {format(date, 'd MMMM', { locale: ru })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 py-2 space-y-2">
                    {Array.from(dayCoefficients.values()).map((coef, idx) => (
                      <div key={idx} className="border-b last:border-0 pb-2 last:pb-0">
                        <div className="flex justify-between items-center mb-1">
                          <Badge variant="outline" className="mr-2">
                            {boxTypeNames[coef.boxTypeID as keyof typeof boxTypeNames] || coef.boxTypeName}
                          </Badge>
                          <div className="flex items-center">
                            {coef.coefficient >= 0 && coef.allowUnload ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center">
                                      {coef.coefficient === 0 ? (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                      ) : (
                                        <span className="text-amber-500 font-medium">{coef.coefficient}x</span>
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {coef.coefficient === 0 
                                        ? "Бесплатная приемка" 
                                        : `Платная приемка (коэффициент ${coef.coefficient})`}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center">
                                      <XCircle className="h-4 w-4 text-red-500" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Приемка недоступна</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                          {coef.deliveryCoef && (
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <TruckIcon className="h-3 w-3" />
                                Логистика:
                              </span>
                              <span>{coef.deliveryCoef}</span>
                            </div>
                          )}
                          
                          {coef.storageCoef && (
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                Хранение:
                              </span>
                              <span>{coef.storageCoef}</span>
                            </div>
                          )}
                          
                          {coef.deliveryBaseLiter && (
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <PackageOpen className="h-3 w-3" />
                                Первый л:
                              </span>
                              <span>{coef.deliveryBaseLiter} ₽</span>
                            </div>
                          )}
                          
                          {coef.deliveryAdditionalLiter && (
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <PackageOpen className="h-3 w-3" />
                                Доп. л:
                              </span>
                              <span>{coef.deliveryAdditionalLiter} ₽</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
        
        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Бесплатная приемка</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-amber-500 font-medium">1.5x</span>
            <span>Платная приемка</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle className="h-4 w-4 text-red-500" />
            <span>Недоступно</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WarehouseCoefficientsDateCard;
