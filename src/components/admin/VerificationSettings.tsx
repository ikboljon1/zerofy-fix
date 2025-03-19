
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { AlertCircle, Check, Phone, Mail, Shield } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";

const VerificationSettings = () => {
  const [verificationMethod, setVerificationMethod] = useState<"email" | "phone">("email");
  const [isVerificationEnabled, setIsVerificationEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    fetchVerificationSettings();
  }, []);
  
  const fetchVerificationSettings = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("http://localhost:3001/api/settings/verification-method");
      setVerificationMethod(response.data.method);
      setIsVerificationEnabled(response.data.enabled !== false); // Default to true if not specified
    } catch (error) {
      console.error("Ошибка при получении настроек верификации:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось получить настройки верификации",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveVerificationSettings = async () => {
    setIsSaving(true);
    try {
      await axios.put("http://localhost:3001/api/settings/verification-method", {
        method: verificationMethod,
        enabled: isVerificationEnabled
      });
      
      toast({
        title: "Успех",
        description: "Настройки верификации успешно обновлены",
      });
    } catch (error) {
      console.error("Ошибка при сохранении настроек верификации:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки верификации",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center">
          <Shield className="h-5 w-5 mr-2 text-blue-500" />
          <CardTitle>Настройки верификации</CardTitle>
        </div>
        <CardDescription>
          Настройте параметры верификации пользователей при регистрации
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6 p-4 border rounded-md">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-500" />
                <div>
                  <h3 className="font-medium">Включить верификацию</h3>
                  <p className="text-sm text-muted-foreground">
                    Если отключено, пользователи смогут регистрироваться без подтверждения
                  </p>
                </div>
              </div>
              <Switch 
                checked={isVerificationEnabled} 
                onCheckedChange={setIsVerificationEnabled}
                aria-label="Включить верификацию"
              />
            </div>

            {isVerificationEnabled && (
              <RadioGroup
                value={verificationMethod}
                onValueChange={(value) => setVerificationMethod(value as "email" | "phone")}
                className="space-y-4"
              >
                <div className="flex items-center space-x-2 rounded-md border p-4">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer">
                    <Mail className="h-5 w-5 text-blue-500" />
                    <span>Верификация по email</span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 rounded-md border p-4">
                  <RadioGroupItem value="phone" id="phone" />
                  <Label htmlFor="phone" className="flex items-center gap-2 cursor-pointer">
                    <Phone className="h-5 w-5 text-green-500" />
                    <span>Верификация по телефону</span>
                  </Label>
                </div>
              </RadioGroup>
            )}
            
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Важно!</AlertTitle>
              <AlertDescription>
                {isVerificationEnabled 
                  ? "Изменение метода верификации повлияет только на новых пользователей. Для отправки SMS требуется интеграция с SMS-сервисом."
                  : "Отключение верификации снижает безопасность вашего приложения. Рекомендуется использовать верификацию в продакшн-окружении."}
              </AlertDescription>
            </Alert>
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={saveVerificationSettings} 
          disabled={isLoading || isSaving}
          className="ml-auto"
        >
          {isSaving ? (
            <>
              <span className="mr-2">Сохранение...</span>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Сохранить
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default VerificationSettings;
