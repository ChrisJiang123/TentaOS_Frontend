import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { LanguageProvider } from '@/lib/LanguageContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

// Page imports
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import TaskDetail from './pages/TaskDetail';
import PipelineStudio from './pages/PipelineStudio';
import Approvals from './pages/Approvals';
import Agents from './pages/Agents';
import Models from './pages/Models';
import Billing from './pages/Billing';
import Pricing from './pages/Pricing';
import Diagnostics from './pages/Diagnostics';
import AppLayout from './components/layout/AppLayout';
import DocsLayout from './components/docs/DocsLayout';
import QuickStart from './pages/docs/QuickStart';
import DocsPlaceholder from './pages/docs/DocsPlaceholder';
import Downloads from './pages/Downloads';
import Installation from './pages/docs/Installation';
import TasksDocs from './pages/docs/TasksDocs';
import AgentsDocs from './pages/docs/AgentsDocs';
import WorkflowsDocs from './pages/docs/WorkflowsDocs';
import ApprovalsDocs from './pages/docs/ApprovalsDocs';
import CliDocs from './pages/docs/CliDocs';
import AuthDocs from './pages/docs/AuthDocs';
import Triggers from './pages/Triggers';
import Settings from './pages/Settings';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Refund from './pages/Refund';
import Contact from './pages/Contact';
import Support from './pages/Support';
import PublicPricing from './pages/PublicPricing';
import BillingSuccess from './pages/BillingSuccess';
import BillingCancel from './pages/BillingCancel';

/** One top-level <Routes> so layout + app pages match on hard refresh (nested <Routes> under splat breaks /Agents, etc.). */
function AppRoutes() {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#06060B]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-xs text-white/30">Loading TentaOS...</span>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/Landing" replace />} />
      <Route path="/Landing" element={<Landing />} />
      <Route path="/pricing" caseSensitive element={<PublicPricing />} />
      <Route path="/billing/success" element={<BillingSuccess />} />
      <Route path="/billing/cancel" element={<BillingCancel />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/refund" element={<Refund />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/support" element={<Support />} />
      <Route path="/Downloads" element={<Downloads />} />
      <Route path="/Docs" element={<DocsLayout />}>
        <Route index element={<QuickStart />} />
        <Route path="Installation" element={<Installation />} />
        <Route path="Authentication" element={<AuthDocs />} />
        <Route path="Tasks" element={<TasksDocs />} />
        <Route path="Agents" element={<AgentsDocs />} />
        <Route path="Workflows" element={<WorkflowsDocs />} />
        <Route path="Approvals" element={<ApprovalsDocs />} />
        <Route path="ApiOverview" element={<DocsPlaceholder />} />
        <Route path="ApiTasks" element={<DocsPlaceholder />} />
        <Route path="ApiAgents" element={<DocsPlaceholder />} />
        <Route path="ApiModels" element={<DocsPlaceholder />} />
        <Route path="PythonSdk" element={<DocsPlaceholder />} />
        <Route path="NodeSdk" element={<DocsPlaceholder />} />
        <Route path="CliReference" element={<CliDocs />} />
        <Route path="Changelog" element={<DocsPlaceholder />} />
        <Route path="Faq" element={<DocsPlaceholder />} />
      </Route>

      <Route element={<AppLayout />}>
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/diagnostics" element={<Diagnostics />} />
        <Route path="/TaskDetail" element={<TaskDetail />} />
        <Route path="/PipelineStudio" element={<PipelineStudio />} />
        <Route path="/Approvals" element={<Approvals />} />
        <Route path="/Agents" element={<Agents />} />
        <Route path="/Models" element={<Models />} />
        <Route path="/Billing" element={<Billing />} />
        <Route path="/Pricing" element={<Pricing />} />
        <Route path="/Triggers" element={<Triggers />} />
        <Route path="/Settings" element={<Settings />} />
        <Route path="/dashboard" element={<Navigate to="/Dashboard" replace />} />
        <Route path="/agents" element={<Navigate to="/Agents" replace />} />
        <Route path="/approvals" element={<Navigate to="/Approvals" replace />} />
        <Route path="/models" element={<Navigate to="/Models" replace />} />
        <Route path="/billing" element={<Navigate to="/Billing" replace />} />
        <Route path="/triggers" element={<Navigate to="/Triggers" replace />} />
        <Route path="/settings" element={<Navigate to="/Settings" replace />} />
        <Route path="/pipeline" element={<Navigate to="/PipelineStudio" replace />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AppRoutes />
          </Router>
          <Analytics />
          <Toaster />
        </QueryClientProvider>
      </LanguageProvider>
    </AuthProvider>
  )
}

export default App
