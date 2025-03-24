
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import MainLayout from "@/components/layout/MainLayout";
import AnalyticsSection from "@/components/analytics/AnalyticsSection";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { User, hasFeatureAccess, getTrialDaysRemaining } from "@/services/userService";
import { useToast } from "@/hooks/use-toast";
import SubscriptionExpiredAlert from "@/components/subscription/SubscriptionExpiredAlert";

const Analytics = () => {
  const [activeTab, setActiveTab] = useState("analytics");
  const isMobile = useIsMobile();
  const [user, setUser] = useState<User | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is authenticated
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (!storedUser) {
      // User is not authenticated, redirect to landing page
      toast({
        title: "Доступ запрещен",
        description: "Пожалуйста, войдите в систему для доступа к аналитике",
        variant: "destructive"
      });
      navigate('/', { replace: true });
      return;
    }
    
    // User is authenticated, set user data
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    
    // Check if user has access (trial or active subscription)
    const access = hasFeatureAccess(parsedUser);
    setHasAccess(access);
    
    // Calculate trial days if in trial
    if (parsedUser.isInTrial) {
      setTrialDaysLeft(getTrialDaysRemaining(parsedUser));
    }
  }, [navigate, toast]);

  const handleTabChange = (tab: string) => {
    if (tab === "analytics") {
      // Already on analytics page, do nothing
      return;
    }
    
    // For other tabs, navigate to the appropriate route
    switch (tab) {
      case "home":
        navigate('/dashboard');
        break;
      case "products":
        navigate('/products');
        break;
      case "stores":
        navigate('/dashboard'); // Navigate to dashboard and change tab
        setActiveTab("stores");
        break;
      case "warehouses":
        navigate('/warehouses');
        break;
      case "advertising":
        navigate('/advertising');
        break;
      case "profile":
        navigate('/dashboard'); // Navigate to dashboard and change tab
        setActiveTab("profile");
        break;
      default:
        navigate('/dashboard');
        break;
    }
  };

  const handleUserUpdated = (updatedUser: User) => {
    setUser(updatedUser);
    // Re-check access with updated user data
    setHasAccess(hasFeatureAccess(updatedUser));
    
    if (updatedUser.isInTrial) {
      setTrialDaysLeft(getTrialDaysRemaining(updatedUser));
    }
    
    // Save updated user to storage
    const storage = sessionStorage.getItem('user') ? sessionStorage : localStorage;
    storage.setItem('user', JSON.stringify(updatedUser));
  };

  const renderContent = () => {
    // If user doesn't have access (trial expired and no subscription)
    if (!hasAccess) {
      return <SubscriptionExpiredAlert user={user} onUserUpdated={handleUserUpdated} />;
    }
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <AnalyticsSection />
      </motion.div>
    );
  };

  return (
    <MainLayout 
      activeTab={activeTab} 
      onTabChange={handleTabChange} 
      user={user}
      trialDaysLeft={trialDaysLeft}
    >
      {renderContent()}
    </MainLayout>
  );
};

export default Analytics;
