
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import PasswordResetRequestForm from "./PasswordResetRequestForm";
import PasswordResetForm from "./PasswordResetForm";
import { useNavigate } from "react-router-dom";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  resetToken?: string;
  resetEmail?: string;
}

// Объект с текстами для разных языков
const localization = {
  ru: {
    welcome: "Добро пожаловать!",
    join: "Присоединяйтесь к Zerofy",
    resetPassword: "Восстановление пароля",
    newPassword: "Создание нового пароля",
    login: "Войти",
    register: "Регистрация",
    loginDescription: "Вход в систему",
    registerDescription: "Регистрация нового аккаунта",
    language: "Язык"
  },
  en: {
    welcome: "Welcome!",
    join: "Join Zerofy",
    resetPassword: "Reset Password",
    newPassword: "Create New Password",
    login: "Log In",
    register: "Register",
    loginDescription: "Sign in to your account",
    registerDescription: "Create a new account",
    language: "Language"
  }
};

const AuthModal = ({ open, onClose, initialMode = 'login', resetToken, resetEmail }: AuthModalProps) => {
  const [activeTab, setActiveTab] = useState<string>(initialMode);
  const [resetMode, setResetMode] = useState<'request' | 'reset' | null>(
    resetToken && resetEmail ? 'reset' : null
  );
  const [emailForReset, setEmailForReset] = useState<string>(resetEmail || '');
  const [language, setLanguage] = useState<'ru' | 'en'>('ru'); // Русский язык по умолчанию
  const navigate = useNavigate();
  const texts = localization[language];

  // Проверяем авторизацию при открытии модального окна
  useEffect(() => {
    if (open) {
      const user = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (user) {
        // Если пользователь авторизован, закрываем модальное окно и перенаправляем на дашборд
        onClose();
        navigate('/dashboard');
      }
    }
  }, [open, navigate, onClose]);

  // Detect reset parameters from URL
  useEffect(() => {
    const url = new URL(window.location.href);
    const tokenFromUrl = url.searchParams.get('resetToken');
    const emailFromUrl = url.searchParams.get('resetEmail');
    
    if (tokenFromUrl && emailFromUrl) {
      setResetMode('reset');
      setEmailForReset(emailFromUrl);
      
      // Clear URL parameters after reading them
      url.searchParams.delete('resetToken');
      url.searchParams.delete('resetEmail');
      window.history.replaceState({}, document.title, url.toString());
    }
  }, [open]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setResetMode(null);
  };

  const handleForgotPassword = () => {
    setResetMode('request');
  };

  const handleBackToLogin = () => {
    setResetMode(null);
    setActiveTab('login');
  };

  const handleResetSent = (email: string) => {
    setEmailForReset(email);
  };

  const handleResetSuccess = () => {
    setResetMode(null);
    setActiveTab('login');
  };
  
  const handleLanguageChange = (value: string) => {
    setLanguage(value as 'ru' | 'en');
  };

  const renderContent = () => {
    if (resetMode === 'request') {
      return (
        <PasswordResetRequestForm 
          onBack={handleBackToLogin} 
          onResetSent={handleResetSent}
        />
      );
    }

    if (resetMode === 'reset' || (resetToken && resetEmail)) {
      return (
        <PasswordResetForm 
          email={emailForReset || resetEmail || ''} 
          token={resetToken || ''}
          onSuccess={handleResetSuccess}
        />
      );
    }

    return (
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">{texts.login}</TabsTrigger>
          <TabsTrigger value="register">{texts.register}</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <LoginForm 
            onSuccess={() => {
              onClose();
              navigate('/dashboard');
            }} 
            onForgotPassword={handleForgotPassword} 
          />
        </TabsContent>
        <TabsContent value="register">
          <RegisterForm 
            onSuccess={() => {
              onClose();
              navigate('/dashboard');
            }} 
          />
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose} modal={true}>
      <DialogContent className="sm:max-w-[425px]" onPointerDownOutside={(e) => e.preventDefault()}>
        <div className="flex justify-end mb-2">
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[120px]">
              <span className="flex items-center">
                <Globe className="h-4 w-4 mr-2" />
                {texts.language}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ru">Русский</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            {resetMode === 'request' 
              ? texts.resetPassword
              : resetMode === 'reset'
                ? texts.newPassword
                : activeTab === 'login' 
                  ? texts.welcome 
                  : texts.join}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {activeTab === 'login' ? texts.loginDescription : texts.registerDescription}
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
