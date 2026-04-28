# 🎯 Quick Steps to Connect Your Frontend to Supabase

## ✅ Migration Complete!
- Users: 2/2 ✅
- Business Profiles: 2/2 ✅
- Invoices: 14/14 ✅
- Expenses: 1/1 ✅

---

## 🚀 Next Steps (5 Simple Steps)

### **Step 1: Create .env.local File (2 minutes)**

Create a file `frontend/.env.local` with:

```env
REACT_APP_SUPABASE_URL=your-supabase-url-here
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

**Get your credentials:**
1. Go to https://supabase.com
2. Open your `billmanagement` project
3. Click **Settings** (⚙️) → **API**
4. Copy:
   - **Project URL** → paste as `REACT_APP_SUPABASE_URL`
   - **anon public** key → paste as `REACT_APP_SUPABASE_ANON_KEY`

---

### **Step 2: Install Supabase Client (1 minute)**

```bash
cd frontend
npm install @supabase/supabase-js
```

---

### **Step 3: Update App.js (3 minutes)**

Replace your `frontend/src/App.js` with this:

```javascript
import "@/App.css";
import { Toaster } from "@/components/ui/sonner";
import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

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

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  return user ? children : <Navigate to="/auth" />;
}

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

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
```

---

### **Step 4: Update AuthPage.js (5 minutes)**

Update `frontend/src/pages/AuthPage.js` to use Supabase:

```javascript
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const { error } = await signIn(email, password);
        
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Login successful!");
          navigate("/");
        }
      } else {
        // Register
        const { error } = await signUp(email, password, businessName);
        
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Registration successful! Please check your email.");
          setIsLogin(true);
        }
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center">
            {isLogin ? "Login" : "Register"}
          </h2>
        </div>

        {isLogin && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
            <strong>Migrated users:</strong> Use password <code className="bg-yellow-100 px-1">TempPassword123!</code>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Business Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              minLength="6"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Please wait..." : isLogin ? "Login" : "Register"}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:underline"
          >
            {isLogin
              ? "Don't have an account? Register"
              : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### **Step 5: Start Your App and Test (2 minutes)**

```bash
cd frontend
npm start
```

**Test Login:**
1. Go to http://localhost:3000/auth
2. Use credentials:
   - **Email:** `admin@example.com`
   - **Password:** `TempPassword123!`
3. Click **Login**
4. You should be redirected to the dashboard! ✅

---

## 📝 Summary of Changes

### What Changed:
1. ✅ Wrapped App in `AuthProvider`
2. ✅ Updated `PrivateRoute` to use `useAuth()` hook
3. ✅ Updated `AuthPage` to use Supabase auth
4. ✅ Removed old axios interceptors (Supabase handles auth)

### What Stays the Same:
- ✅ All your existing pages (Dashboard, Invoices, etc.)
- ✅ All your routing
- ✅ All your UI components
- ✅ All your styling

### Next Updates Needed:
After login works, you'll need to update:
- `Invoices.js` - Use `invoiceService` instead of axios
- `Expenses.js` - Use `expenseService` instead of axios
- `Dashboard.js` - Use Supabase queries
- `Settings.js` - Use Supabase for profile updates

---

## 🔑 Test Credentials

**Admin User:**
- Email: `admin@example.com`
- Password: `TempPassword123!`

**Trainer User:**
- Email: `trainer@example.com`
- Password: `TempPassword123!`

---

## 🆘 Troubleshooting

### Error: "Invalid login credentials"
**Fix:** Make sure you're using the correct email and password `TempPassword123!`

### Error: "Supabase client not configured"
**Fix:** Check `.env.local` file has correct credentials

### Error: "Module not found: @/contexts/AuthContext"
**Fix:** The file is already created at `frontend/src/contexts/AuthContext.js`

---

## 📞 Need Help?

Just ask:
- "How do I get Supabase credentials?"
- "Login is not working"
- "How do I update the Invoices page?"
- "Can you help me update Dashboard?"

---

**Ready to test? Follow the 5 steps above!** 🚀
