
import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  getSmtpSettings, 
  saveSmtpSettings, 
  testSmtpConnection, 
  SmtpSettings as SmtpSettingsType 
} from "@/services/userService";
import { Mail, Key, Server, Globe, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const smtpSchema = z.object({
  host: z.string().min(1, { message: "SMTP хост обязателен" }),
  port: z.coerce.number().int().positive({ message: "Порт должен быть положительным числом" }),
  secure: z.boolean().default(true),
  username: z.string().min(1, { message: "Имя пользователя обязательно" }),
  password: z.string().min(1, { message: "Пароль обязателен" }),
  fromEmail: z.string().email({ message: "Введите корректный email" }),
  fromName: z.string().min(1, { message: "Имя отправителя обязательно" }),
});

const SMTPSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isTestSuccess, setIsTestSuccess] = useState<boolean | null>(null);
  const [testErrorMessage, setTestErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<z.infer<typeof smtpSchema>>({
    resolver: zodResolver(smtpSchema),
    defaultValues: {
      host: "",
      port: 587,
      secure: true,
      username: "",
      password: "",
      fromEmail: "",
      fromName: "",
    },
  });

  const secure = watch("secure");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSmtpSettings();
        if (settings) {
          setValue("host", settings.host || "");
          setValue("port", settings.port || 587);
          setValue("secure", settings.secure !== undefined ? settings.secure : true);
          setValue("username", settings.username || "");
          setValue("password", settings.password || "");
          setValue("fromEmail", settings.fromEmail || "");
          setValue("fromName", settings.fromName || "");
        }
      } catch (error) {
        console.error("Error loading SMTP settings:", error);
      }
    };

    loadSettings();
  }, [setValue]);

  const onSubmit = async (data: z.infer<typeof smtpSchema>) => {
    setIsLoading(true);

    try {
      await saveSmtpSettings(data);
      
      toast({
        title: "Настройки сохранены",
        description: "Настройки SMTP успешно сохранены",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки SMTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setIsTestSuccess(null);
    setTestErrorMessage(null);

    try {
      const data = watch();
      const result = await testSmtpConnection(data);
      
      if (result.success) {
        setIsTestSuccess(true);
        toast({
          title: "Тест успешен",
          description: "Соединение с SMTP сервером работает корректно",
        });
      } else {
        setIsTestSuccess(false);
        setTestErrorMessage(result.message);
        toast({
          title: "Ошибка соединения",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      setIsTestSuccess(false);
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить тест соединения",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Mail className="h-6 w-6 text-blue-400" />
        <h2 className="text-2xl font-bold text-white">Настройки SMTP-сервера</h2>
      </div>
      
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle>Конфигурация почтового сервера</CardTitle>
          <CardDescription>
            Настройте параметры подключения к SMTP-серверу для отправки системных уведомлений и писем пользователям
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="server" className="w-full">
              <TabsList className="bg-gray-800 mb-6">
                <TabsTrigger value="server">Сервер</TabsTrigger>
                <TabsTrigger value="auth">Аутентификация</TabsTrigger>
                <TabsTrigger value="sender">Отправитель</TabsTrigger>
              </TabsList>
              
              <TabsContent value="server" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="host">SMTP хост</Label>
                    <div className="relative">
                      <Server className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="host"
                        placeholder="smtp.gmail.com"
                        className="pl-9"
                        {...register("host")}
                      />
                    </div>
                    {errors.host && (
                      <p className="text-sm text-destructive">{errors.host.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="port">SMTP порт</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="port"
                        type="number"
                        placeholder="587"
                        className="pl-9"
                        {...register("port")}
                      />
                    </div>
                    {errors.port && (
                      <p className="text-sm text-destructive">{errors.port.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="secure"
                    checked={secure}
                    onCheckedChange={(checked) => setValue("secure", checked)}
                  />
                  <Label htmlFor="secure">Использовать защищенное соединение (SSL/TLS)</Label>
                </div>
              </TabsContent>
              
              <TabsContent value="auth" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Имя пользователя</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="username"
                      placeholder="user@example.com"
                      className="pl-9"
                      {...register("username")}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-sm text-destructive">{errors.username.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Пароль</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Пароль или ключ приложения"
                      className="pl-9"
                      {...register("password")}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="sender" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">Email отправителя</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="fromEmail"
                      type="email"
                      placeholder="no-reply@yourcompany.com"
                      className="pl-9"
                      {...register("fromEmail")}
                    />
                  </div>
                  {errors.fromEmail && (
                    <p className="text-sm text-destructive">{errors.fromEmail.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fromName">Имя отправителя</Label>
                  <Input
                    id="fromName"
                    placeholder="Zerofy System"
                    {...register("fromName")}
                  />
                  {errors.fromName && (
                    <p className="text-sm text-destructive">{errors.fromName.message}</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            
            {isTestSuccess !== null && (
              <Alert className={isTestSuccess ? "bg-green-900/40 border-green-800" : "bg-red-900/40 border-red-800"}>
                <div className="flex items-start">
                  {isTestSuccess ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400 mr-2 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                  )}
                  <AlertDescription className="text-sm">
                    {isTestSuccess 
                      ? "Соединение с SMTP сервером успешно установлено."
                      : `Ошибка соединения: ${testErrorMessage || "Не удалось подключиться к серверу"}`}
                  </AlertDescription>
                </div>
              </Alert>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleTestConnection}
                disabled={isTesting}
                className="order-2 sm:order-1"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Тестирование...
                  </>
                ) : (
                  "Проверить соединение"
                )}
              </Button>
              
              <Button 
                type="submit" 
                disabled={isLoading}
                className="order-1 sm:order-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  "Сохранить настройки"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SMTPSettings;
