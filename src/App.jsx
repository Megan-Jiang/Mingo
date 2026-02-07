import React, { useEffect, useState } from 'react';
import BottomNavigation from './components/BottomNavigation';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { navItems } from './nav-items';
import Login from './pages/Login';
import { onAuthStateChange, getSession } from './services/auth';

const queryClient = new QueryClient();

/**
 * 路由守卫组件
 * 检查用户是否已登录，未登录则跳转到登录页
 */
const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSession();
        if (session) {
          setIsAuthenticated(true);
        } else {
          navigate('/login');
        }
      } catch (err) {
        console.error('检查认证状态失败:', err);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // 监听认证状态变化
  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background-custom flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#fcd753] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : null;
};

/**
 * 主应用内容（已认证）
 */
const AppContent = () => (
  <div className="min-h-screen bg-background-custom">
    <div className="pb-20">
      <Routes>
        {navItems.map(({ to, page }) => (
          <Route key={to} path={to} element={page} />
        ))}
        {/* 默认跳转到记录页 */}
        <Route path="/" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
    <BottomNavigation />
  </div>
);

/**
 * 根组件
 */
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <HashRouter>
          <Routes>
            {/* 登录页 - 公开 */}
            <Route path="/login" element={<Login />} />

            {/* 受保护的路由 */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppContent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
