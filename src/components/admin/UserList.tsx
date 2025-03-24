import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { User, getUsers } from "@/services/userService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  MoreHorizontal, 
  Search, 
  UserPlus, 
  RefreshCw, 
  UserCheck, 
  UserX,
  Filter,
  Calendar,
  AlertTriangle
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface UserListProps {
  onSelectUser: (user: User) => void;
  onAddUser: () => void;
}

export default function UserList({ onSelectUser, onAddUser }: UserListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "table">("list");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [trialFilter, setTrialFilter] = useState<"all" | "trial" | "notrial">("all");
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const itemsPerPage = 5;
  const [paginatedUsers, setPaginatedUsers] = useState<User[]>([]);

  // Memoize the fetchUsers function so it can be used in useEffect and as a callback
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список пользователей",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    let result = users;
    
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        user => 
          user.name.toLowerCase().includes(lowerQuery) || 
          user.email.toLowerCase().includes(lowerQuery)
      );
    }
    
    if (statusFilter !== "all") {
      result = result.filter(user => user.status === statusFilter);
    }
    
    if (roleFilter !== "all") {
      result = result.filter(user => user.role === roleFilter);
    }
    
    if (trialFilter !== "all") {
      result = result.filter(user => 
        trialFilter === "trial" ? user.isInTrial : !user.isInTrial
      );
    }
    
    setFilteredUsers(result);
    setPage(1);
  }, [searchQuery, statusFilter, roleFilter, trialFilter, users]);

  useEffect(() => {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    setPaginatedUsers(filteredUsers.slice(start, end));
  }, [filteredUsers, page]);

  const handleRefresh = () => {
    fetchUsers();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const getTariffName = (tariffId?: string): string => {
    if (!tariffId) return 'Не выбран';
    
    switch (tariffId) {
      case '1': return 'Базовый';
      case '2': return 'Профессиональный';
      case '3': return 'Бизнес';
      case '4': return 'Корпоративный';
      default: return `Тариф ${tariffId}`;
    }
  };

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  return (
    <Card className="h-full overflow-hidden border border-gray-800 shadow-xl rounded-2xl bg-gray-900">
      <CardHeader className="p-5 bg-gradient-to-br from-gray-900 to-gray-950 border-b border-gray-800">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-500" />
            <span>Пользователи ({filteredUsers.length})</span>
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              className="rounded-full bg-gray-800 border-gray-700 hover:bg-gray-700"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full bg-gray-800 border-gray-700 hover:bg-gray-700"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-gray-800 border-gray-700">
                <DropdownMenuLabel>Фильтры</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-700" />
                
                <DropdownMenuLabel className="text-xs text-muted-foreground">Статус</DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => setStatusFilter("all")}
                  className={statusFilter === "all" ? "bg-blue-900/30" : "hover:bg-gray-700"}
                >
                  Все
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setStatusFilter("active")}
                  className={statusFilter === "active" ? "bg-blue-900/30" : "hover:bg-gray-700"}
                >
                  Активные
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setStatusFilter("inactive")}
                  className={statusFilter === "inactive" ? "bg-blue-900/30" : "hover:bg-gray-700"}
                >
                  Неактивные
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="bg-gray-700" />
                
                <DropdownMenuLabel className="text-xs text-muted-foreground">Роль</DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => setRoleFilter("all")}
                  className={roleFilter === "all" ? "bg-blue-900/30" : "hover:bg-gray-700"}
                >
                  Все
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setRoleFilter("admin")}
                  className={roleFilter === "admin" ? "bg-blue-900/30" : "hover:bg-gray-700"}
                >
                  Администраторы
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setRoleFilter("user")}
                  className={roleFilter === "user" ? "bg-blue-900/30" : "hover:bg-gray-700"}
                >
                  Пользователи
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="bg-gray-700" />
                
                <DropdownMenuLabel className="text-xs text-muted-foreground">Пробный период</DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => setTrialFilter("all")}
                  className={trialFilter === "all" ? "bg-blue-900/30" : "hover:bg-gray-700"}
                >
                  Все
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setTrialFilter("trial")}
                  className={trialFilter === "trial" ? "bg-blue-900/30" : "hover:bg-gray-700"}
                >
                  На пробном периоде
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setTrialFilter("notrial")}
                  className={trialFilter === "notrial" ? "bg-blue-900/30" : "hover:bg-gray-700"}
                >
                  Без пробного периода
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full bg-gray-800 border-gray-700 hover:bg-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="M3 9h18" />
                    <path d="M9 21V9" />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                <DropdownMenuItem onClick={() => setView("list")} className={view === "list" ? "bg-blue-900/30" : "hover:bg-gray-700"}>
                  Список
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setView("table")} className={view === "table" ? "bg-blue-900/30" : "hover:bg-gray-700"}>
                  Таблица
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              onClick={onAddUser}
              size="sm"
              className="gap-1 bg-blue-600 hover:bg-blue-700"
            >
              <UserPlus className="h-4 w-4" />
              <span>Добавить</span>
            </Button>
          </div>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Поиск пользователей..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-gray-800 border-gray-700"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0 h-[calc(100%-14rem)] overflow-auto bg-gray-900">
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : filteredUsers.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {view === "list" ? (
                <div className="divide-y divide-gray-800">
                  {paginatedUsers.map((user) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="p-4 hover:bg-gray-800/50 cursor-pointer transition-colors"
                      onClick={() => onSelectUser(user)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-gray-700 shadow-sm">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback className="bg-blue-900 text-blue-100">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium truncate">{user.name}</h3>
                            {user.isInTrial && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="cursor-help">
                                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-gray-800 border-gray-700">
                                    <p>Пробный период активен</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {user.role === 'admin' && (
                              <Badge variant="info" className="capitalize">
                                Админ
                              </Badge>
                            )}
                            <Badge variant={user.status === 'active' ? "success" : "destructive"}>
                              {user.status === 'active' ? 'Активен' : 'Неактивен'}
                            </Badge>
                            <Badge variant="outline" className="bg-gray-800 border-gray-700">
                              {getTariffName(user.tariffId)}
                            </Badge>
                            {user.isInTrial && (
                              <Badge variant="warning">
                                Пробный период
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground text-right hidden md:block">
                          <div>Регистрация: {formatDate(user.registeredAt)}</div>
                          <div>Последний вход: {user.lastLogin ? formatDate(user.lastLogin) : "—"}</div>
                          {user.trialEndDate && (
                            <div>Окончание пробного периода: {formatDate(user.trialEndDate)}</div>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-800">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              onSelectUser(user);
                            }} className="hover:bg-gray-700">
                              Подробнее
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              toast({
                                title: "Действие",
                                description: `${user.status === 'active' ? 'Блокировка' : 'Разблокировка'} пользователя ${user.name}`,
                              });
                            }} className="hover:bg-gray-700">
                              {user.status === 'active' ? 'Заблокировать' : 'Разблокировать'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-4">
                  <Table>
                    <TableHeader className="bg-gray-800/50">
                      <TableRow className="border-gray-800 hover:bg-gray-800">
                        <TableHead>Пользователь</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Роль</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Тариф</TableHead>
                        <TableHead>Пробный период</TableHead>
                        <TableHead>Регистрация</TableHead>
                        <TableHead className="text-right">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedUsers.map((user) => (
                        <TableRow key={user.id} className="cursor-pointer hover:bg-gray-800/50 border-gray-800" onClick={() => onSelectUser(user)}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8 border border-gray-700">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback className="text-xs bg-blue-900 text-blue-100">{getInitials(user.name)}</AvatarFallback>
                              </Avatar>
                              {user.name}
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'admin' ? 'info' : 'secondary'} className="capitalize">
                              {user.role === 'admin' ? 'Админ' : 'Пользователь'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.status === 'active' ? "success" : "destructive"}>
                              {user.status === 'active' ? 'Активен' : 'Неактивен'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getTariffName(user.tariffId)}
                          </TableCell>
                          <TableCell>
                            {user.isInTrial ? (
                              <Badge variant="warning">
                                Активен
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">Неактивен</span>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(user.registeredAt)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-700" onClick={(e) => e.stopPropagation()}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectUser(user);
                                }} className="hover:bg-gray-700">
                                  Подробнее
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  toast({
                                    title: "Действие",
                                    description: `${user.status === 'active' ? 'Блокировка' : 'Разблокировка'} пользователя ${user.name}`,
                                  });
                                }} className="hover:bg-gray-700">
                                  {user.status === 'active' ? 'Заблокировать' : 'Разблокировать'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {totalPages > 1 && (
                <div className="py-4 border-t border-gray-800">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={handlePreviousPage}
                          className={page === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink 
                            isActive={page === i + 1}
                            onClick={() => setPage(i + 1)}
                            className={page === i + 1 ? "bg-blue-900" : "bg-gray-800 hover:bg-gray-700"}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={handleNextPage}
                          className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <UserX className="h-16 w-16 text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-400">Пользователи не найдены</h3>
              <p className="text-sm text-gray-500 mt-1">
                {searchQuery || statusFilter !== "all" || roleFilter !== "all" || trialFilter !== "all"
                  ? "Попробуйте изменить параметры поиска или фильтры" 
                  : "В системе еще нет зарегистрированных пользователей"}
              </p>
            </div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
