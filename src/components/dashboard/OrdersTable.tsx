
import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Calendar, Package, ArrowUpDown } from "lucide-react";
import { WildberriesOrder } from "@/types/store";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { formatCurrency } from "@/utils/formatCurrency";

interface OrdersTableProps {
  orders: WildberriesOrder[];
  title?: string;
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders, title = "Заказы" }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof WildberriesOrder>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (field: keyof WildberriesOrder) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const filteredOrders = orders.filter(order => 
    order.supplierArticle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.srid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let valueA: any = a[sortField];
    let valueB: any = b[sortField];

    // Преобразование дат для правильной сортировки
    if (sortField === "date" || sortField === "lastChangeDate") {
      valueA = new Date(valueA).getTime();
      valueB = new Date(valueB).getTime();
    }

    // Преобразование числовых строк для правильной сортировки
    if (typeof valueA === "string" && !isNaN(Number(valueA))) {
      valueA = Number(valueA);
    }
    if (typeof valueB === "string" && !isNaN(Number(valueB))) {
      valueB = Number(valueB);
    }

    if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
    if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const formatDate = (dateString: string) => {
    try {
      if (!dateString || dateString === "0001-01-01T00:00:00") return "-";
      return format(new Date(dateString), "dd MMM yyyy", { locale: ru });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-900 dark:to-purple-950/30 border-purple-100/30 dark:border-purple-800/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-purple-500" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-indigo-700 dark:from-purple-400 dark:to-indigo-400">
            {title}
          </span>
        </CardTitle>
        <CardDescription>
          Всего заказов: {orders.length}
        </CardDescription>
        <div className="flex gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск заказов..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm border-purple-100 dark:border-purple-800/30"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-purple-100/30 dark:border-purple-800/20 overflow-hidden bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-purple-50/50 dark:hover:bg-purple-950/50">
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort("date")}
                    className="flex items-center px-0 text-purple-700 dark:text-purple-400"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Дата
                    {sortField === "date" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort("supplierArticle")}
                    className="flex items-center px-0"
                  >
                    Артикул
                    {sortField === "supplierArticle" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>Категория</TableHead>
                <TableHead>Предмет</TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort("priceWithDisc")}
                    className="flex items-center px-0"
                  >
                    Цена (со скидкой)
                    {sortField === "priceWithDisc" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>Склад</TableHead>
                <TableHead>Регион</TableHead>
                <TableHead>Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedOrders.length > 0 ? (
                sortedOrders.map((order, index) => (
                  <TableRow 
                    key={order.srid || index}
                    className="hover:bg-purple-50/50 dark:hover:bg-purple-950/50 transition-colors"
                  >
                    <TableCell>{formatDate(order.date)}</TableCell>
                    <TableCell>{order.supplierArticle}</TableCell>
                    <TableCell>{order.category}</TableCell>
                    <TableCell>{order.subject}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(order.priceWithDisc)} ₽</TableCell>
                    <TableCell>{order.warehouseName}</TableCell>
                    <TableCell>{order.regionName}</TableCell>
                    <TableCell>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
                        order.isCancel 
                          ? "bg-red-100/80 text-red-800 dark:bg-red-900/30 dark:text-red-300" 
                          : "bg-emerald-100/80 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                      }`}>
                        {order.isCancel ? 'Отменен' : 'Активен'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                    {searchTerm ? "Заказы не найдены" : "Заказов нет"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrdersTable;
