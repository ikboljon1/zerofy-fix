
import React, { useState } from "react";
import { 
  LayoutDashboard, 
  BarChart2, 
  ShoppingBag, 
  Megaphone,
  User,
  Package,
  WarehouseIcon,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const MobileNavigation = ({ activeTab, onTabChange }: MobileNavigationProps) => {
  const [showStoresSubmenu, setShowStoresSubmenu] = useState(false);
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <>
      <AnimatePresence>
        {showStoresSubmenu && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-16 left-0 right-0 border-t bg-background/95 backdrop-blur z-50"
          >
            <div className="container flex items-center justify-around py-3">
              <button
                className={`flex flex-col items-center space-y-1 ${activeTab === "products" ? "text-primary" : "text-muted-foreground"}`}
                onClick={() => {
                  onTabChange("products");
                  setShowStoresSubmenu(false);
                }}
              >
                <Package className="h-5 w-5" />
                <span className="text-xs">Товары</span>
              </button>
              <button
                className={`flex flex-col items-center space-y-1 ${activeTab === "warehouses" ? "text-primary" : "text-muted-foreground"}`}
                onClick={() => {
                  onTabChange("warehouses");
                  setShowStoresSubmenu(false);
                }}
              >
                <WarehouseIcon className="h-5 w-5" />
                <span className="text-xs">Склады</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur z-40 pb-safe">
        <div className="container flex items-center justify-around py-2">
          <button
            className={`flex flex-col items-center space-y-1 ${activeTab === "home" ? "text-primary" : "text-muted-foreground"}`}
            onClick={() => onTabChange("home")}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-xs">Дашборд</span>
          </button>
          <button
            className={`flex flex-col items-center space-y-1 ${activeTab === "analytics" ? "text-primary" : "text-muted-foreground"}`}
            onClick={() => onTabChange("analytics")}
          >
            <BarChart2 className="h-5 w-5" />
            <span className="text-xs">Аналитика</span>
          </button>
          <button
            className={`flex flex-col items-center space-y-1 ${(activeTab === "stores" || activeTab === "products" || activeTab === "warehouses") ? "text-primary" : "text-muted-foreground"}`}
            onClick={() => {
              if (activeTab !== "stores" && activeTab !== "products" && activeTab !== "warehouses") {
                onTabChange("stores");
              }
              setShowStoresSubmenu(!showStoresSubmenu);
            }}
          >
            <div className="relative">
              <ShoppingBag className="h-5 w-5" />
              {showStoresSubmenu ? (
                <ChevronUp className="absolute -right-3 -top-1 h-3 w-3" />
              ) : (
                <ChevronDown className="absolute -right-3 -top-1 h-3 w-3" />
              )}
            </div>
            <span className="text-xs">Магазин</span>
          </button>
          <button
            className={`flex flex-col items-center space-y-1 ${activeTab === "advertising" ? "text-primary" : "text-muted-foreground"}`}
            onClick={() => onTabChange("advertising")}
          >
            <Megaphone className="h-5 w-5" />
            <span className="text-xs">Реклама</span>
          </button>
          <button
            className={`flex flex-col items-center space-y-1 ${activeTab === "profile" ? "text-primary" : "text-muted-foreground"}`}
            onClick={() => onTabChange("profile")}
          >
            <User className="h-5 w-5" />
            <span className="text-xs">Профиль</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default MobileNavigation;
