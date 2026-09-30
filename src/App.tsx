import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './components/RouteGuards';
import { DashboardLayout } from './layouts/DashboardLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import RecurringPage from './pages/RecurringPage';
import BudgetPage from './pages/BudgetPage';
import GoalsPage from './pages/GoalsPage';
import InvestmentsPage from './pages/InvestmentsPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import ReportsPage from './pages/ReportsPage';
import AiAssistantPage from './pages/AiAssistantPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/app" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="recurring" element={<RecurringPage />} />
        <Route path="budget" element={<BudgetPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="investments" element={<InvestmentsPage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="ai-assistant" element={<AiAssistantPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
