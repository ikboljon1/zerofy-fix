
import { Store } from "@/types/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Target } from "lucide-react";

interface StoreCardProps {
  store: Store;
  onToggleSelection: (id: string) => void;
  onDelete: (id: string) => void;
  onRefreshStats: (store: Store) => void;
  isLoading: boolean;
}

export function StoreCard({ 
  store, 
  onToggleSelection, 
  onDelete, 
  onRefreshStats,
  isLoading 
}: StoreCardProps) {
  return (
    <Card className={store.isSelected ? "border-primary" : ""}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">{store.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={store.isSelected}
              onCheckedChange={() => onToggleSelection(store.id)}
              className="mt-1"
            />
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive/90"
              onClick={() => onDelete(store.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Маркетплейс:</span>
            <span className="font-medium">{store.marketplace}</span>
          </div>
          {store.stats && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Продажи:</span>
                <span className="font-medium">{store.stats.currentPeriod.sales.toLocaleString()} ₽</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Перечислено:</span>
                <span className="font-medium">{store.stats.currentPeriod.transferred.toLocaleString()} ₽</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Расходы:</span>
                <span className="font-medium">{store.stats.currentPeriod.expenses.total.toLocaleString()} ₽</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Чистая прибыль:</span>
                <span className="font-medium">{store.stats.currentPeriod.netProfit.toLocaleString()} ₽</span>
              </div>
            </>
          )}
          
          {store.adsStats && (
            <>
              <div className="mt-4 pt-2 border-t">
                <div className="flex items-center gap-1 mb-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="font-medium">Реклама:</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Всего расходов:</span>
                  <span className="font-medium">{store.adsStats.total.toLocaleString()} ₽</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Поисковая реклама:</span>
                  <span className="font-medium">{store.adsStats.searchAds.toLocaleString()} ₽</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Баннерная реклама:</span>
                  <span className="font-medium">{store.adsStats.bannerAds.toLocaleString()} ₽</span>
                </div>
              </div>
            </>
          )}
          
          <Button 
            variant="outline" 
            className="w-full mt-4"
            onClick={() => onRefreshStats(store)}
            disabled={isLoading}
          >
            Обновить статистику
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
