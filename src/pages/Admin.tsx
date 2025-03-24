
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, UserPlus } from "lucide-react";
import { User } from "@/services/userService";
import AddUserModal from "@/components/admin/AddUserModal";

const Admin = () => {
  const [userData, setUserData] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const navigate = useNavigate();

  // Пример пользователей для администрирования
  const mockUsers: User[] = [
    {
      id: "1",
      name: "Администратор",
      email: "admin@example.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
      role: "admin",
      status: "active",
      registeredAt: "2023-01-01T00:00:00Z",
      isInTrial: false,
      trialEndDate: "",
      isSubscriptionActive: true,
      tariffId: "3"
    },
    {
      id: "2",
      name: "Иван Иванов",
      email: "ivan@example.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ivan",
      role: "user",
      status: "active",
      registeredAt: "2023-02-15T00:00:00Z",
      isInTrial: true,
      trialEndDate: "2023-03-15T00:00:00Z",
      isSubscriptionActive: false,
      tariffId: "1"
    },
    {
      id: "3",
      name: "Анна Петрова",
      email: "anna@example.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=anna",
      role: "user",
      status: "active",
      registeredAt: "2023-03-10T00:00:00Z",
      isInTrial: false,
      trialEndDate: "",
      isSubscriptionActive: true,
      tariffId: "2"
    }
  ];

  useEffect(() => {
    // Проверка роли пользователя при загрузке компонента
    const userString = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (userString) {
      try {
        const user = JSON.parse(userString);
        setUserData(user);
        setUserRole(user.role);
        
        // Загрузка списка пользователей
        setUsers(mockUsers);
        
      } catch (e) {
        console.error('Ошибка при парсинге данных пользователя:', e);
        navigate('/dashboard');
      }
    } else {
      // Если пользователь не авторизован, перенаправляем на главную
      navigate('/');
    }
  }, [navigate]);

  const handleAddUser = (newUser: User) => {
    setUsers([...users, newUser]);
    setShowAddUserModal(false);
  };

  // Если роль пользователя еще не определена, показываем загрузку
  if (userRole === null) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Если пользователь не админ, показываем сообщение об ошибке доступа
  if (userRole !== 'admin') {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка доступа</AlertTitle>
          <AlertDescription>
            У вас нет прав для доступа к административной панели.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Административная панель</h1>
      
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Пользователи</TabsTrigger>
          <TabsTrigger value="tariffs">Тарифы</TabsTrigger>
          <TabsTrigger value="settings">Настройки</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex justify-between items-start">
              <div>
                <CardTitle>Управление пользователями</CardTitle>
                <CardDescription>Управление пользователями системы и их правами.</CardDescription>
              </div>
              <Button 
                onClick={() => setShowAddUserModal(true)}
                className="bg-blue-600 hover:bg-blue-700 gap-1"
              >
                <UserPlus className="h-4 w-4" />
                <span>Добавить пользователя</span>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Пользователь</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Роль</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Статус</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Дата регистрации</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                    {users.map(user => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img className="h-10 w-10 rounded-full" src={user.avatar} alt="" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-300">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}>
                            {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {user.status === 'active' ? 'Активный' : 'Неактивный'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {new Date(user.registeredAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button variant="ghost" className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                            Редактировать
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tariffs">
          <Card>
            <CardHeader>
              <CardTitle>Управление тарифами</CardTitle>
              <CardDescription>Настройка тарифных планов системы</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Здесь будет функционал управления тарифами</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Настройки системы</CardTitle>
              <CardDescription>Общие настройки системы и интеграции</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Здесь будет функционал настроек системы</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <AddUserModal 
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onUserAdded={handleAddUser}
      />
    </div>
  );
};

export default Admin;
