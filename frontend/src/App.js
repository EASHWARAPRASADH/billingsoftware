import "@/App.css";
import { Toaster } from "@/components/ui/sonner";
import axios from "axios";
import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

// Pages
import Layout from "@/components/Layout";
import Analytics from "@/pages/Analytics";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import Expenses from "@/pages/Expenses";
import InvoiceDetail from "@/pages/InvoiceDetail";
import InvoiceForm from "@/pages/InvoiceForm";
import Invoices from "@/pages/Invoices";
import Settings from "@/pages/Settings";
import TaxReports from "@/pages/TaxReports";

// Setup mock API for local development (no MongoDB required)
// setupMockApi(); // DISABLED: Using real backend with MySQL database

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

// Axios interceptor for auth
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/auth";
    }
    return Promise.reject(error);
  }
);

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/auth" />;
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage setUser={setUser} />} />
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

export default App;

export { API };
