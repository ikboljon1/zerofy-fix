import { useState } from "react";
import { Home, BarChart2, Package, ShoppingBag, User, Calculator, Sun, Moon, Zap, Megaphone, Settings, LogOut, WarehouseIcon, MenuIcon, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import MobileNavigation from "./MobileNavigation";
import CalculatorModal from "@/components/CalculatorModal";
import { User as UserType } from "@/services/userService";
import { initialTariffs } from "@/data/tariffs";
import { supabase } from "@/integrations/supabase/client";

// Define menu profile options - adding logout option
const profileMenu = [{
  label: "Настройки",
  value: "settings",
  icon: Settings
}, {
  label: "Выйти",
  value: "logout",
  icon: LogOut
}];
interface MainLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: UserType | null;
  trialDaysLeft?: number;
}
const MainLayout = ({
  children,
  activeTab,
  onTabChange,
  user,
  trialDaysLeft = 0
}: MainLayoutProps) => {
  const [showCalculator, setShowCalculator] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isMobile = useIsMobile();
  const {
    theme,
    toggleTheme
  } = useTheme();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    // Выход из Supabase (если пользователь авторизован)
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Error signing out from Supabase:", e);
    }
    
    // Удаляем данные пользователя из хранилища
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');

    // Перенаправляем на главную страницу
    navigate('/');
  };
  
  const handleMenuItemClick = (value: string) => {
    if (value === 'logout') {
      handleLogout();
    } else {
      onTabChange(value);
    }
    setShowMobileMenu(false);
  };

  // Получаем название тарифа из ID
  const getTariffName = (tariffId?: string): string => {
    if (!tariffId) return "";
    const tariff = initialTariffs.find(t => t.id === tariffId);
    return tariff ? tariff.name : `Тариф ${tariffId}`;
  };
  
  const renderSubscriptionBadge = () => {
    if (!user) return null;
    if (user.isInTrial && trialDaysLeft > 0) {
      return <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 border-amber-200">
          <Clock className="mr-1 h-3 w-3" />
          Пробный период: {trialDaysLeft} {trialDaysLeft === 1 ? 'день' : trialDaysLeft < 5 ? 'дня' : 'дней'}
        </Badge>;
    }
    if (user.isSubscriptionActive) {
      return <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 border-green-200">
          {getTariffName(user.tariffId)}
        </Badge>;
    }
    return null;
  };
  
  return <div className="min-h-screen bg-background pb-16 md:pb-0">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b">
        {isMobile ? <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Zerofy</h1>
              {renderSubscriptionBadge()}
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" onClick={() => setShowCalculator(true)}>
                <Calculator className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MenuIcon className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[80%] sm:max-w-sm" side="right">
                  <SheetHeader className="border-b pb-4 mb-4">
                    <SheetTitle className="flex items-center">
                      <Zap className="h-6 w-6 text-primary mr-2" />
                      Zerofy
                      {renderSubscriptionBadge()}
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col space-y-2">
                    <Button variant="ghost" className="justify-start" onClick={() => handleMenuItemClick("home")}>
                      <Home className="mr-2 h-4 w-4" />
                      Dashboard
                    </Button>
                    <Button variant="ghost" className="justify-start" onClick={() => handleMenuItemClick("analytics")}>
                      <BarChart2 className="mr-2 h-4 w-4" />
                      Analytics
                    </Button>
                    <Button variant="ghost" className="justify-start" onClick={() => handleMenuItemClick("products")}>
                      <Package className="mr-2 h-4 w-4" />
                      Товары
                    </Button>
                    <Button variant="ghost" className="justify-start" onClick={() => handleMenuItemClick("stores")}>
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Магазины
                    </Button>
                    <Button variant="ghost" className="justify-start" onClick={() => handleMenuItemClick("warehouses")}>
                      <WarehouseIcon className="mr-2 h-4 w-4" />
                      Склады
                    </Button>
                    <Button variant="ghost" className="justify-start" onClick={() => handleMenuItemClick("advertising")}>
                      <Megaphone className="mr-2 h-4 w-4" />
                      Реклама
                    </Button>
                    <Button variant="ghost" className="justify-start" onClick={() => handleMenuItemClick("profile")}>
                      <User className="mr-2 h-4 w-4" />
                      Профиль
                    </Button>
                    
                    <div className="border-t my-2 pt-2">
                      {profileMenu.map(item => <Button key={item.value} variant="ghost" className="justify-start w-full" onClick={() => handleMenuItemClick(item.value)}>
                          <item.icon className="mr-2 h-4 w-4" />
                          {item.label}
                        </Button>)}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div> : <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <Zap className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold">Zerofy</h1>
                {renderSubscriptionBadge()}
              </div>
              <nav className="hidden md:flex space-x-6">
                <Button variant="ghost" onClick={() => onTabChange("home")} className={activeTab === "home" ? "bg-accent" : ""}>
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
                <Button variant="ghost" onClick={() => onTabChange("analytics")} className={activeTab === "analytics" ? "bg-accent" : ""}>
                  <BarChart2 className="mr-2 h-4 w-4" />
                  Analytics
                </Button>
                <Button variant="ghost" onClick={() => onTabChange("products")} className={activeTab === "products" ? "bg-accent" : ""}>
                  <Package className="mr-2 h-4 w-4" />
                  Товары
                </Button>
                <Button variant="ghost" onClick={() => onTabChange("stores")} className={activeTab === "stores" ? "bg-accent" : ""}>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Магазины
                </Button>
                <Button variant="ghost" onClick={() => onTabChange("warehouses")} className={activeTab === "warehouses" ? "bg-accent" : ""}>
                  <WarehouseIcon className="mr-2 h-4 w-4" />
                  Склады
                </Button>
                <Button variant="ghost" onClick={() => onTabChange("advertising")} className={activeTab === "advertising" ? "bg-accent" : ""}>
                  <Megaphone className="mr-2 h-4 w-4" />
                  Реклама
                </Button>
                <Button variant="ghost" onClick={() => onTabChange("profile")} className={activeTab === "profile" ? "bg-accent" : ""}>
                  <User className="mr-2 h-4 w-4" />
                  Профиль
                </Button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => setShowCalculator(true)}>
                <Calculator className="mr-2 h-4 w-4" />
                Calculator
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Выйти
              </Button>
            </div>
          </div>}
      </header>

      <main className={`container px-4 py-6 ${isMobile ? 'pb-20 space-y-4' : 'space-y-6'}`}>
        {children}
      </main>

      <MobileNavigation activeTab={activeTab} onTabChange={onTabChange} />

      <CalculatorModal open={showCalculator} onClose={() => setShowCalculator(false)} />
    </div>;
};
export default MainLayout;
