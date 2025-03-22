import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { completePasswordReset } from "@/services/userService";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

const PasswordResetForm = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [queryParams] = useSearchParams();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setError("");
    
    if (password !== confirmPassword) {
      setIsSubmitting(false);
      setError("Пароли не совпадают");
      return;
    }
    
    try {
      // Use email from query param if available
      const email = queryParams.get("email") || "";
      
      // Update to match completePasswordReset function signature
      const result = await completePasswordReset(email, password);
      
      if (result.success) {
        setIsSuccess(true);
        toast({
          title: "Пароль изменен",
          description: "Ваш пароль был успешно изменен. Теперь вы можете войти с новым паролем.",
        });
        
        navigate("/login", { replace: true });
      } else {
        setError(result.message || "Не удалось сбросить пароль. Пожалуйста, попробуйте снова.");
      }
    } catch (error: any) {
      setError(error.message || "Произошла ошибка при обработке запроса. Пожалуйста, попробуйте позже.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center h-screen">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Сброс пароля</CardTitle>
          <CardDescription>Введите новый пароль</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {isSuccess && (
            <Alert>
              <AlertDescription>Пароль успешно изменен. Сейчас вы будете перенаправлены на страницу входа.</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-2">
            <Label htmlFor="password">Новый пароль</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Подтвердите пароль</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button disabled={isSubmitting} onClick={handleReset}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Подождите...
              </>
            ) : (
              "Сбросить пароль"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordResetForm;
