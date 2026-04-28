import "@/App.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

// API Configuration
export const API = process.env.REACT_APP_API_URL || 'http://localhost:12345/api';

// Pages
import Layout from "@/components/Layout";
import Analytics from "@/pages/Analytics";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import Expenses from "@/pages/Expenses";
import InvoiceDetail from "@/pages/InvoiceDetail";
import InvoiceForm from "@/pages/InvoiceForm";
import Invoices from "@/pages/Invoices";
import PaymentStatus from "@/pages/PaymentStatus";
import Settings from "@/pages/Settings";
import TaxReports from "@/pages/TaxReports";

// Protected Route Component
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return user ? children : <Navigate to="/auth" />;
}

// App Content Component
function AppContent() {
  const { user } = useAuth();


  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout user={user}>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/invoices"
            element={
              <PrivateRoute>
                <Layout user={user}>
                  <Invoices />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/invoices/new"
            element={
              <PrivateRoute>
                <Layout user={user}>
                  <InvoiceForm />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/invoices/:id"
            element={
              <PrivateRoute>
                <Layout user={user}>
                  <InvoiceDetail />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/invoices/:id/edit"
            element={
              <PrivateRoute>
                <Layout user={user}>
                  <InvoiceForm />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/expenses"
            element={
              <PrivateRoute>
                <Layout user={user}>
                  <Expenses />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <PrivateRoute>
                <Layout user={user}>
                  <Analytics />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/payment-status"
            element={
              <PrivateRoute>
                <Layout user={user}>
                  <PaymentStatus />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/tax-reports"
            element={
              <PrivateRoute>
                <Layout user={user}>
                  <TaxReports />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Layout user={user}>
                  <Settings />
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

// Main App Component with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
