
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const AuthModal = ({ open, onClose, initialMode = 'login', resetToken, resetEmail }: AuthModalProps) => {
  const [activeTab, setActiveTab] = useState<string>(initialMode);
  const [resetMode, setResetMode] = useState<'request' | 'reset' | null>(
    resetToken && resetEmail ? 'reset' : null
  );
  const [emailForReset, setEmailForReset] = useState<string>(resetEmail || '');
  const navigate = useNavigate();

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
          <TabsTrigger value="login">Войти</TabsTrigger>
          <TabsTrigger value="register">Регистрация</TabsTrigger>
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
          <RegisterForm onSuccess={onClose} />
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose} modal={true}>
      <DialogContent className="sm:max-w-[425px]" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            {resetMode === 'request' 
              ? 'Восстановление пароля'
              : resetMode === 'reset'
                ? 'Создание нового пароля'
                : activeTab === 'login' 
                  ? 'Добро пожаловать!' 
                  : 'Присоединяйтесь к Zerofy'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {activeTab === 'login' ? 'Вход в систему' : 'Регистрация нового аккаунта'}
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
