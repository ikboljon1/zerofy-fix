import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Products from "./pages/Products";
import Warehouses from "./pages/Warehouses";
import Advertising from "./components/Advertising";
import Admin from "./pages/Admin";
import LandingPage from "./pages/LandingPage";
import Navbar from "./components/layout/Navbar";
import { useEffect, useState } from "react";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

const queryClient = new QueryClient();

// Protected route component that checks authentication
const ProtectedRoute = ({ children, requireAdmin = false }: { children: JSX.Element, requireAdmin?: boolean }) => {
  const userString = localStorage.getItem('user') || sessionStorage.getItem('user');
  const isAuthenticated = userString !== null;
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  // Check if route requires admin role
  if (requireAdmin) {
    try {
      const user = JSON.parse(userString || '{}');
      if (user.role !== 'admin') {
        // Redirect non-admin users to dashboard
        return <Navigate to="/dashboard" replace />;
      }
    } catch (e) {
      // In case of JSON parse error, redirect to dashboard
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return children;
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Check if user is authenticated on initial load
    const user = localStorage.getItem('user');
    setIsAuthenticated(!!user);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Route to landing page, авторизованные пользователи тоже могут видеть лендинг */}
            <Route path="/" element={
              <>
                <Navbar />
                <LandingPage />
              </>
            } />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/products" element={
              <ProtectedRoute>
                <Products />
              </ProtectedRoute>
            } />
            <Route path="/warehouses" element={
              <ProtectedRoute>
                <Warehouses />
              </ProtectedRoute>
            } />
            <Route path="/advertising" element={
              <ProtectedRoute>
                <Advertising />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin={true}>
                <Admin />
              </ProtectedRoute>
            } />
            {/* Add these routes */}
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
