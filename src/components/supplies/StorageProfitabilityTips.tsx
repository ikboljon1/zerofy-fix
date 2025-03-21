
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, Megaphone, Tag, ShoppingBag, 
  Package, Truck, BadgePercent, DollarSign,
  BarChart2, Clock, Store, Calendar
} from 'lucide-react';

const StorageProfitabilityTips = () => {
  return (
    <Card className="shadow-md border-0 bg-gradient-to-br from-white to-indigo-50/30 dark:from-gray-900 dark:to-indigo-950/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-blue-700 dark:from-indigo-400 dark:to-blue-400">
            Стратегии оптимизации хранения
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0 rounded-full bg-emerald-100 p-1.5 dark:bg-emerald-950">
                <ShoppingBag className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Быстрая продажа</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Значительно снизьте цену для быстрой распродажи товаров с низкой рентабельностью хранения. Это поможет избежать дальнейших затрат на хранение и освободит оборотные средства.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0 rounded-full bg-blue-100 p-1.5 dark:bg-blue-950">
                <Tag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Сохранить цену</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Для товаров с положительной рентабельностью хранения можно сохранить текущую цену. Эти товары приносят стабильную прибыль даже с учетом затрат на хранение.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0 rounded-full bg-amber-100 p-1.5 dark:bg-amber-950">
                <BadgePercent className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Снизить цену</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Умеренно снизьте цену для увеличения скорости продаж товаров с пограничной рентабельностью. Это позволит избежать ситуации, когда затраты на хранение начнут превышать прибыль.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0 rounded-full bg-purple-100 p-1.5 dark:bg-purple-950">
                <Megaphone className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Дать рекламу</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Инвестируйте в рекламу для увеличения видимости и продаж проблемных товаров. Даже если маржа снизится, быстрый рост продаж сократит затраты на хранение и улучшит общую рентабельность.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0 rounded-full bg-teal-100 p-1.5 dark:bg-teal-950">
                <Package className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Оптимизация упаковки</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Пересмотрите упаковку товаров для уменьшения объема и веса. Это напрямую влияет на стоимость хранения и может значительно улучшить рентабельность.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0 rounded-full bg-cyan-100 p-1.5 dark:bg-cyan-950">
                <Store className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Склад с лучшими коэффициентами</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Перераспределите товары на склады с более выгодными коэффициентами хранения. Разные склады имеют разную стоимость хранения, что может существенно влиять на рентабельность.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0 rounded-full bg-red-100 p-1.5 dark:bg-red-950">
                <Truck className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Перемещение остатков</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Для товаров с отрицательной рентабельностью хранения рассмотрите возможность вывоза остатков. Иногда дешевле хранить товары на собственном складе или у другого логистического партнера.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0 rounded-full bg-orange-100 p-1.5 dark:bg-orange-950">
                <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Сезонное планирование</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Учитывайте сезонность при планировании запасов. Увеличивайте поставки перед высоким сезоном и минимизируйте остатки в низкий сезон, чтобы избежать длительного хранения.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            Финансовые стратегии для улучшения рентабельности:
          </h3>
          <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 text-green-600 dark:text-green-400">•</span>
              <span><b>Расчет точки безубыточности:</b> Определите, сколько дней товар может храниться до того, как хранение станет убыточным. Используйте эту информацию для принятия решений о ценообразовании и рекламных акциях.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 text-green-600 dark:text-green-400">•</span>
              <span><b>Анализ "быстрых" и "медленных" товаров:</b> Разделите ассортимент на группы по скорости продаж и применяйте разные стратегии для каждой группы.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 text-green-600 dark:text-green-400">•</span>
              <span><b>Комплектация наборов:</b> Объединяйте медленно продающиеся товары с популярными для ускорения оборота всего ассортимента.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 text-green-600 dark:text-green-400">•</span>
              <span><b>Динамическое ценообразование:</b> Внедрите систему автоматического снижения цены в зависимости от срока хранения товара на складе.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 text-purple-600 dark:text-purple-400">•</span>
              <span><b>Рекламные кампании:</b> Для высокомаржинальных товаров с медленным оборотом инвестируйте в рекламу. Даже если ROI рекламы не очень высок, вы сэкономите на хранении.</span>
            </li>
          </ul>
        </div>

        <Separator className="my-4" />
        
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            Мониторинг и контроль:
          </h3>
          <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 text-indigo-600 dark:text-indigo-400">•</span>
              <span><b>Еженедельный анализ:</b> Регулярно пересматривайте рентабельность хранения каждого SKU и принимайте оперативные меры для проблемных товаров.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 text-indigo-600 dark:text-indigo-400">•</span>
              <span><b>Автоматические уведомления:</b> Настройте систему оповещений о товарах, приближающихся к порогу убыточности хранения.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 text-indigo-600 dark:text-indigo-400">•</span>
              <span><b>Прогноз затрат на хранение:</b> Используйте исторические данные о продажах для прогнозирования затрат на хранение и планирования поставок.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 text-indigo-600 dark:text-indigo-400">•</span>
              <span><b>Аналитика эффективности рекламы:</b> Отслеживайте как реклама влияет на скорость продаж и общую рентабельность с учетом затрат на хранение.</span>
            </li>
          </ul>
        </div>

        <Separator className="my-4" />
        
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            Временная стратегия:
          </h3>
          <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 text-amber-600 dark:text-amber-400">•</span>
              <span><b>30 дней:</b> Для товаров, хранящихся до 30 дней, фокусируйтесь на оптимизации продаж без существенного снижения цены.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 text-amber-600 dark:text-amber-400">•</span>
              <span><b>30-60 дней:</b> Начинайте активные рекламные кампании и умеренное снижение цены для ускорения продаж.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 text-amber-600 dark:text-amber-400">•</span>
              <span><b>60-90 дней:</b> Рассмотрите значительное снижение цены или рекламные акции "2 по цене 1" для быстрого освобождения складских мест.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 text-amber-600 dark:text-amber-400">•</span>
              <span><b>Более 90 дней:</b> Оцените возможность вывоза остатков или экстремального снижения цены до уровня себестоимости для минимизации убытков.</span>
            </li>
          </ul>
        </div>
        
        <Separator className="my-4" />
        
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            Стратегия рекламного продвижения:
          </h3>
          <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 text-purple-600 dark:text-purple-400">•</span>
              <span><b>Высокомаржинальные товары с медленными продажами:</b> Идеально подходят для рекламного продвижения. Даже если конверсия невысока, ускорение продаж снизит затраты на хранение.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 text-purple-600 dark:text-purple-400">•</span>
              <span><b>Таргетированный подход:</b> Фокусируйте рекламу на подсегментах целевой аудитории, которые с большей вероятностью приобретут товар без значительных скидок.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 text-purple-600 dark:text-purple-400">•</span>
              <span><b>Комбинирование методов:</b> Для максимального эффекта сочетайте рекламное продвижение с умеренным снижением цены (5-10%).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 text-purple-600 dark:text-purple-400">•</span>
              <span><b>Мониторинг ROI:</b> Регулярно анализируйте не только прямую окупаемость рекламных инвестиций, но и сокращение затрат на хранение благодаря ускорению продаж.</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default StorageProfitabilityTips;

