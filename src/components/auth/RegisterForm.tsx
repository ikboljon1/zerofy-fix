
import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/services/userService";
import { Loader2, User as UserIcon, Lock, Mail, Phone } from "lucide-react";

// Mock implementations
const registerUser = async (
  name: string, 
  email: string, 
  password: string,
  phone?: string
): Promise<{ success: boolean; user?: User; errorMessage?: string }> => {
  // Simulate a network request
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Create a mock user
  const newUser: User = {
    id: Date.now().toString(),
    name,
    email,
    password,
    phone,
    tariffId: '3',
    isSubscriptionActive: false,
    isInTrial: true,
    trialEndDate: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString(),
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/\s+/g, '')}`,
    role: 'user',
    status: 'active',
    registeredAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    storeCount: 0
  };
  
  return {
    success: true,
    user: newUser
  };
};

const checkPhoneExists = async (phone: string): Promise<boolean> => {
  // Simulate a network request
  await new Promise(resolve => setTimeout(resolve, 300));
  return false; // Always return false for now
};

const registerSchema = z.object({
  name: z.string().min(2, { message: "Имя должно содержать не менее 2 символов" }),
  email: z.string().email({ message: "Введите корректный email" }),
  password: z.string().min(6, { message: "Пароль должен содержать не менее 6 символов" }),
  phone: z.string().optional(),
});

interface RegisterFormProps {
  onSuccess: (user: User) => void;
  onBackToLogin: () => void;
}

const RegisterForm = ({ onSuccess, onBackToLogin }: RegisterFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof registerSchema>) => {
    setIsLoading(true);

    try {
      if (data.phone) {
        const phoneExists = await checkPhoneExists(data.phone);
        if (phoneExists) {
          setError("phone", {
            type: "manual",
            message: "Этот номер телефона уже зарегистрирован",
          });
          setIsLoading(false);
          return;
        }
      }

      const result = await registerUser(
        data.name,
        data.email,
        data.password,
        data.phone || undefined
      );

      if (result.success && result.user) {
        toast({
          title: "Регистрация успешна",
          description: "Вы успешно зарегистрировались в системе",
        });
        onSuccess(result.user);
      } else {
        toast({
          title: "Ошибка",
          description: result.errorMessage || "Произошла ошибка при регистрации",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error during registration:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при регистрации",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
      <h2 className="text-2xl font-bold mb-6">Регистрация</h2>

      <div className="space-y-2">
        <Label htmlFor="name">ФИО</Label>
        <div className="relative">
          <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="name"
            placeholder="Введите ваше имя"
            className="pl-9"
            {...register("name")}
          />
        </div>
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="email"
            type="email"
            placeholder="Введите ваш email"
            className="pl-9"
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Телефон (необязательно)</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="phone"
            placeholder="Введите ваш телефон"
            className="pl-9"
            {...register("phone")}
          />
        </div>
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Пароль</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="password"
            type="password"
            placeholder="Создайте пароль"
            className="pl-9"
            {...register("password")}
          />
        </div>
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Регистрация...
          </>
        ) : (
          "Зарегистрироваться"
        )}
      </Button>

      <div className="text-center mt-4">
        <p className="text-sm text-muted-foreground">
          Уже есть аккаунт?{" "}
          <Button
            variant="link"
            className="p-0 h-auto font-normal"
            onClick={onBackToLogin}
          >
            Войти
          </Button>
        </p>
      </div>
    </form>
  );
};

export default RegisterForm;
