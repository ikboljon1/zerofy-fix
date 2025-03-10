
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { BrainCircuit, Settings, AlertTriangle, Loader2 } from "lucide-react";
import { 
  getAISettings, 
  analyzeData, 
  getSavedRecommendations 
} from "@/services/aiService";
import { AIRecommendation, AIAnalysisRequest } from "@/types/ai";
import AISettingsDialog from "./AISettingsDialog";
import AIRecommendationCard from "./AIRecommendationCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { ru } from "date-fns/locale";

interface AIAnalysisSectionProps {
  storeId: string;
  analyticsData: any;
  dateFrom: Date;
  dateTo: Date;
}

const AIAnalysisSection = ({ storeId, analyticsData, dateFrom, dateTo }: AIAnalysisSectionProps) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [aiSettings, setAiSettings] = useState(getAISettings());

  useEffect(() => {
    loadRecommendations();
  }, [storeId]);

  useEffect(() => {
    setAiSettings(getAISettings());
  }, [isSettingsOpen]);

  const loadRecommendations = () => {
    try {
      if (storeId) {
        const savedRecommendations = getSavedRecommendations(storeId);
        setRecommendations(savedRecommendations);
      }
    } catch (error) {
      console.error('Ошибка при загрузке рекомендаций:', error);
    }
  };

  const dismissRecommendation = (id: string) => {
    try {
      const updatedRecommendations = recommendations.filter(rec => rec.id !== id);
      setRecommendations(updatedRecommendations);
      
      if (storeId) {
        const savedRecommendations = getSavedRecommendations(storeId);
        const filteredSavedRecommendations = savedRecommendations.filter(rec => rec.id !== id);
        
        // Сохраняем обновленный список рекомендаций
        localStorage.setItem(
          `marketplace_ai_recommendations_${storeId}`, 
          JSON.stringify(filteredSavedRecommendations)
        );
      }
    } catch (error) {
      console.error('Ошибка при удалении рекомендации:', error);
    }
  };

  const handleAnalyze = async () => {
    if (!analyticsData) {
      toast({
        title: "Нет данных для анализа",
        description: "Сначала загрузите данные аналитики",
        variant: "destructive"
      });
      return;
    }

    const settings = getAISettings();
    if (!settings.isEnabled || !settings.apiKey) {
      toast({
        title: "AI анализ не настроен",
        description: "Откройте настройки AI и введите API ключ",
        variant: "destructive"
      });
      setIsSettingsOpen(true);
      return;
    }

    setIsAnalyzing(true);

    try {
      // Подготовка данных для отправки в AI
      const request: AIAnalysisRequest = {
        context: {
          period: {
            from: dateFrom.toISOString().split('T')[0],
            to: dateTo.toISOString().split('T')[0]
          },
          sales: {
            total: analyticsData.currentPeriod.sales,
            previousPeriod: analyticsData.previousPeriod?.sales,
            dailySales: analyticsData.dailySales?.map((day: any) => ({
              date: day.date,
              sales: day.sales
            }))
          },
          expenses: {
            total: analyticsData.currentPeriod.expenses.total,
            logistics: analyticsData.currentPeriod.expenses.logistics,
            storage: analyticsData.currentPeriod.expenses.storage,
            penalties: analyticsData.currentPeriod.expenses.penalties,
            advertising: analyticsData.currentPeriod.expenses.advertising,
            acceptance: analyticsData.currentPeriod.expenses.acceptance,
            deductions: analyticsData.currentPeriod.expenses.deductions
          }
        },
        requestType: 'full_analysis'
      };

      // Добавляем данные о товарах, если они есть
      if (analyticsData.topProfitableProducts || analyticsData.topUnprofitableProducts) {
        request.context.products = {
          topProfitable: (analyticsData.topProfitableProducts || []).map((product: any) => ({
            name: product.name,
            profit: parseFloat(product.profit.replace(/[^\d.-]/g, '')),
            margin: product.margin,
            quantitySold: product.quantitySold
          })),
          topUnprofitable: (analyticsData.topUnprofitableProducts || []).map((product: any) => ({
            name: product.name,
            profit: parseFloat(product.profit.replace(/[^\d.-]/g, '')),
            margin: product.margin,
            quantitySold: product.quantitySold
          }))
        };
      }

      // Добавляем данные о возвратах, если они есть
      if (analyticsData.productReturns) {
        request.context.returns = analyticsData.productReturns;
      }

      const newRecommendations = await analyzeData(request, storeId);
      setRecommendations([...newRecommendations, ...recommendations]);

      toast({
        title: "Анализ завершен",
        description: "Получены новые рекомендации от AI",
      });
    } catch (error) {
      console.error('Ошибка при анализе данных:', error);
      toast({
        title: "Ошибка анализа",
        description: error instanceof Error ? error.message : "Не удалось проанализировать данные",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredRecommendations = activeTab === "all" 
    ? recommendations 
    : recommendations.filter(rec => rec.category === activeTab);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-primary" />
              <CardTitle>AI-анализ данных</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Настройки
              </Button>
              <Button 
                size="sm" 
                onClick={handleAnalyze} 
                disabled={isAnalyzing || !aiSettings.isEnabled}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Анализ...
                  </>
                ) : (
                  "Анализировать"
                )}
              </Button>
            </div>
          </div>
          <CardDescription>
            Автоматический анализ данных и рекомендации по оптимизации работы магазина
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!aiSettings.isEnabled ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">AI-анализ отключен</h3>
              <p className="text-muted-foreground max-w-md mb-4">
                Включите AI-анализ в настройках и введите API ключ, чтобы получать рекомендации по оптимизации работы магазина
              </p>
              <Button onClick={() => setIsSettingsOpen(true)}>
                Открыть настройки
              </Button>
            </div>
          ) : recommendations.length > 0 ? (
            <div className="space-y-4">
              <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">Все</TabsTrigger>
                  <TabsTrigger value="sales">Продажи</TabsTrigger>
                  <TabsTrigger value="expenses">Расходы</TabsTrigger>
                  <TabsTrigger value="products">Товары</TabsTrigger>
                  <TabsTrigger value="advertising">Реклама</TabsTrigger>
                  <TabsTrigger value="general">Общее</TabsTrigger>
                </TabsList>
                
                <TabsContent value={activeTab} className="space-y-4 mt-0">
                  {filteredRecommendations.length > 0 ? (
                    filteredRecommendations.map(recommendation => (
                      <AIRecommendationCard 
                        key={recommendation.id} 
                        recommendation={recommendation}
                        onDismiss={dismissRecommendation}
                      />
                    ))
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      Рекомендации в выбранной категории отсутствуют
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BrainCircuit className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Нет рекомендаций</h3>
              <p className="text-muted-foreground max-w-md mb-4">
                Нажмите кнопку "Анализировать", чтобы получить рекомендации по оптимизации работы магазина на основе ваших данных
              </p>
              <Button onClick={handleAnalyze} disabled={isAnalyzing}>
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Анализ...
                  </>
                ) : (
                  "Анализировать"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <AISettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </div>
  );
};

export default AIAnalysisSection;
