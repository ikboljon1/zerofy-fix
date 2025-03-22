import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  EmailSettings,
  SmtpSettings,
  Pop3Settings,
  getSmtpSettings,
  saveSmtpSettings,
  testSmtpConnection,
  testPop3Connection
} from "@/services/userService";
import { Loader2, Mail, Network } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SMTPSettings = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [isTestingPop3, setIsTestingPop3] = useState(false);
  const [smtpSettings, setSmtpSettings] = useState<SmtpSettings>({
    host: '',
    port: 587,
    secure: false,
    username: '',
    password: '',
    fromEmail: '',
    fromName: '',
  });
  const [pop3Settings, setPop3Settings] = useState<Pop3Settings>({
    host: '',
    port: 995,
    secure: true,
    username: '',
    password: '',
    leaveOnServer: true,
    autoCheckInterval: 15,
  });
  const [supportEmail, setSupportEmail] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSmtpSettings();
        setSmtpSettings({
          host: settings.smtp.host,
          port: settings.smtp.port,
          secure: settings.smtp.secure,
          username: settings.smtp.username,
          password: settings.smtp.password,
          fromEmail: settings.smtp.fromEmail || '',
          fromName: settings.smtp.fromName || ''
        });
        setPop3Settings({
          host: settings.pop3.host,
          port: settings.pop3.port,
          secure: settings.pop3.secure,
          username: settings.pop3.username,
          password: settings.pop3.password,
          leaveOnServer: settings.pop3.leaveOnServer || true,
          autoCheckInterval: settings.pop3.autoCheckInterval || 15
        });
        setSupportEmail(settings.supportEmail);
      } catch (error) {
        console.error("Error loading SMTP settings:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить настройки SMTP",
          variant: "destructive",
        });
      }
    };

    loadSettings();
  }, [toast]);

  const handleTestSmtp = async () => {
    setIsTestingSmtp(true);
    try {
      const result = await testSmtpConnection({
        host: smtpSettings.host,
        port: smtpSettings.port,
        secure: smtpSettings.secure,
        username: smtpSettings.username,
        password: smtpSettings.password,
        fromEmail: smtpSettings.fromEmail,
        fromName: smtpSettings.fromName
      });
      
      if (result.success) {
        toast({
          title: "Успешно",
          description: "SMTP соединение успешно установлено",
        });
      } else {
        toast({
          title: "Ошибка",
          description: result.message || "Не удалось установить SMTP соединение",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error testing SMTP connection:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при тестировании SMTP соединения",
        variant: "destructive",
      });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const handleTestPop3 = async () => {
    setIsTestingPop3(true);
    try {
      const result = await testPop3Connection({
        host: pop3Settings.host,
        port: pop3Settings.port,
        secure: pop3Settings.secure,
        username: pop3Settings.username,
        password: pop3Settings.password,
        leaveOnServer: pop3Settings.leaveOnServer,
        autoCheckInterval: pop3Settings.autoCheckInterval
      });
      
      if (result.success) {
        toast({
          title: "Успешно",
          description: "POP3 соединение успешно установлено",
        });
      } else {
        toast({
          title: "Ошибка",
          description: result.message || "Не удалось установить POP3 соединение",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error testing POP3 connection:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при тестировании POP3 соединения",
        variant: "destructive",
      });
    } finally {
      setIsTestingPop3(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const settings: EmailSettings = {
        smtp: {
          host: smtpSettings.host,
          port: smtpSettings.port,
          secure: smtpSettings.secure,
          username: smtpSettings.username,
          password: smtpSettings.password,
          fromEmail: smtpSettings.fromEmail,
          fromName: smtpSettings.fromName
        },
        pop3: {
          host: pop3Settings.host,
          port: pop3Settings.port,
          secure: pop3Settings.secure,
          username: pop3Settings.username,
          password: pop3Settings.password,
          leaveOnServer: pop3Settings.leaveOnServer,
          autoCheckInterval: pop3Settings.autoCheckInterval
        },
        supportEmail: supportEmail
      };
      
      const result = await saveSmtpSettings(settings);
      
      if (result) {
        toast({
          title: "Успешно",
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
      console.error("Error saving SMTP settings:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при сохранении настроек SMTP",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mail className="mr-2 h-5 w-5" />
          Настройки SMTP
        </CardTitle>
        <CardDescription>
          Настройте параметры SMTP для отправки электронной почты
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="host">SMTP Host</Label>
            <Input
              id="host"
              value={smtpSettings.host}
              onChange={(e) => setSmtpSettings({...smtpSettings, host: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="port">SMTP Port</Label>
            <Input
              id="port"
              type="number"
              value={smtpSettings.port}
              onChange={(e) => setSmtpSettings({...smtpSettings, port: parseInt(e.target.value)})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fromEmail">Email отправителя</Label>
            <Input
              id="fromEmail"
              value={smtpSettings.fromEmail}
              onChange={(e) => setSmtpSettings({...smtpSettings, fromEmail: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fromName">Имя отправителя</Label>
            <Input
              id="fromName"
              value={smtpSettings.fromName}
              onChange={(e) => setSmtpSettings({...smtpSettings, fromName: e.target.value})}
            />
          </div>
          <div className="col-span-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="secure"
                checked={smtpSettings.secure}
                onCheckedChange={(checked) => setSmtpSettings({...smtpSettings, secure: checked})}
              />
              <Label htmlFor="secure">Использовать безопасное соединение (TLS)</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">SMTP Username</Label>
            <Input
              id="username"
              value={smtpSettings.username}
              onChange={(e) => setSmtpSettings({...smtpSettings, username: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">SMTP Password</Label>
            <Input
              id="password"
              type="password"
              value={smtpSettings.password}
              onChange={(e) => setSmtpSettings({...smtpSettings, password: e.target.value})}
            />
          </div>
        </div>
        <Separator className="my-4" />
        <CardTitle className="text-md">Настройки POP3</CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pop3Host">POP3 Host</Label>
            <Input
              id="pop3Host"
              value={pop3Settings.host}
              onChange={(e) => setPop3Settings({...pop3Settings, host: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pop3Port">POP3 Port</Label>
            <Input
              id="pop3Port"
              type="number"
              value={pop3Settings.port}
              onChange={(e) => setPop3Settings({...pop3Settings, port: parseInt(e.target.value)})}
            />
          </div>
          <div className="col-span-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pop3Secure"
                checked={pop3Settings.secure}
                onCheckedChange={(checked) => setPop3Settings({...pop3Settings, secure: checked})}
              />
              <Label htmlFor="pop3Secure">Использовать безопасное соединение (TLS)</Label>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="leaveOnServer" 
              checked={pop3Settings.leaveOnServer}
              onCheckedChange={(checked) => setPop3Settings({...pop3Settings, leaveOnServer: Boolean(checked)})}
            />
            <Label htmlFor="leaveOnServer">Оставлять письма на сервере</Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="autoCheckInterval">Интервал проверки (минуты)</Label>
            <Input
              id="autoCheckInterval"
              type="number"
              value={pop3Settings.autoCheckInterval}
              onChange={(e) => setPop3Settings({...pop3Settings, autoCheckInterval: parseInt(e.target.value)})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pop3Username">POP3 Username</Label>
            <Input
              id="pop3Username"
              value={pop3Settings.username}
              onChange={(e) => setPop3Settings({...pop3Settings, username: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pop3Password">POP3 Password</Label>
            <Input
              id="pop3Password"
              type="password"
              value={pop3Settings.password}
              onChange={(e) => setPop3Settings({...pop3Settings, password: e.target.value})}
            />
          </div>
        </div>
        <Separator className="my-4" />
        <div className="space-y-2">
          <Label htmlFor="supportEmail">Email для поддержки</Label>
          <Input
            id="supportEmail"
            type="email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
          />
        </div>
      </CardContent>
      <div className="flex justify-between p-4">
        <Button
          variant="outline"
          disabled={isTestingSmtp || isTestingPop3}
          onClick={handleTestSmtp}
        >
          {isTestingSmtp ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Тестирование SMTP...
            </>
          ) : (
            <>
              <Network className="mr-2 h-4 w-4" />
              Проверить SMTP
            </>
          )}
        </Button>
        <Button
          variant="outline"
          disabled={isTestingSmtp || isTestingPop3}
          onClick={handleTestPop3}
        >
          {isTestingPop3 ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Тестирование POP3...
            </>
          ) : (
            <>
              <Network className="mr-2 h-4 w-4" />
              Проверить POP3
            </>
          )}
        </Button>
      </div>
      <CardContent className="border-t">
        <Alert>
          <AlertDescription>
            Внимание! Изменение настроек SMTP может повлиять на отправку уведомлений и других электронных писем.
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardContent className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Сохранение...
            </>
          ) : (
            "Сохранить"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SMTPSettings;
