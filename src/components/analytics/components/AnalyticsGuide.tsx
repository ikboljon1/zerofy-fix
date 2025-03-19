
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ChevronDown, 
  ChevronUp, 
  PieChart, 
  LineChart, 
  BarChart, 
  Info, 
  Search, 
  TrendingUp, 
  ShoppingBag, 
  Calendar,
  HelpCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const AnalyticsGuide: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-gray-900 to-indigo-950 dark:from-gray-900 dark:to-indigo-950/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-900/50 shadow-inner">
              <HelpCircle className="h-4 w-4 text-indigo-400" />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-400 font-bold">
              Руководство по аналитике данных
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <p className="text-gray-300 mb-4">
              Это руководство поможет вам эффективно использовать аналитический раздел для принятия обоснованных бизнес-решений.
            </p>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="intro" className="border rounded-lg mb-3 px-3 py-1 border-indigo-800/40">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-indigo-400" />
                    <span className="font-medium text-gray-200">Основы аналитики и показатели</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-6 mt-1 space-y-2">
                    <p className="text-gray-300">Аналитический раздел предоставляет доступ к ключевым показателям вашего бизнеса:</p>
                    <ul className="list-disc pl-6 space-y-1 text-gray-400">
                      <li><span className="font-medium text-gray-200">Выручка</span> - общая сумма продаж за выбранный период.</li>
                      <li><span className="font-medium text-gray-200">Прибыль</span> - доход после вычета всех расходов и комиссий.</li>
                      <li><span className="font-medium text-gray-200">Средний чек</span> - средняя сумма заказа.</li>
                      <li><span className="font-medium text-gray-200">Количество заказов</span> - общее число заказов за период.</li>
                      <li><span className="font-medium text-gray-200">Конверсия</span> - отношение заказов к просмотрам.</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="charts" className="border rounded-lg mb-3 px-3 py-1 border-blue-800/40">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <LineChart className="h-4 w-4 text-blue-400" />
                    <span className="font-medium text-gray-200">Работа с графиками и диаграммами</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-6 mt-1 space-y-2">
                    <p className="text-gray-300">В системе представлены различные типы визуализаций:</p>
                    <ul className="list-disc pl-6 space-y-3">
                      <li>
                        <div className="font-medium text-gray-200 flex items-center gap-1">
                          <LineChart className="h-4 w-4 text-blue-400" /> Линейные графики
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          Отображают тренды продаж и заказов во времени. Наведите курсор на точки графика для просмотра детальной информации.
                        </p>
                      </li>
                      <li>
                        <div className="font-medium text-gray-200 flex items-center gap-1">
                          <PieChart className="h-4 w-4 text-purple-400" /> Круговые диаграммы
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          Показывают распределение продаж по категориям товаров. Щелкните на сегмент для выделения.
                        </p>
                      </li>
                      <li>
                        <div className="font-medium text-gray-200 flex items-center gap-1">
                          <BarChart className="h-4 w-4 text-indigo-400" /> Столбчатые диаграммы
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          Сравнивают продажи различных товаров или периодов. Позволяют легко определить лидеров продаж.
                        </p>
                      </li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="periods" className="border rounded-lg mb-3 px-3 py-1 border-green-800/40">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-400" />
                    <span className="font-medium text-gray-200">Выбор периода анализа</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-6 mt-1 space-y-2">
                    <p className="text-gray-300">Для изменения временного периода анализа:</p>
                    <ol className="list-decimal pl-6 space-y-1 text-gray-400">
                      <li>Используйте селектор периода в верхней части экрана.</li>
                      <li>Доступны предустановленные периоды: сегодня, вчера, неделя, месяц и год.</li>
                      <li>Для более точного анализа выберите конкретный диапазон дат.</li>
                      <li>Сравнивайте текущий период с предыдущим для отслеживания динамики.</li>
                    </ol>
                    <div className="bg-blue-950/30 p-2 rounded-md mt-2">
                      <p className="text-sm flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-400 mt-0.5" />
                        <span className="text-gray-300">При использовании сравнения периодов учитывайте сезонность и праздничные дни, которые могут влиять на результаты.</span>
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="products" className="border rounded-lg mb-3 px-3 py-1 border-amber-800/40">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-amber-400" />
                    <span className="font-medium text-gray-200">Анализ продуктов и категорий</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-6 mt-1 space-y-2">
                    <p className="text-gray-300">Для эффективного анализа продуктов:</p>
                    <ul className="list-disc pl-6 space-y-1 text-gray-400">
                      <li>Изучайте рейтинг товаров по популярности для определения бестселлеров.</li>
                      <li>Анализируйте распределение продаж по категориям с помощью круговых диаграмм.</li>
                      <li>Отслеживайте временные тренды продаж конкретных товаров.</li>
                      <li>Обращайте внимание на товары с высокой доходностью и низким объемом возвратов.</li>
                    </ul>
                    
                    <div className="bg-amber-950/30 p-3 rounded-md mt-3">
                      <h4 className="font-medium mb-1 flex items-center gap-1 text-gray-200">
                        <TrendingUp className="h-4 w-4 text-amber-400" />
                        Как улучшить продажи:
                      </h4>
                      <ul className="list-disc pl-6 space-y-1 text-sm text-gray-400">
                        <li>Увеличьте поставки товаров с высоким спросом и низким уровнем отказов.</li>
                        <li>Пересмотрите стратегию для товаров с высоким процентом возвратов.</li>
                        <li>Корректируйте рекламные кампании на основе данных о популярности товаров.</li>
                        <li>Отслеживайте сезонность продаж при планировании поставок.</li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="advanced" className="border rounded-lg mb-3 px-3 py-1 border-purple-800/40">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-purple-400" />
                    <span className="font-medium text-gray-200">Углубленный анализ и поиск закономерностей</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-6 mt-1 space-y-2">
                    <p className="text-gray-300">Для проведения углубленного анализа:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>
                        <p className="font-medium text-gray-200">Корреляция метрик</p>
                        <p className="text-sm text-gray-400">Отслеживайте взаимосвязь между рекламными затратами и объемом продаж, чтобы оптимизировать маркетинговый бюджет.</p>
                      </li>
                      <li>
                        <p className="font-medium text-gray-200">Анализ воронки продаж</p>
                        <p className="text-sm text-gray-400">Исследуйте путь клиента от просмотра до покупки, выявляя узкие места в процессе.</p>
                      </li>
                      <li>
                        <p className="font-medium text-gray-200">Сегментация клиентов</p>
                        <p className="text-sm text-gray-400">Разделите клиентов на группы по частоте и объему покупок для персонализации маркетинговых предложений.</p>
                      </li>
                      <li>
                        <p className="font-medium text-gray-200">Предсказательный анализ</p>
                        <p className="text-sm text-gray-400">Используйте исторические данные для прогнозирования будущих продаж и планирования поставок.</p>
                      </li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <div className="mt-6 p-4 bg-indigo-950/20 rounded-lg border border-indigo-900/30">
              <h3 className="text-md font-medium flex items-center gap-2 mb-2 text-gray-200">
                <Info className="h-4 w-4 text-indigo-400" />
                Советы по эффективному использованию аналитики
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-sm">
                <li className="text-gray-400">
                  <span className="font-medium text-gray-200">Регулярность анализа:</span> Просматривайте аналитику не реже одного раза в неделю, чтобы своевременно реагировать на изменения.
                </li>
                <li className="text-gray-400">
                  <span className="font-medium text-gray-200">Комплексный подход:</span> Анализируйте не только количественные показатели (продажи, доход), но и качественные (отзывы, причины возвратов).
                </li>
                <li className="text-gray-400">
                  <span className="font-medium text-gray-200">Сравнительный анализ:</span> Всегда сравнивайте текущие результаты с предыдущими периодами и поставленными целями.
                </li>
                <li className="text-gray-400">
                  <span className="font-medium text-gray-200">Действия на основе данных:</span> Используйте инсайты из аналитики для принятия обоснованных бизнес-решений.
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AnalyticsGuide;
