import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProtectedRoute, PublicRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/Sidebar';

import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import DashboardPage from '@/pages/DashboardPage';
import TradesPage from '@/pages/TradesPage';
import AddTradePage from '@/pages/AddTradePage';
import TradeDetailPage from '@/pages/TradeDetailPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import CalendarPage from '@/pages/CalendarPage';
import JournalPage from '@/pages/JournalPage';
import MistakesPage from '@/pages/MistakesPage';
import GoalsPage from '@/pages/GoalsPage';
import ProfilePage from '@/pages/ProfilePage';
import SettingsPage from '@/pages/SettingsPage';

import { ThemeProvider } from '@/contexts/ThemeContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30000 },
  },
});

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <BrowserRouter>
            <Routes>
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/trades" element={<TradesPage />} />
                  <Route path="/trades/add" element={<AddTradePage />} />
                  <Route path="/trades/:id" element={<TradeDetailPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/journal" element={<JournalPage />} />
                  <Route path="/mistakes" element={<MistakesPage />} />
                  <Route path="/goals" element={<GoalsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
              </Route>

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster theme="dark" position="top-right" richColors />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
