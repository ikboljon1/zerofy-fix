
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KeywordStatistics, KeywordStat, getKeywordStatistics } from "@/services/advertisingApi";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays, subDays } from "date-fns";
import { Search, Tag, TrendingUp, Eye, MousePointerClick, DollarSign, PercentIcon, Filter, AlertCircle, CalendarIcon, PlusCircle, MinusCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/hooks/use-theme";
import DateRangePicker from "@/components/analytics/components/DateRangePicker";
import { Checkbox } from "@/components/ui/checkbox";

interface KeywordStatisticsProps {
  campaignId: number;
  apiKey: string;
  dateFrom: Date;
  dateTo: Date;
}

// Extended type to include exclusion and performance status
interface ExtendedKeywordStat extends KeywordStat {
  date: string;
  excluded: boolean;
  performance: 'profitable' | 'unprofitable' | 'neutral';
}

const KeywordStatisticsComponent = ({ campaignId, apiKey, dateFrom: initialDateFrom, dateTo: initialDateTo }: KeywordStatisticsProps) => {
  // Initialize with last 7 days
  const [dateFrom, setDateFrom] = useState<Date>(() => subDays(new Date(), 6));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [keywordStats, setKeywordStats] = useState<KeywordStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");
  const [sortField, setSortField] = useState<keyof KeywordStat>("views");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const { toast } = useToast();
  const { theme } = useTheme();
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [dateWarning, setDateWarning] = useState<string | null>(null);
  const [excludedKeywords, setExcludedKeywords] = useState<Set<string>>(new Set());

  // Calculate performance metrics for all keywords
  const processedKeywords = useMemo(() => {
    if (!keywordStats) return [];

    // Combine and flatten all keyword stats across days
    const allKeywords = keywordStats.keywords.flatMap(day => 
      day.stats.map(stat => ({
        ...stat,
        date: day.date,
        excluded: excludedKeywords.has(stat.keyword),
        performance: calculatePerformance(stat)
      }))
    );

    return allKeywords;
  }, [keywordStats, excludedKeywords]);

  // Function to determine if a keyword is profitable
  function calculatePerformance(stat: KeywordStat): 'profitable' | 'unprofitable' | 'neutral' {
    // Consider a keyword profitable if CTR is above 3% or clicks are high relative to spending
    if (stat.ctr > 3 || (stat.clicks > 10 && stat.sum / stat.clicks < 10)) {
      return 'profitable';
    }
    // Consider a keyword unprofitable if spending is high with low CTR or low clicks
    else if ((stat.sum > 100 && stat.ctr < 1) || (stat.sum > 200 && stat.clicks < 5)) {
      return 'unprofitable';
    }
    return 'neutral';
  }

  // Filter by search term and exclude excluded keywords if needed
  const filteredKeywords = useMemo(() => {
    return processedKeywords.filter(
      stat => stat.keyword.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [processedKeywords, searchTerm]);

  // Sort the filtered keywords
  const sortedKeywords = useMemo(() => {
    return [...filteredKeywords].sort((a, b) => {
      if (sortDirection === "asc") {
        return a[sortField] > b[sortField] ? 1 : -1;
      } else {
        return a[sortField] < b[sortField] ? 1 : -1;
      }
    });
  }, [filteredKeywords, sortField, sortDirection]);

  // Toggle keyword exclusion
  const toggleKeywordExclusion = (keyword: string) => {
    setExcludedKeywords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyword)) {
        newSet.delete(keyword);
      } else {
        newSet.add(keyword);
      }
      return newSet;
    });
  };

  // Handle search input with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInputValue(value);
    
    // Apply the search term after a small delay to prevent re-renders on each keystroke
    const timeoutId = setTimeout(() => {
      setSearchTerm(value);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };

  const fetchData = async () => {
    // Check if already loading to prevent multiple fetches
    if (loading) return;
    
    setLoading(true);
    
    // Check date range
    const diffDays = differenceInDays(dateTo, dateFrom);
    if (diffDays > 7) {
      setDateWarning("API ограничивает период до 7 дней. Будут показаны данные за последние 7 дней.");
    } else {
      setDateWarning(null);
    }
    
    try {
      const data = await getKeywordStatistics(apiKey, campaignId, dateFrom, dateTo);
      setKeywordStats(data);
      setLastUpdate(new Date().toISOString());
      
      if (data.keywords && data.keywords.length > 0 && data.keywords.some(day => day.stats.length > 0)) {
        toast({
          title: "Данные обновлены",
          description: "Статистика по ключевым словам успешно загружена",
        });
      } else {
        toast({
          title: "Нет данных",
          description: "За указанный период нет статистики по ключевым словам",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching keyword statistics:", error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось загрузить статистику по ключевым словам",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = () => {
    fetchData();
  };

  useEffect(() => {
    if (campaignId && apiKey) {
      fetchData();
    }
  }, [campaignId, apiKey]); // Removed dateFrom and dateTo from dependencies

  const handleSort = (field: keyof KeywordStat) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getFormattedLastUpdate = () => {
    if (!lastUpdate) return "Никогда";
    
    const updateDate = new Date(lastUpdate);
    return `${updateDate.toLocaleDateString('ru-RU')} ${updateDate.toLocaleTimeString('ru-RU')}`;
  };

  const renderSortIcon = (field: keyof KeywordStat) => {
    if (sortField !== field) return null;
    return (
      <span className="ml-1 inline-block">
        {sortDirection === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  // Get CSS class for keyword performance 
  const getKeywordPerformanceClass = (performance: 'profitable' | 'unprofitable' | 'neutral') => {
    switch (performance) {
      case 'profitable':
        return "text-blue-600 dark:text-blue-400 font-medium";
      case 'unprofitable':
        return "text-red-600 dark:text-red-400 font-medium";
      default:
        return "";
    }
  };

  // Get icon for keyword performance
  const getKeywordPerformanceIcon = (performance: 'profitable' | 'unprofitable' | 'neutral') => {
    switch (performance) {
      case 'profitable':
        return <PlusCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case 'unprofitable':
        return <MinusCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      default:
        return null;
    }
  };

  const KeywordMetricsCard = () => {
    if (!keywordStats || keywordStats.keywords.length === 0) {
      return (
        <div className="p-8 text-center">
          <div className="flex flex-col items-center justify-center">
            <Tag className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">Нет данных о ключевых словах</h3>
            <p className="text-gray-500 mt-2">
              Для этой кампании еще нет статистики по ключевым словам или указанному периоду
            </p>
          </div>
        </div>
      );
    }

    // Calculate totals
    const totalViews = processedKeywords.reduce((sum, stat) => sum + stat.views, 0);
    const totalClicks = processedKeywords.reduce((sum, stat) => sum + stat.clicks, 0);
    const totalSum = processedKeywords.reduce((sum, stat) => sum + stat.sum, 0);
    const avgCtr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
    const uniqueKeywords = new Set(processedKeywords.map(k => k.keyword)).size;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Metric 1: Total Keywords */}
          <div className="rounded-2xl p-4 bg-white/80 dark:bg-gray-800/40 backdrop-blur-sm border border-purple-100 dark:border-purple-900/30 shadow-md overflow-hidden relative">
            <div className="w-1.5 h-full absolute left-0 top-0 bg-gradient-to-b from-purple-400 to-purple-600 rounded-l-lg"></div>
            <div className="flex flex-col pl-2">
              <div className="flex items-center justify-between mb-1">
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/40">
                  <Tag className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-0.5">Уникальных ключевых слов</p>
              <p className="text-lg font-bold">{uniqueKeywords}</p>
            </div>
          </div>

          {/* Metric 2: Total Views */}
          <div className="rounded-2xl p-4 bg-white/80 dark:bg-gray-800/40 backdrop-blur-sm border border-blue-100 dark:border-blue-900/30 shadow-md overflow-hidden relative">
            <div className="w-1.5 h-full absolute left-0 top-0 bg-gradient-to-b from-blue-400 to-blue-600 rounded-l-lg"></div>
            <div className="flex flex-col pl-2">
              <div className="flex items-center justify-between mb-1">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/40">
                  <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-0.5">Показы</p>
              <p className="text-lg font-bold">{totalViews.toLocaleString('ru-RU')}</p>
            </div>
          </div>

          {/* Metric 3: Total Clicks */}
          <div className="rounded-2xl p-4 bg-white/80 dark:bg-gray-800/40 backdrop-blur-sm border border-green-100 dark:border-green-900/30 shadow-md overflow-hidden relative">
            <div className="w-1.5 h-full absolute left-0 top-0 bg-gradient-to-b from-green-400 to-green-600 rounded-l-lg"></div>
            <div className="flex flex-col pl-2">
              <div className="flex items-center justify-between mb-1">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/40">
                  <MousePointerClick className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-0.5">Клики</p>
              <p className="text-lg font-bold">{totalClicks.toLocaleString('ru-RU')}</p>
            </div>
          </div>

          {/* Metric 4: Average CTR */}
          <div className="rounded-2xl p-4 bg-white/80 dark:bg-gray-800/40 backdrop-blur-sm border border-amber-100 dark:border-amber-900/30 shadow-md overflow-hidden relative">
            <div className="w-1.5 h-full absolute left-0 top-0 bg-gradient-to-b from-amber-400 to-amber-600 rounded-l-lg"></div>
            <div className="flex flex-col pl-2">
              <div className="flex items-center justify-between mb-1">
                <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/40">
                  <PercentIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-0.5">Средний CTR</p>
              <p className="text-lg font-bold">{avgCtr.toFixed(2)}%</p>
            </div>
          </div>

          {/* Metric 5: Total Cost */}
          <div className="rounded-2xl p-4 bg-white/80 dark:bg-gray-800/40 backdrop-blur-sm border border-red-100 dark:border-red-900/30 shadow-md overflow-hidden relative">
            <div className="w-1.5 h-full absolute left-0 top-0 bg-gradient-to-b from-red-400 to-red-600 rounded-l-lg"></div>
            <div className="flex flex-col pl-2">
              <div className="flex items-center justify-between mb-1">
                <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/40">
                  <DollarSign className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-0.5">Затраты</p>
              <p className="text-lg font-bold">{totalSum.toLocaleString('ru-RU')} ₽</p>
            </div>
          </div>
        </div>

        {/* Top Keywords */}
        <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/40 dark:to-blue-950/40">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <span>Топ ключевых слов</span>
            </h3>
          </div>
          <CardContent className="p-6">
            <div className="space-y-6">
              {processedKeywords
                .filter(stat => !stat.excluded) // Show only non-excluded keywords
                .sort((a, b) => b.views - a.views)
                .slice(0, 5)
                .map((stat, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                          {index + 1}
                        </Badge>
                        <span className={`font-medium ${getKeywordPerformanceClass(stat.performance)}`}>
                          {stat.keyword}
                          {getKeywordPerformanceIcon(stat.performance) && 
                            <span className="ml-2 inline-flex items-center">
                              {getKeywordPerformanceIcon(stat.performance)}
                            </span>
                          }
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">{stat.views.toLocaleString('ru-RU')} показов</span>
                    </div>
                    <Progress 
                      value={(stat.views / (processedKeywords[0]?.views || 1)) * 100} 
                      className={`h-2 ${
                        stat.performance === 'profitable' 
                          ? 'bg-blue-100 dark:bg-blue-900/30' 
                          : stat.performance === 'unprofitable' 
                            ? 'bg-red-100 dark:bg-red-900/30' 
                            : 'bg-purple-100 dark:bg-purple-900/30'
                      }`} 
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{stat.clicks.toLocaleString('ru-RU')} кликов</span>
                      <span>CTR: {stat.ctr.toFixed(2)}%</span>
                      <span>{stat.sum.toLocaleString('ru-RU')} ₽</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const KeywordTable = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Поиск по ключевым словам..."
              value={searchInputValue}
              onChange={handleSearchChange}
              className="pl-10 pr-4"
            />
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchData}
            disabled={loading}
          >
            <Filter className="h-4 w-4 mr-2" />
            Обновить
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                  <TableHead className="w-10">
                    <span className="sr-only">Исключить</span>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort("keyword")}
                  >
                    Ключевое слово {renderSortIcon("keyword")}
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer"
                    onClick={() => handleSort("views")}
                  >
                    Показы {renderSortIcon("views")}
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer"
                    onClick={() => handleSort("clicks")}
                  >
                    Клики {renderSortIcon("clicks")}
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer"
                    onClick={() => handleSort("ctr")}
                  >
                    CTR {renderSortIcon("ctr")}
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer"
                    onClick={() => handleSort("sum")}
                  >
                    Затраты {renderSortIcon("sum")}
                  </TableHead>
                  <TableHead className="text-right">
                    Дата
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedKeywords.length > 0 ? (
                  sortedKeywords.map((stat, index) => (
                    <TableRow 
                      key={index} 
                      className={`hover:bg-gray-50 dark:hover:bg-gray-900/20 ${
                        stat.excluded ? 'opacity-60 bg-gray-50 dark:bg-gray-900/10' : ''
                      }`}
                    >
                      <TableCell className="pr-0 w-10">
                        <Checkbox 
                          checked={stat.excluded}
                          onCheckedChange={() => toggleKeywordExclusion(stat.keyword)}
                          aria-label={`Исключить ${stat.keyword}`}
                        />
                      </TableCell>
                      <TableCell className={`font-medium ${getKeywordPerformanceClass(stat.performance)}`}>
                        <div className="flex items-center gap-2">
                          {stat.keyword}
                          {getKeywordPerformanceIcon(stat.performance)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{stat.views.toLocaleString('ru-RU')}</TableCell>
                      <TableCell className="text-right">{stat.clicks.toLocaleString('ru-RU')}</TableCell>
                      <TableCell className="text-right">{stat.ctr.toFixed(2)}%</TableCell>
                      <TableCell className="text-right">{stat.sum.toLocaleString('ru-RU')} ₽</TableCell>
                      <TableCell className="text-right">{format(new Date(stat.date), 'dd.MM.yyyy')}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      {loading ? (
                        <div className="flex justify-center items-center">
                          <div className="w-8 h-8 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
                        </div>
                      ) : searchTerm ? (
                        <div className="flex flex-col items-center justify-center">
                          <Search className="h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">Ничего не найдено по запросу "{searchTerm}"</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <Tag className="h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">Нет данных о ключевых словах</p>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Статистика по ключевым словам</h2>
        <div className="text-sm text-gray-500">
          Обновлено: {getFormattedLastUpdate()}
        </div>
      </div>

      <div className="mb-4">
        <DateRangePicker 
          dateFrom={dateFrom}
          dateTo={dateTo}
          setDateFrom={setDateFrom}
          setDateTo={setDateTo}
          onUpdate={handleDateChange}
        />
      </div>

      {dateWarning && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-300">{dateWarning}</p>
        </div>
      )}

      <Card className="border-0 shadow-xl overflow-hidden rounded-3xl">
        <div 
          className="p-1 rounded-2xl"
          style={{
            background: 'linear-gradient(90deg, #9b87f5, #7E69AB)'
          }}
        >
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full grid grid-cols-2 bg-background/90 dark:bg-gray-900/70 backdrop-blur-sm rounded-xl p-1">
              <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg">
                Обзор
              </TabsTrigger>
              <TabsTrigger value="table" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg">
                Таблица
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="overview" className="mt-0">
                <KeywordMetricsCard />
              </TabsContent>
              
              <TabsContent value="table" className="mt-0">
                <KeywordTable />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </Card>
    </motion.div>
  );
};

export default KeywordStatisticsComponent;
