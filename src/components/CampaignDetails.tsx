import { Card } from "./ui/card";
import { useEffect, useState } from "react";
import { getAdvertCosts, getAdvertStats, getAdvertPayments } from "@/services/advertisingApi";
import { Button } from "./ui/button";
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface CampaignDetailsProps {
  campaignId: number;
  campaignName: string;
  apiKey: string;
  onBack: () => void;
}

const CampaignDetails = ({ campaignId, campaignName, apiKey, onBack }: CampaignDetailsProps) => {
  const [costs, setCosts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const dateTo = new Date();
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - 30);

      const [costsData, statsData, paymentsData] = await Promise.all([
        getAdvertCosts(dateFrom, dateTo, apiKey),
        getAdvertStats(dateFrom, dateTo, [campaignId], apiKey),
        getAdvertPayments(dateFrom, dateTo, apiKey)
      ]);

      const campaignCosts = costsData.filter(cost => cost.advertId === campaignId);
      setCosts(campaignCosts);
      setStats(statsData[0]);
      setPayments(paymentsData);

      toast({
        title: "Успех",
        description: "Данные успешно обновлены",
      });
    } catch (error) {
      console.error('Error fetching campaign data:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось загрузить данные",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [campaignId]);

  const StatCard = ({ title, value, icon: Icon, trend }: { title: string; value: string; icon: any; trend?: number }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 bg-primary/10 rounded-full">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            <span className="text-sm font-medium ml-1">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Button variant="ghost" onClick={onBack} className="mb-2">
            ← Назад к списку
          </Button>
          <h2 className="text-2xl font-bold">{campaignName}</h2>
        </div>
        <Button onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Показы"
            value={stats.views?.toLocaleString('ru-RU') || '0'}
            icon={TrendingUp}
          />
          <StatCard
            title="Клики"
            value={stats.clicks?.toLocaleString('ru-RU') || '0'}
            icon={TrendingDown}
            trend={stats.ctr}
          />
          <StatCard
            title="CTR"
            value={`${(stats.ctr || 0).toFixed(2)}%`}
            icon={TrendingUp}
          />
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6 bg-gradient-to-br from-[#fdfcfb] to-[#e2d1c3] dark:from-gray-800 dark:to-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-primary" />
            История затрат
          </h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto scrollbar-hide">
            {costs.length > 0 ? (
              costs.map((cost, index) => (
                <div key={index} className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 transition-all hover:translate-y-[-2px]">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg">{cost.updSum.toLocaleString('ru-RU')} ₽</span>
                    <span className="text-sm text-gray-500">
                      {format(new Date(cost.updTime), 'dd.MM.yyyy HH:mm')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">Нет данных о затратах</p>
            )}
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-[#accbee] to-[#e7f0fd] dark:from-gray-800 dark:to-gray-700">
          <h3 className="text-lg font-semibold mb-4">Подробная статистика</h3>
          {stats ? (
            <div className="space-y-4">
              {[
                { label: 'Показы', value: stats.views?.toLocaleString('ru-RU') || '0' },
                { label: 'Клики', value: stats.clicks?.toLocaleString('ru-RU') || '0' },
                { label: 'CTR', value: `${(stats.ctr || 0).toFixed(2)}%` },
                { label: 'Заказы', value: stats.orders?.toLocaleString('ru-RU') || '0' },
                { label: 'CR', value: `${(stats.cr || 0).toFixed(2)}%` },
                { label: 'Сумма', value: `${(stats.sum || 0).toLocaleString('ru-RU')} ₽` },
                { label: 'CPC', value: `${(stats.cpc || 0).toFixed(2)} ₽` },
                { label: 'Добавлено в корзину', value: stats.atbs?.toLocaleString('ru-RU') || '0' },
                { label: 'Заказано товаров', value: stats.shks?.toLocaleString('ru-RU') || '0' },
                { label: 'Сумма заказов', value: `${(stats.sum_price || 0).toLocaleString('ru-RU')} ₽` }
              ].map((item, index) => (
                <div key={index} className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">{item.label}</span>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">Загрузка статистики...</p>
          )}
        </Card>

        <Card className="p-6 bg-gradient-to-br from-[#d299c2] to-[#fef9d7] dark:from-gray-800 dark:to-gray-700">
          <h3 className="text-lg font-semibold mb-4">История пополнений</h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto scrollbar-hide">
            {payments.length > 0 ? (
              payments.map((payment, index) => (
                <div key={index} className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 transition-all hover:translate-y-[-2px]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-lg">{payment.sum.toLocaleString('ru-RU')} ₽</span>
                    <span className="text-sm text-gray-500">
                      {format(new Date(payment.date), 'dd.MM.yyyy')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">ID: {payment.id}</span>
                    <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                      {payment.type}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">Нет данных о пополнениях</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CampaignDetails;