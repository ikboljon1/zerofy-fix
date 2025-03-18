
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, User, Lock, Phone } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { registerUser, checkPhoneExists } from "@/services/userService";
import { Checkbox } from "@/components/ui/checkbox";

const phoneRegex = /^(\+7|7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;

const registerSchema = z.object({
  name: z.string().min(3, { message: "Имя должно содержать не менее 3 символов" }),
  email: z.string().email({ message: "Введите корректный email" }),
  phone: z.string().optional().refine(val => !val || phoneRegex.test(val), {
    message: "Введите корректный номер телефона"
  }),
  password: z.string().min(6, { message: "Пароль должен содержать не менее 6 символов" }),
  confirmPassword: z.string().min(6, { message: "Пароль должен содержать не менее 6 символов" }),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "Вы должны принять условия использования" }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Пароли не совпадают",
});

interface RegisterFormProps {
  onLoginClick: () => void;
  onSuccessfulRegister: (userData: any) => void;
  onSuccess?: () => void; // Added this prop to match usage in AuthModal
}

const RegisterForm = ({ onLoginClick, onSuccessfulRegister, onSuccess }: RegisterFormProps) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
  } = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: z.infer<typeof registerSchema>) => {
    setIsRegistering(true);
    
    try {
      // Check if phone exists (if provided)
      if (data.phone) {
        const phoneExists = await checkPhoneExists(data.phone);
        if (phoneExists) {
          setError("phone", { 
            type: "manual", 
            message: "Пользователь с таким номером телефона уже зарегистрирован" 
          });
          setIsRegistering(false);
          return;
        }
      }

      // Register the user
      const result = await registerUser(
        data.name,
        data.email,
        data.password,
        data.phone || undefined
      );

      if (result.success && result.user) {
        toast({
          title: "Регистрация успешна",
          description: "Теперь вы можете войти в систему",
        });
        
        onSuccessfulRegister(result.user);
        // Call the optional onSuccess if provided
        if (onSuccess) onSuccess();
      } else {
        toast({
          title: "Ошибка регистрации",
          description: result.errorMessage || "Не удалось зарегистрировать пользователя",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Ошибка регистрации:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить регистрацию. Пожалуйста, попробуйте еще раз.",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const password = watch("password");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
      <div className="space-y-2">
        <Label htmlFor="name">ФИО</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input id="name" className="pl-9" placeholder="Введите ваше ФИО" {...register("name")} />
        </div>
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input id="email" type="email" className="pl-9" placeholder="Введите ваш email" {...register("email")} />
        </div>
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Телефон (опционально)</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input id="phone" className="pl-9" placeholder="+7 (___) ___-__-__" {...register("phone")} />
        </div>
        {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Пароль</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input id="password" type="password" className="pl-9" placeholder="Минимум 6 символов" {...register("password")} />
        </div>
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Подтверждение пароля</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input id="confirmPassword" type="password" className="pl-9" placeholder="Повторите пароль" {...register("confirmPassword")} />
        </div>
        {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox id="terms" {...register("acceptTerms")} />
        <label
          htmlFor="terms"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Я согласен с условиями использования
        </label>
      </div>
      {errors.acceptTerms && <p className="text-sm text-destructive">{errors.acceptTerms.message}</p>}
      
      <Button type="submit" className="w-full" disabled={isRegistering}>
        {isRegistering ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Регистрация...
          </>
        ) : (
          "Зарегистрироваться"
        )}
      </Button>
      
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Уже есть аккаунт?{" "}
          <Button variant="link" className="p-0 h-auto" onClick={onLoginClick}>
            Войти
          </Button>
        </p>
      </div>
    </form>
  );
};

export default RegisterForm;
