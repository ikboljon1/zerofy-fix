
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
  testPop3Connection,
  SmtpSettings as SmtpSettingsType,
  Pop3Settings as Pop3SettingsType,
  EmailSettings
} from "@/services/userService";
import { Mail, Key, Server, Globe, AlertCircle, CheckCircle2, Loader2, Eye, EyeOff, Clock, Database } from "lucide-react";
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

const pop3Schema = z.object({
  host: z.string().min(1, { message: "POP3 хост обязателен" }),
  port: z.coerce.number().int().positive({ message: "Порт должен быть положительным числом" }),
  secure: z.boolean().default(true),
  username: z.string().min(1, { message: "Имя пользователя обязательно" }),
  password: z.string().min(1, { message: "Пароль обязателен" }),
  leaveOnServer: z.boolean().default(true),
  autoCheckInterval: z.coerce.number().int().positive({ message: "Интервал должен быть положительным числом" }).default(15),
});

type SmtpFormValues = z.infer<typeof smtpSchema>;
type Pop3FormValues = z.infer<typeof pop3Schema>;

const SMTPSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isTestingPop3, setIsTestingPop3] = useState(false);
  const [isTestSuccess, setIsTestSuccess] = useState<boolean | null>(null);
  const [isPop3TestSuccess, setIsPop3TestSuccess] = useState<boolean | null>(null);
  const [testErrorMessage, setTestErrorMessage] = useState<string | null>(null);
  const [pop3TestErrorMessage, setPop3TestErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPop3Password, setShowPop3Password] = useState(false);
  const [configType, setConfigType] = useState("smtp");
  const { toast } = useToast();

  const {
    register: smtpRegister,
    handleSubmit: handleSmtpSubmit,
    formState: { errors: smtpErrors },
    setValue: setSmtpValue,
    watch: watchSmtp,
    reset: resetSmtp,
  } = useForm<SmtpFormValues>({
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

  const {
    register: pop3Register,
    handleSubmit: handlePop3Submit,
    formState: { errors: pop3Errors },
    setValue: setPop3Value,
    watch: watchPop3,
    reset: resetPop3,
  } = useForm<Pop3FormValues>({
    resolver: zodResolver(pop3Schema),
    defaultValues: {
      host: "",
      port: 995,
      secure: true,
      username: "",
      password: "",
      leaveOnServer: true,
      autoCheckInterval: 15,
    },
  });

  const smtpSecure = watchSmtp("secure");
  const smtpHostValue = watchSmtp("host");
  const pop3Secure = watchPop3("secure");
  const pop3HostValue = watchPop3("host");

  // Automatically update port based on secure setting and host
  useEffect(() => {
    const currentPort = watchSmtp("port");
    
    // Only auto-update port if it's one of the standard ports
    if (currentPort === 587 || currentPort === 465) {
      // Set default port based on secure setting
      if (smtpSecure) {
        setSmtpValue("port", 465);
      } else {
        setSmtpValue("port", 587);
      }
    }
  }, [smtpSecure, setSmtpValue, watchSmtp]);

  // Similar for POP3
  useEffect(() => {
    const currentPort = watchPop3("port");
    
    // Only auto-update port if it's one of the standard ports
    if (currentPort === 110 || currentPort === 995) {
      // Set default port based on secure setting
      if (pop3Secure) {
        setPop3Value("port", 995);
      } else {
        setPop3Value("port", 110);
      }
    }
  }, [pop3Secure, setPop3Value, watchPop3]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSmtpSettings();
        if (settings) {
          // SMTP settings
          resetSmtp({
            host: settings.smtp.host || "",
            port: settings.smtp.port || 587,
            secure: settings.smtp.secure !== undefined ? settings.smtp.secure : true,
            username: settings.smtp.username || "",
            password: settings.smtp.password || "",
            fromEmail: settings.smtp.fromEmail || "",
            fromName: settings.smtp.fromName || "",
          });

          // POP3 settings if they exist
          if (settings.pop3) {
            resetPop3({
              host: settings.pop3.host || "",
              port: settings.pop3.port || 995,
              secure: settings.pop3.secure !== undefined ? settings.pop3.secure : true,
              username: settings.pop3.username || "",
              password: settings.pop3.password || "",
              leaveOnServer: settings.pop3.leaveOnServer !== undefined ? settings.pop3.leaveOnServer : true,
              autoCheckInterval: settings.pop3.autoCheckInterval || 15,
            });
          }
        }
      } catch (error) {
        console.error("Error loading email settings:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить настройки электронной почты",
          variant: "destructive",
        });
      }
    };

    loadSettings();
  }, [resetSmtp, resetPop3, setSmtpValue, setPop3Value, toast]);

  const onSubmit = async (smtpData: SmtpFormValues, pop3Data?: Pop3FormValues) => {
    setIsLoading(true);

    try {
      // Create a fully validated settings object
      const emailSettings: EmailSettings = {
        smtp: {
          host: smtpData.host,
          port: smtpData.port,
          secure: smtpData.secure,
          username: smtpData.username,
          password: smtpData.password,
          fromEmail: smtpData.fromEmail,
          fromName: smtpData.fromName,
        }
      };

      // Add POP3 settings if available
      if (pop3Data && pop3Data.host) {
        emailSettings.pop3 = {
          host: pop3Data.host,
          port: pop3Data.port,
          secure: pop3Data.secure,
          username: pop3Data.username,
          password: pop3Data.password,
          leaveOnServer: pop3Data.leaveOnServer,
          autoCheckInterval: pop3Data.autoCheckInterval,
        };
      }
      
      await saveSmtpSettings(emailSettings);
      
      toast({
        title: "Настройки сохранены",
        description: "Настройки электронной почты успешно сохранены",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки электронной почты",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (type: string) => {
    if (type === "smtp") {
      await handleSmtpSubmit(async (data) => {
        const pop3Data = watchPop3();
        await onSubmit(data, pop3Data);
      })();
    } else {
      await handlePop3Submit(async (data) => {
        const smtpData = watchSmtp();
        await onSubmit(smtpData, data);
      })();
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setIsTestSuccess(null);
    setTestErrorMessage(null);

    try {
      const formData = watchSmtp();
      
      // Ensure all required fields are present before testing
      if (!formData.host || !formData.username || !formData.password || 
          !formData.fromEmail || !formData.fromName) {
        setIsTestSuccess(false);
        setTestErrorMessage("Пожалуйста, заполните все обязательные поля");
        toast({
          title: "Ошибка",
          description: "Пожалуйста, заполните все обязательные поля",
          variant: "destructive",
        });
        setIsTesting(false);
        return;
      }
      
      // Create a fully validated settings object
      const smtpSettings: SmtpSettingsType = {
        host: formData.host,
        port: formData.port,
        secure: formData.secure,
        username: formData.username,
        password: formData.password,
        fromEmail: formData.fromEmail,
        fromName: formData.fromName,
      };
      
      const result = await testSmtpConnection(smtpSettings);
      
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
      setTestErrorMessage(error instanceof Error ? error.message : "Неизвестная ошибка");
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить тест соединения",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestPop3Connection = async () => {
    setIsTestingPop3(true);
    setIsPop3TestSuccess(null);
    setPop3TestErrorMessage(null);

    try {
      const formData = watchPop3();
      
      // Ensure all required fields are present before testing
      if (!formData.host || !formData.username || !formData.password) {
        setIsPop3TestSuccess(false);
        setPop3TestErrorMessage("Пожалуйста, заполните все обязательные поля");
        toast({
          title: "Ошибка",
          description: "Пожалуйста, заполните все обязательные поля",
          variant: "destructive",
        });
        setIsTestingPop3(false);
        return;
      }
      
      // Create a fully validated settings object
      const pop3Settings: Pop3SettingsType = {
        host: formData.host,
        port: formData.port,
        secure: formData.secure,
        username: formData.username,
        password: formData.password,
        leaveOnServer: formData.leaveOnServer,
        autoCheckInterval: formData.autoCheckInterval,
      };
      
      const result = await testPop3Connection(pop3Settings);
      
      if (result.success) {
        setIsPop3TestSuccess(true);
        toast({
          title: "Тест успешен",
          description: "Соединение с POP3 сервером работает корректно",
        });
      } else {
        setIsPop3TestSuccess(false);
        setPop3TestErrorMessage(result.message);
        toast({
          title: "Ошибка соединения",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      setIsPop3TestSuccess(false);
      setPop3TestErrorMessage(error instanceof Error ? error.message : "Неизвестная ошибка");
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить тест соединения",
        variant: "destructive",
      });
    } finally {
      setIsTestingPop3(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Mail className="h-6 w-6 text-blue-400" />
        <h2 className="text-2xl font-bold text-white">Настройки электронной почты</h2>
      </div>
      
      <Tabs defaultValue="smtp" className="w-full" value={configType} onValueChange={setConfigType}>
        <TabsList className="bg-gray-800 mb-6">
          <TabsTrigger value="smtp">SMTP (Отправка)</TabsTrigger>
          <TabsTrigger value="pop3">POP3 (Получение)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="smtp">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>Настройка SMTP-сервера</CardTitle>
              <CardDescription>
                Настройте параметры подключения к SMTP-серверу для отправки системных уведомлений и писем пользователям
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSmtpSubmit((data) => onSubmit(data, watchPop3()))} className="space-y-6">
                <Tabs defaultValue="server" className="w-full">
                  <TabsList className="bg-gray-800 mb-6">
                    <TabsTrigger value="server">Сервер</TabsTrigger>
                    <TabsTrigger value="auth">Аутентификация</TabsTrigger>
                    <TabsTrigger value="sender">Отправитель</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="server" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtp-host">SMTP хост</Label>
                        <div className="relative">
                          <Server className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="smtp-host"
                            placeholder="smtp.gmail.com"
                            className="pl-9"
                            {...smtpRegister("host")}
                          />
                        </div>
                        {smtpErrors.host && (
                          <p className="text-sm text-destructive">{smtpErrors.host.message}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="smtp-port">SMTP порт</Label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="smtp-port"
                            type="number"
                            placeholder="587"
                            className="pl-9"
                            {...smtpRegister("port")}
                          />
                        </div>
                        {smtpErrors.port && (
                          <p className="text-sm text-destructive">{smtpErrors.port.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="smtp-secure"
                        checked={smtpSecure}
                        onCheckedChange={(checked) => setSmtpValue("secure", checked)}
                      />
                      <Label htmlFor="smtp-secure">Использовать защищенное соединение (SSL/TLS)</Label>
                    </div>
                    
                    {smtpHostValue?.includes('gmail.com') && (
                      <Alert className="bg-blue-900/40 border-blue-800">
                        <AlertDescription className="text-sm">
                          <strong>Совет по настройке Gmail:</strong> Для аккаунтов Google с двухфакторной аутентификацией необходимо использовать пароль приложения вместо обычного пароля. 
                          <a 
                            href="https://support.google.com/accounts/answer/185833" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 ml-1"
                          >
                            Подробнее о паролях приложений
                          </a>
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="auth" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-username">Имя пользователя</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="smtp-username"
                          placeholder="user@example.com"
                          className="pl-9"
                          {...smtpRegister("username")}
                        />
                      </div>
                      {smtpErrors.username && (
                        <p className="text-sm text-destructive">{smtpErrors.username.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="smtp-password">Пароль</Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="smtp-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Пароль или ключ приложения"
                          className="pl-9 pr-10"
                          {...smtpRegister("password")}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {smtpErrors.password && (
                        <p className="text-sm text-destructive">{smtpErrors.password.message}</p>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="sender" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-fromEmail">Email отправителя</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="smtp-fromEmail"
                          type="email"
                          placeholder="no-reply@yourcompany.com"
                          className="pl-9"
                          {...smtpRegister("fromEmail")}
                        />
                      </div>
                      {smtpErrors.fromEmail && (
                        <p className="text-sm text-destructive">{smtpErrors.fromEmail.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="smtp-fromName">Имя отправителя</Label>
                      <Input
                        id="smtp-fromName"
                        placeholder="Zerofy System"
                        {...smtpRegister("fromName")}
                      />
                      {smtpErrors.fromName && (
                        <p className="text-sm text-destructive">{smtpErrors.fromName.message}</p>
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
                    type="button" 
                    onClick={() => handleFormSubmit("smtp")}
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
        </TabsContent>
        
        <TabsContent value="pop3">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>Настройка POP3-сервера</CardTitle>
              <CardDescription>
                Настройте параметры подключения к POP3-серверу для получения писем от пользователей
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePop3Submit((data) => onSubmit(watchSmtp(), data))} className="space-y-6">
                <Tabs defaultValue="server" className="w-full">
                  <TabsList className="bg-gray-800 mb-6">
                    <TabsTrigger value="server">Сервер</TabsTrigger>
                    <TabsTrigger value="auth">Аутентификация</TabsTrigger>
                    <TabsTrigger value="options">Параметры</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="server" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pop3-host">POP3 хост</Label>
                        <div className="relative">
                          <Server className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="pop3-host"
                            placeholder="pop.gmail.com"
                            className="pl-9"
                            {...pop3Register("host")}
                          />
                        </div>
                        {pop3Errors.host && (
                          <p className="text-sm text-destructive">{pop3Errors.host.message}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="pop3-port">POP3 порт</Label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="pop3-port"
                            type="number"
                            placeholder="995"
                            className="pl-9"
                            {...pop3Register("port")}
                          />
                        </div>
                        {pop3Errors.port && (
                          <p className="text-sm text-destructive">{pop3Errors.port.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="pop3-secure"
                        checked={pop3Secure}
                        onCheckedChange={(checked) => setPop3Value("secure", checked)}
                      />
                      <Label htmlFor="pop3-secure">Использовать защищенное соединение (SSL/TLS)</Label>
                    </div>
                    
                    {pop3HostValue?.includes('gmail.com') && (
                      <Alert className="bg-blue-900/40 border-blue-800">
                        <AlertDescription className="text-sm">
                          <strong>Совет по настройке Gmail:</strong> Убедитесь, что доступ к POP3 включен в настройках Gmail. 
                          <a 
                            href="https://support.google.com/mail/answer/7104828" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 ml-1"
                          >
                            Подробнее о настройке POP3 в Gmail
                          </a>
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="auth" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="pop3-username">Имя пользователя</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="pop3-username"
                          placeholder="user@example.com"
                          className="pl-9"
                          {...pop3Register("username")}
                        />
                      </div>
                      {pop3Errors.username && (
                        <p className="text-sm text-destructive">{pop3Errors.username.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="pop3-password">Пароль</Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="pop3-password"
                          type={showPop3Password ? "text" : "password"}
                          placeholder="Пароль или ключ приложения"
                          className="pl-9 pr-10"
                          {...pop3Register("password")}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                          onClick={() => setShowPop3Password(!showPop3Password)}
                        >
                          {showPop3Password ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {pop3Errors.password && (
                        <p className="text-sm text-destructive">{pop3Errors.password.message}</p>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="options" className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="pop3-leaveOnServer"
                        checked={watchPop3("leaveOnServer")}
                        onCheckedChange={(checked) => setPop3Value("leaveOnServer", checked)}
                      />
                      <Label htmlFor="pop3-leaveOnServer">Оставлять сообщения на сервере</Label>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="pop3-autoCheckInterval">Интервал проверки почты (минуты)</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="pop3-autoCheckInterval"
                          type="number"
                          placeholder="15"
                          className="pl-9"
                          {...pop3Register("autoCheckInterval")}
                        />
                      </div>
                      {pop3Errors.autoCheckInterval && (
                        <p className="text-sm text-destructive">{pop3Errors.autoCheckInterval.message}</p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
                
                {isPop3TestSuccess !== null && (
                  <Alert className={isPop3TestSuccess ? "bg-green-900/40 border-green-800" : "bg-red-900/40 border-red-800"}>
                    <div className="flex items-start">
                      {isPop3TestSuccess ? (
                        <CheckCircle2 className="h-5 w-5 text-green-400 mr-2 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                      )}
                      <AlertDescription className="text-sm">
                        {isPop3TestSuccess 
                          ? "Соединение с POP3 сервером успешно установлено."
                          : `Ошибка соединения: ${pop3TestErrorMessage || "Не удалось подключиться к серверу"}`}
                      </AlertDescription>
                    </div>
                  </Alert>
                )}
                
                <div className="flex flex-col sm:flex-row gap-4 justify-end">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleTestPop3Connection}
                    disabled={isTestingPop3}
                    className="order-2 sm:order-1"
                  >
                    {isTestingPop3 ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Тестирование...
                      </>
                    ) : (
                      "Проверить соединение"
                    )}
                  </Button>
                  
                  <Button 
                    type="button" 
                    onClick={() => handleFormSubmit("pop3")}
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SMTPSettings;
