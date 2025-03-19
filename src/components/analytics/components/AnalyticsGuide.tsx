
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ChevronDown, 
  ChevronUp, 
  PieChart, 
  LineChart, 
  BarChart, 
  Info, 
  FileText, 
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
      <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-indigo-50/40 dark:from-gray-900 dark:to-indigo-950/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100/80 dark:bg-indigo-900/50 shadow-inner">
              <HelpCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-blue-700 dark:from-indigo-400 dark:to-blue-400 font-bold">
              Руководство по аналитике данных
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <p className="text-muted-foreground mb-4">
              Это руководство поможет вам эффективно использовать аналитический раздел для принятия обоснованных бизнес-решений.
            </p>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="intro" className="border rounded-lg mb-3 px-3 py-1 border-indigo-100 dark:border-indigo-900/40">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-medium">Основы аналитики и показатели</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-6 mt-1 space-y-2">
                    <p>Аналитический раздел предоставляет доступ к ключевым показателям вашего бизнеса:</p>
                    <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                      <li><span className="font-medium text-foreground">Выручка</span> - общая сумма продаж за выбранный период.</li>
                      <li><span className="font-medium text-foreground">Прибыль</span> - доход после вычета всех расходов и комиссий.</li>
                      <li><span className="font-medium text-foreground">Средний чек</span> - средняя сумма заказа.</li>
                      <li><span className="font-medium text-foreground">Количество заказов</span> - общее число заказов за период.</li>
                      <li><span className="font-medium text-foreground">Конверсия</span> - отношение заказов к просмотрам.</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="charts" className="border rounded-lg mb-3 px-3 py-1 border-blue-100 dark:border-blue-900/40">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <LineChart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium">Работа с графиками и диаграммами</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-6 mt-1 space-y-2">
                    <p>В системе представлены различные типы визуализаций:</p>
                    <ul className="list-disc pl-6 space-y-3">
                      <li>
                        <div className="font-medium text-foreground flex items-center gap-1">
                          <LineChart className="h-4 w-4 text-blue-600" /> Линейные графики
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Отображают тренды продаж и заказов во времени. Наведите курсор на точки графика для просмотра детальной информации.
                        </p>
                      </li>
                      <li>
                        <div className="font-medium text-foreground flex items-center gap-1">
                          <PieChart className="h-4 w-4 text-purple-600" /> Круговые диаграммы
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Показывают распределение продаж по категориям товаров. Щелкните на сегмент для выделения.
                        </p>
                      </li>
                      <li>
                        <div className="font-medium text-foreground flex items-center gap-1">
                          <BarChart className="h-4 w-4 text-indigo-600" /> Столбчатые диаграммы
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Сравнивают продажи различных товаров или периодов. Позволяют легко определить лидеров продаж.
                        </p>
                      </li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="periods" className="border rounded-lg mb-3 px-3 py-1 border-green-100 dark:border-green-900/40">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="font-medium">Выбор периода анализа</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-6 mt-1 space-y-2">
                    <p>Для изменения временного периода анализа:</p>
                    <ol className="list-decimal pl-6 space-y-1 text-muted-foreground">
                      <li>Используйте селектор периода в верхней части экрана.</li>
                      <li>Доступны предустановленные периоды: сегодня, вчера, неделя, месяц и год.</li>
                      <li>Для более точного анализа выберите конкретный диапазон дат.</li>
                      <li>Сравнивайте текущий период с предыдущим для отслеживания динамики.</li>
                    </ol>
                    <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded-md mt-2">
                      <p className="text-sm flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                        <span>При использовании сравнения периодов учитывайте сезонность и праздничные дни, которые могут влиять на результаты.</span>
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="products" className="border rounded-lg mb-3 px-3 py-1 border-amber-100 dark:border-amber-900/40">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="font-medium">Анализ продуктов и категорий</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-6 mt-1 space-y-2">
                    <p>Для эффективного анализа продуктов:</p>
                    <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                      <li>Изучайте рейтинг товаров по популярности для определения бестселлеров.</li>
                      <li>Анализируйте распределение продаж по категориям с помощью круговых диаграмм.</li>
                      <li>Отслеживайте временные тренды продаж конкретных товаров.</li>
                      <li>Обращайте внимание на товары с высокой доходностью и низким объемом возвратов.</li>
                    </ul>
                    
                    <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md mt-3">
                      <h4 className="font-medium mb-1 flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-amber-600" />
                        Как улучшить продажи:
                      </h4>
                      <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                        <li>Увеличьте поставки товаров с высоким спросом и низким уровнем отказов.</li>
                        <li>Пересмотрите стратегию для товаров с высоким процентом возвратов.</li>
                        <li>Корректируйте рекламные кампании на основе данных о популярности товаров.</li>
                        <li>Отслеживайте сезонность продаж при планировании поставок.</li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="advanced" className="border rounded-lg mb-3 px-3 py-1 border-purple-100 dark:border-purple-900/40">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="font-medium">Углубленный анализ и поиск закономерностей</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-6 mt-1 space-y-2">
                    <p>Для проведения углубленного анализа:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>
                        <p className="font-medium text-foreground">Корреляция метрик</p>
                        <p className="text-sm text-muted-foreground">Отслеживайте взаимосвязь между рекламными затратами и объемом продаж, чтобы оптимизировать маркетинговый бюджет.</p>
                      </li>
                      <li>
                        <p className="font-medium text-foreground">Анализ воронки продаж</p>
                        <p className="text-sm text-muted-foreground">Исследуйте путь клиента от просмотра до покупки, выявляя узкие места в процессе.</p>
                      </li>
                      <li>
                        <p className="font-medium text-foreground">Сегментация клиентов</p>
                        <p className="text-sm text-muted-foreground">Разделите клиентов на группы по частоте и объему покупок для персонализации маркетинговых предложений.</p>
                      </li>
                      <li>
                        <p className="font-medium text-foreground">Предсказательный анализ</p>
                        <p className="text-sm text-muted-foreground">Используйте исторические данные для прогнозирования будущих продаж и планирования поставок.</p>
                      </li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="export" className="border rounded-lg mb-3 px-3 py-1 border-cyan-100 dark:border-cyan-900/40">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    <span className="font-medium">Экспорт и использование отчетов</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-6 mt-1 space-y-2">
                    <p>Для работы с отчетами:</p>
                    <ol className="list-decimal pl-6 space-y-1 text-muted-foreground">
                      <li>Используйте кнопку экспорта для сохранения отчетов в CSV или XLSX формате.</li>
                      <li>Настройте регулярную отправку отчетов на электронную почту.</li>
                      <li>Создавайте пользовательские отчеты с нужными вам метриками.</li>
                      <li>Делитесь отчетами с командой для совместного анализа.</li>
                    </ol>
                    
                    <div className="bg-cyan-50 dark:bg-cyan-950/30 p-2 rounded-md mt-2">
                      <p className="text-sm flex items-start gap-2">
                        <Info className="h-4 w-4 text-cyan-600 mt-0.5" />
                        <span>Регулярное изучение отчетов помогает выявлять долгосрочные тренды и своевременно реагировать на изменения рынка.</span>
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <div className="mt-6 p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
              <h3 className="text-md font-medium flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-indigo-600" />
                Советы по эффективному использованию аналитики
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-sm">
                <li className="text-muted-foreground">
                  <span className="font-medium text-foreground">Регулярность анализа:</span> Просматривайте аналитику не реже одного раза в неделю, чтобы своевременно реагировать на изменения.
                </li>
                <li className="text-muted-foreground">
                  <span className="font-medium text-foreground">Комплексный подход:</span> Анализируйте не только количественные показатели (продажи, доход), но и качественные (отзывы, причины возвратов).
                </li>
                <li className="text-muted-foreground">
                  <span className="font-medium text-foreground">Сравнительный анализ:</span> Всегда сравнивайте текущие результаты с предыдущими периодами и поставленными целями.
                </li>
                <li className="text-muted-foreground">
                  <span className="font-medium text-foreground">Действия на основе данных:</span> Используйте инсайты из аналитики для принятия обоснованных бизнес-решений.
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
