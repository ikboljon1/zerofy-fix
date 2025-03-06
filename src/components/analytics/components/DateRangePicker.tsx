
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';

interface DateRangePickerProps {
  isLoading?: boolean;
  onUpdate?: () => void;
  // Optional date-related props for components that need date filtering
  dateFrom?: Date;
  dateTo?: Date;
  setDateFrom?: Dispatch<SetStateAction<Date>>;
  setDateTo?: Dispatch<SetStateAction<Date>>;
}

const DateRangePicker = ({ 
  isLoading,
  onUpdate,
  dateFrom,
  dateTo,
  setDateFrom,
  setDateTo
}: DateRangePickerProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
      <div className="space-y-1">
        <h2 className="text-lg sm:text-xl font-semibold">Аналитика продаж и заказов</h2>
        <p className="text-sm text-muted-foreground">
          Данные за текущий день
        </p>
      </div>
      
      <div className="flex flex-wrap gap-3 items-center">
        <Button onClick={onUpdate} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Обновление...
            </>
          ) : (
            "Обновить данные"
          )}
        </Button>
      </div>
    </div>
  );
};

export default DateRangePicker;
