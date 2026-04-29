# 🚀 Frontend Setup for Supabase

## Step 1: Create .env.local File

Create `frontend/.env.local` with your Supabase credentials:

```env
REACT_APP_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key...
```

**Get your credentials from:**
1. Go to [Supabase Dashboard](https://supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `REACT_APP_SUPABASE_URL`
   - **anon public** key → `REACT_APP_SUPABASE_ANON_KEY`

---

## Step 2: Install Supabase Client

```bash
cd frontend
npm install @supabase/supabase-js
```

---

## Step 3: Update App.js to Use AuthProvider

The `AuthContext.js` file is already created at `frontend/src/contexts/AuthContext.js`.

Update your `frontend/src/App.js`:

```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Import your existing pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import Expenses from './pages/Expenses';
// ... other imports

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/invoices"
            element={
              <ProtectedRoute>
                <Invoices />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/expenses"
            element={
              <ProtectedRoute>
                <Expenses />
              </ProtectedRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
```

---

## Step 4: Update Login Page

Update `frontend/src/pages/Login.js`:

```javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        setError(error.message);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <p>
        Don't have an account? <a href="/register">Register</a>
      </p>
      
      <div className="temp-password-notice">
        ⚠️ If you were migrated from MySQL, use password: <code>TempPassword123!</code>
        <br />
        You'll be prompted to reset it after login.
      </div>
    </div>
  );
}

export default Login;
```

---

## Step 5: Update Register Page

Update `frontend/src/pages/Register.js`:

```javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await signUp(email, password, businessName);
      
      if (error) {
        setError(error.message);
      } else {
        alert('Registration successful! Please check your email to confirm your account.');
        navigate('/login');
      }
    } catch (err) {
      setError('Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <h2>Register</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div>
          <label>Business Name:</label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
          />
        </div>
        
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength="6"
            required
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      
      <p>
        Already have an account? <a href="/login">Login</a>
      </p>
    </div>
  );
}

export default Register;
```

---

## Step 6: Update Invoice Page to Use Supabase

Update `frontend/src/pages/Invoices.js`:

```javascript
import React, { useState, useEffect } from 'react';
import { invoiceService } from '../services/invoiceService';
import { useAuth } from '../contexts/AuthContext';

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user } = useAuth();

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    setLoading(true);
    const { data, error } = await invoiceService.getAll();
    
    if (error) {
      setError('Failed to load invoices');
      console.error(error);
    } else {
      setInvoices(data || []);
    }
    
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      const { error } = await invoiceService.delete(id);
      
      if (error) {
        alert('Failed to delete invoice');
      } else {
        loadInvoices(); // Reload list
      }
    }
  };

  if (loading) return <div>Loading invoices...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="invoices-page">
      <h1>Invoices</h1>
      
      <button onClick={() => window.location.href = '/invoices/new'}>
        Create New Invoice
      </button>
      
      <table>
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Client</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map(invoice => (
            <tr key={invoice.id}>
              <td>{invoice.invoice_number}</td>
              <td>{invoice.client_name}</td>
              <td>{new Date(invoice.invoice_date).toLocaleDateString()}</td>
              <td>${invoice.total_amount}</td>
              <td>{invoice.status}</td>
              <td>
                <button onClick={() => window.location.href = `/invoices/${invoice.id}`}>
                  View
                </button>
                <button onClick={() => handleDelete(invoice.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {invoices.length === 0 && (
        <p>No invoices found. Create your first invoice!</p>
      )}
    </div>
  );
}

export default Invoices;
```

---

## Step 7: Test the Application

```bash
cd frontend
npm start
```

### Test Login:
1. Go to http://localhost:3000/login
2. Use credentials:
   - **Email:** `admin@example.com`
   - **Password:** `TempPassword123!`
3. You should be logged in and redirected to dashboard

---

## Step 8: Add Logout Functionality

Update your header/navbar component:

```javascript
import { useAuth } from '../contexts/AuthContext';

function Header() {
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <header>
      <div>Welcome, {user?.email}</div>
      <button onClick={handleLogout}>Logout</button>
    </header>
  );
}
```

---

## Quick Commands

```bash
# 1. Create .env.local file manually with your Supabase credentials

# 2. Install Supabase
cd frontend
npm install @supabase/supabase-js

# 3. Start app
npm start

# 4. Test login with:
# Email: admin@example.com
# Password: TempPassword123!
```

---

## Files Already Created for You

✅ `frontend/src/config/supabase.js` - Supabase client  
✅ `frontend/src/contexts/AuthContext.js` - Auth context  
✅ `frontend/src/services/invoiceService.js` - Invoice operations  
✅ `frontend/src/services/expenseService.js` - Expense operations  
✅ `frontend/src/services/storageService.js` - File uploads  

---

**Ready to test? Follow the steps above!** 🚀
