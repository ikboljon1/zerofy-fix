import { useState, useEffect } from "react";
import { Home, BarChart2, Package, ShoppingBag, User, WarehouseIcon, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface MobileNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const MobileNavigation = ({ activeTab, onTabChange }: MobileNavigationProps) => {
  const [visible, setVisible] = useState(true);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollTop = window.scrollY;
      if (currentScrollTop > lastScrollTop && currentScrollTop > 100) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      setLastScrollTop(currentScrollTop);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollTop]);

  const handleItemClick = (value: string) => {
    if (value === 'analytics') {
      navigate('/analytics');
    } else if (value === 'home') {
      navigate('/dashboard');
    } else if (value === 'products') {
      navigate('/products');
    } else if (value === 'warehouses') {
      navigate('/warehouses');
    } else {
      onTabChange(value);
    }
  };

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-background border-t border-border md:hidden z-30 transition-transform duration-300",
        visible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="flex justify-around items-center p-2">
        <button
          onClick={() => handleItemClick("home")}
          className={cn(
            "flex flex-col items-center justify-center p-2 rounded-md w-16",
            activeTab === "home" ? "text-primary" : "text-gray-500"
          )}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs mt-1">Главная</span>
        </button>
        <button
          onClick={() => handleItemClick("analytics")}
          className={cn(
            "flex flex-col items-center justify-center p-2 rounded-md w-16",
            activeTab === "analytics" ? "text-primary" : "text-gray-500"
          )}
        >
          <BarChart2 className="h-5 w-5" />
          <span className="text-xs mt-1">Аналитика</span>
        </button>
        <button
          onClick={() => handleItemClick("products")}
          className={cn(
            "flex flex-col items-center justify-center p-2 rounded-md w-16",
            activeTab === "products" ? "text-primary" : "text-gray-500"
          )}
        >
          <Package className="h-5 w-5" />
          <span className="text-xs mt-1">Товары</span>
        </button>
        <button
          onClick={() => handleItemClick("warehouses")}
          className={cn(
            "flex flex-col items-center justify-center p-2 rounded-md w-16",
            activeTab === "warehouses" ? "text-primary" : "text-gray-500"
          )}
        >
          <WarehouseIcon className="h-5 w-5" />
          <span className="text-xs mt-1">Склады</span>
        </button>
        <button
          onClick={() => handleItemClick("profile")}
          className={cn(
            "flex flex-col items-center justify-center p-2 rounded-md w-16",
            activeTab === "profile" ? "text-primary" : "text-gray-500"
          )}
        >
          <User className="h-5 w-5" />
          <span className="text-xs mt-1">Профиль</span>
        </button>
      </div>
    </div>
  );
};

export default MobileNavigation;
