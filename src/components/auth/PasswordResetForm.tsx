
import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { resetPassword } from "@/services/userService";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Key, Eye, EyeOff } from "lucide-react";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, { message: "Пароль должен содержать не менее 6 символов" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

interface PasswordResetFormProps {
  email: string;
  token: string;
  onSuccess: () => void;
}

const PasswordResetForm = ({
  email,
  token,
  onSuccess,
}: PasswordResetFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof resetPasswordSchema>) => {
    setIsLoading(true);

    try {
      // Выполняем запрос на сброс пароля
      const result = await resetPassword(email, token, data.password);
      
      if (result.success) {
        toast({
          title: "Пароль сброшен",
          description: "Ваш пароль был успешно изменен. Теперь вы можете войти в систему.",
        });
        onSuccess();
      } else {
        toast({
          title: "Ошибка",
          description: result.message || "Произошла ошибка при сбросе пароля",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Ошибка при сбросе пароля:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при сбросе пароля. Пожалуйста, попробуйте позже.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
      <h2 className="text-lg font-medium mb-4">Создание нового пароля</h2>
      
      <p className="text-sm text-muted-foreground mb-4">
        Создайте новый пароль для входа в систему.
      </p>

      <div className="space-y-2">
        <Label htmlFor="password">Новый пароль</Label>
        <div className="relative">
          <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            className="pl-9 pr-9"
            placeholder="Введите новый пароль"
            {...register("password")}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
        <div className="relative">
          <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            className="pl-9 pr-9"
            placeholder="Подтвердите новый пароль"
            {...register("confirmPassword")}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Сброс пароля...
          </>
        ) : (
          "Сбросить пароль"
        )}
      </Button>
    </form>
  );
};

export default PasswordResetForm;
