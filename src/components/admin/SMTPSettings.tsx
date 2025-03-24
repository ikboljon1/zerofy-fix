
import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  getSmtpSettings,
  saveSmtpSettings,
  testSmtpConnection,
  testPop3Connection,
  SmtpSettings,
  Pop3Settings,
  EmailSettings
} from "@/services/userService";
import { Loader2, Mail, Server, Lock, User } from "lucide-react";

const smtpSchema = z.object({
  host: z.string().min(1, { message: "Хост SMTP-сервера обязателен" }),
  port: z.coerce.number().int().positive({ message: "Порт должен быть положительным числом" }),
  secure: z.boolean(),
  username: z.string().min(1, { message: "Имя пользователя обязательно" }),
  password: z.string().min(1, { message: "Пароль обязателен" }),
  fromEmail: z.string().email({ message: "Введите корректный email" }),
  fromName: z.string().optional()
});

const pop3Schema = z.object({
  host: z.string().min(1, { message: "Хост POP3-сервера обязателен" }),
  port: z.coerce.number().int().positive({ message: "Порт должен быть положительным числом" }),
  secure: z.boolean(),
  username: z.string().min(1, { message: "Имя пользователя обязательно" }),
  password: z.string().min(1, { message: "Пароль обязателен" }),
  leaveOnServer: z.boolean(),
  autoCheckInterval: z.coerce.number().int().min(1, { message: "Интервал проверки должен быть положительным числом" })
});

export default function SMTPSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [activeTab, setActiveTab] = useState("smtp");
  const [emailSettings, setEmailSettings] = useState<EmailSettings | null>(null);
  const { toast } = useToast();

  const {
    register: smtpRegister,
    handleSubmit: handleSmtpSubmit,
    formState: { errors: smtpErrors },
    setValue: setSmtpValue,
    watch: watchSmtp,
    reset: resetSmtp
  } = useForm<SmtpSettings & { fromEmail: string; fromName: string }>({
    resolver: zodResolver(smtpSchema),
    defaultValues: {
      host: "",
      port: 587,
      secure: false,
      username: "",
      password: "",
      fromEmail: "",
      fromName: ""
    }
  });

  const {
    register: pop3Register,
    handleSubmit: handlePop3Submit,
    formState: { errors: pop3Errors },
    setValue: setPop3Value,
    watch: watchPop3,
    reset: resetPop3
  } = useForm<Pop3Settings & { leaveOnServer: boolean; autoCheckInterval: number }>({
    resolver: zodResolver(pop3Schema),
    defaultValues: {
      host: "",
      port: 995,
      secure: true,
      username: "",
      password: "",
      leaveOnServer: true,
      autoCheckInterval: 15
    }
  });

  const smtpSecure = watchSmtp("secure");
  const pop3Secure = watchPop3("secure");
  const leaveOnServer = watchPop3("leaveOnServer");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSmtpSettings();
        setEmailSettings(settings);

        // Установка значений для SMTP формы
        resetSmtp({
          host: settings.smtp.host,
          port: settings.smtp.port,
          secure: settings.smtp.secure,
          username: settings.smtp.username,
          password: settings.smtp.password,
          fromEmail: settings.smtp.fromEmail,
          fromName: settings.smtp.fromName
        });

        // Установка значений для POP3 формы
        resetPop3({
          host: settings.pop3.host,
          port: settings.pop3.port,
          secure: settings.pop3.secure,
          username: settings.pop3.username,
          password: settings.pop3.password,
          leaveOnServer: settings.pop3.leaveOnServer,
          autoCheckInterval: settings.pop3.autoCheckInterval
        });
      } catch (error) {
        console.error("Ошибка загрузки настроек:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить настройки email",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const onSaveSmtp = async (data: SmtpSettings & { fromEmail: string; fromName: string }) => {
    setIsSaving(true);
    try {
      const success = await saveSmtpSettings({
        host: data.host,
        port: data.port,
        secure: data.secure,
        username: data.username,
        password: data.password,
        fromEmail: data.fromEmail,
        fromName: data.fromName
      });

      if (success) {
        toast({
          title: "Настройки сохранены",
          description: "Настройки SMTP успешно сохранены",
        });
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось сохранить настройки SMTP",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Ошибка сохранения настроек SMTP:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при сохранении настроек SMTP",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const onSavePop3 = async (data: Pop3Settings & { leaveOnServer: boolean; autoCheckInterval: number }) => {
    setIsSaving(true);
    try {
      // Аналогично сохранению SMTP, но для POP3
      const success = true; // Заглушка, реальная реализация будет добавлена позже

      if (success) {
        toast({
          title: "Настройки сохранены",
          description: "Настройки POP3 успешно сохранены",
        });
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось сохранить настройки POP3",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Ошибка сохранения настроек POP3:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при сохранении настроек POP3",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    setIsTesting(true);
    try {
      const data = watchSmtp();
      const result = await testSmtpConnection({
        host: data.host,
        port: data.port,
        secure: Boolean(data.secure),
        username: data.username,
        password: data.password,
        fromEmail: data.fromEmail,
        fromName: data.fromName
      });

      if (result.success) {
        toast({
          title: "Тест успешен",
          description: result.message || "Соединение с SMTP-сервером успешно установлено",
        });
      } else {
        toast({
          title: "Ошибка",
          description: result.message || "Не удалось установить соединение с SMTP-сервером",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Ошибка тестирования SMTP:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при тестировании SMTP-соединения",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestPop3 = async () => {
    setIsTesting(true);
    try {
      const data = watchPop3();
      const result = await testPop3Connection({
        host: data.host,
        port: data.port,
        secure: Boolean(data.secure),
        username: data.username,
        password: data.password,
        leaveOnServer: Boolean(data.leaveOnServer),
        autoCheckInterval: data.autoCheckInterval
      });

      if (result.success) {
        toast({
          title: "Тест успешен",
          description: result.message || "Соединение с POP3-сервером успешно установлено",
        });
      } else {
        toast({
          title: "Ошибка",
          description: result.message || "Не удалось установить соединение с POP3-сервером",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Ошибка тестирования POP3:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при тестировании POP3-соединения",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Настройки email</CardTitle>
          <CardDescription>Загрузка...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-500" />
          <span>Настройки Email</span>
        </CardTitle>
        <CardDescription>
          Настройте параметры отправки и получения электронных писем
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="smtp">SMTP (Исходящая почта)</TabsTrigger>
            <TabsTrigger value="pop3">POP3 (Входящая почта)</TabsTrigger>
          </TabsList>

          <TabsContent value="smtp" className="pt-4">
            <form onSubmit={handleSmtpSubmit(onSaveSmtp)}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">Хост SMTP-сервера</Label>
                    <div className="relative">
                      <Server className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="smtpHost"
                        className="pl-9"
                        placeholder="smtp.example.com"
                        {...smtpRegister("host")}
                      />
                    </div>
                    {smtpErrors.host && (
                      <p className="text-sm text-destructive">{smtpErrors.host.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">Порт</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      placeholder="587"
                      {...smtpRegister("port")}
                    />
                    {smtpErrors.port && (
                      <p className="text-sm text-destructive">{smtpErrors.port.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="smtpSecure"
                    checked={smtpSecure}
                    onCheckedChange={(checked) => setSmtpValue("secure", checked)}
                  />
                  <Label htmlFor="smtpSecure">Использовать SSL/TLS</Label>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="smtpUsername">Имя пользователя</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="smtpUsername"
                        className="pl-9"
                        placeholder="user@example.com"
                        {...smtpRegister("username")}
                      />
                    </div>
                    {smtpErrors.username && (
                      <p className="text-sm text-destructive">{smtpErrors.username.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpPassword">Пароль</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="smtpPassword"
                        type="password"
                        className="pl-9"
                        placeholder="••••••••"
                        {...smtpRegister("password")}
                      />
                    </div>
                    {smtpErrors.password && (
                      <p className="text-sm text-destructive">{smtpErrors.password.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fromEmail">Email отправителя</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="fromEmail"
                        className="pl-9"
                        placeholder="noreply@example.com"
                        {...smtpRegister("fromEmail")}
                      />
                    </div>
                    {smtpErrors.fromEmail && (
                      <p className="text-sm text-destructive">{smtpErrors.fromEmail.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fromName">Имя отправителя</Label>
                    <Input
                      id="fromName"
                      placeholder="Zerofy"
                      {...smtpRegister("fromName")}
                    />
                  </div>
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Сохранить настройки
                  </Button>
                  <Button type="button" variant="outline" onClick={handleTestSmtp} disabled={isTesting}>
                    {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Протестировать соединение
                  </Button>
                </div>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="pop3" className="pt-4">
            <form onSubmit={handlePop3Submit(onSavePop3)}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pop3Host">Хост POP3-сервера</Label>
                    <div className="relative">
                      <Server className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="pop3Host"
                        className="pl-9"
                        placeholder="pop3.example.com"
                        {...pop3Register("host")}
                      />
                    </div>
                    {pop3Errors.host && (
                      <p className="text-sm text-destructive">{pop3Errors.host.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pop3Port">Порт</Label>
                    <Input
                      id="pop3Port"
                      type="number"
                      placeholder="995"
                      {...pop3Register("port")}
                    />
                    {pop3Errors.port && (
                      <p className="text-sm text-destructive">{pop3Errors.port.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="pop3Secure"
                    checked={pop3Secure}
                    onCheckedChange={(checked) => setPop3Value("secure", checked)}
                  />
                  <Label htmlFor="pop3Secure">Использовать SSL/TLS</Label>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pop3Username">Имя пользователя</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="pop3Username"
                        className="pl-9"
                        placeholder="user@example.com"
                        {...pop3Register("username")}
                      />
                    </div>
                    {pop3Errors.username && (
                      <p className="text-sm text-destructive">{pop3Errors.username.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pop3Password">Пароль</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="pop3Password"
                        type="password"
                        className="pl-9"
                        placeholder="••••••••"
                        {...pop3Register("password")}
                      />
                    </div>
                    {pop3Errors.password && (
                      <p className="text-sm text-destructive">{pop3Errors.password.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="leaveOnServer"
                    checked={leaveOnServer}
                    onCheckedChange={(checked) => setPop3Value("leaveOnServer", Boolean(checked))}
                  />
                  <Label htmlFor="leaveOnServer">Оставлять письма на сервере</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="autoCheckInterval">Интервал проверки почты (минуты)</Label>
                  <Input
                    id="autoCheckInterval"
                    type="number"
                    placeholder="15"
                    {...pop3Register("autoCheckInterval")}
                  />
                  {pop3Errors.autoCheckInterval && (
                    <p className="text-sm text-destructive">{pop3Errors.autoCheckInterval.message}</p>
                  )}
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Сохранить настройки
                  </Button>
                  <Button type="button" variant="outline" onClick={handleTestPop3} disabled={isTesting}>
                    {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Протестировать соединение
                  </Button>
                </div>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
