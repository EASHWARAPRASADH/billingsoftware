# Supabase Migration Guide for Bill Management System

## 📋 Overview

This guide will help you migrate your Bill Management System from MySQL to Supabase (PostgreSQL), including database, authentication, and file storage.

## 🎯 Why Supabase?

### Benefits:
✅ **Free Tier**: 500MB database, 1GB file storage, 50,000 monthly active users  
✅ **Built-in Authentication**: No need to manage JWT tokens manually  
✅ **Auto-generated API**: REST and GraphQL APIs automatically created  
✅ **Real-time**: Live updates for invoices and expenses  
✅ **File Storage**: Built-in storage for logos and signatures  
✅ **PostgreSQL**: More powerful than MySQL with better JSON support  
✅ **Easy Deployment**: No server management needed  
✅ **Row Level Security**: Built-in security policies  

### What Changes:
- MySQL → PostgreSQL (minor syntax differences)
- Custom JWT auth → Supabase Auth
- Local file storage → Supabase Storage
- Sequelize ORM → Supabase Client (optional, can keep Sequelize)

---

## 🚀 Step 1: Create Supabase Project

### 1.1 Sign Up
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email

### 1.2 Create New Project
1. Click "New Project"
2. Fill in details:
   - **Name**: `billmanagement`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free
3. Click "Create new project"
4. Wait 2-3 minutes for setup

### 1.3 Get Your Credentials
1. Go to Project Settings → API
2. Save these values:
   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   anon/public key: eyJhbGc...
   service_role key: eyJhbGc... (keep secret!)
   ```

---

## 🗄️ Step 2: Database Migration

### 2.1 Database Schema Differences

**MySQL → PostgreSQL Changes:**

| MySQL | PostgreSQL |
|-------|-----------|
| `AUTO_INCREMENT` | `SERIAL` or `GENERATED ALWAYS AS IDENTITY` |
| `DATETIME` | `TIMESTAMP` or `TIMESTAMPTZ` |
| `VARCHAR(255)` | `VARCHAR(255)` or `TEXT` |
| `TINYINT(1)` | `BOOLEAN` |
| Backticks \`table\` | Double quotes "table" (optional) |

### 2.2 Create Tables in Supabase

Go to **SQL Editor** in Supabase Dashboard and run:

```sql
-- Enable UUID extension (optional, for better IDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Supabase Auth handles this, but we need business info)
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  business_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business Profiles table
CREATE TABLE public.business_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name VARCHAR(255),
  company_email VARCHAR(255),
  company_phone VARCHAR(50),
  company_address TEXT,
  company_logo TEXT,
  gst_number VARCHAR(50),
  pan_number VARCHAR(50),
  bank_name VARCHAR(255),
  account_number VARCHAR(50),
  ifsc_code VARCHAR(20),
  signature_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Invoices table
CREATE TABLE public.invoices (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255),
  client_phone VARCHAR(50),
  client_address TEXT,
  invoice_date DATE NOT NULL,
  due_date DATE,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  terms TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses table
CREATE TABLE public.expenses (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  expense_date DATE NOT NULL,
  payment_method VARCHAR(50),
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_category ON public.expenses(category);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_profiles_updated_at
  BEFORE UPDATE ON public.business_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2.3 Enable Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policies for business_profiles
CREATE POLICY "Users can view own business profile"
  ON public.business_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own business profile"
  ON public.business_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own business profile"
  ON public.business_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for invoices
CREATE POLICY "Users can view own invoices"
  ON public.invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoices"
  ON public.invoices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoices"
  ON public.invoices FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for expenses
CREATE POLICY "Users can view own expenses"
  ON public.expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON public.expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON public.expenses FOR DELETE
  USING (auth.uid() = user_id);
```

### 2.4 Migrate Existing Data (Optional)

If you have existing data in MySQL:

```bash
# Export from MySQL
mysqldump -u root -p billmanagement > mysql_dump.sql

# Convert MySQL to PostgreSQL (use online converter or manual conversion)
# Then import to Supabase using SQL Editor
```

---

## 🔐 Step 3: Setup Authentication

### 3.1 Configure Supabase Auth

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email templates (optional)
4. Set **Site URL**: `http://localhost:3000` (for development)
5. Add **Redirect URLs**: 
   - `http://localhost:3000`
   - `https://your-app.vercel.app` (for production)

### 3.2 Enable Email Confirmations (Optional)

1. Go to **Authentication** → **Settings**
2. Toggle "Enable email confirmations"
3. Customize email templates

---

## 📦 Step 4: Setup File Storage

### 4.1 Create Storage Buckets

1. Go to **Storage** in Supabase Dashboard
2. Create buckets:
   - `company-logos` (for business logos)
   - `signatures` (for signature images)
   - `receipts` (for expense receipts)

### 4.2 Set Bucket Policies

For each bucket, set policies:

```sql
-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload own files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'company-logos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to view their own files
CREATE POLICY "Users can view own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'company-logos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to update their own files
CREATE POLICY "Users can update own files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'company-logos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'company-logos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

Repeat for `signatures` and `receipts` buckets.

---

## 💻 Step 5: Update Backend Code

### 5.1 Install Supabase Client

```bash
cd backend
npm install @supabase/supabase-js
```

### 5.2 Create Supabase Config

Create `backend/config/supabase.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Use service key for backend

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = supabase;
```

### 5.3 Update Environment Variables

Update `backend/.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc... # Keep this secret!

# Remove old MySQL config (or keep for migration period)
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=
# DB_NAME=billmanagement
```

### 5.4 Update Authentication Middleware

Create `backend/middleware/supabaseAuth.js`:

```javascript
const supabase = require('../config/supabase');

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = authenticateUser;
```

---

## 🎨 Step 6: Update Frontend Code

### 6.1 Install Supabase Client

```bash
cd frontend
npm install @supabase/supabase-js
```

### 6.2 Create Supabase Config

Create `frontend/src/config/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 6.3 Update Environment Variables

Create/Update `frontend/.env`:

```env
REACT_APP_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGc...
```

### 6.4 Create Auth Context

Create `frontend/src/contexts/AuthContext.js`:

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password, businessName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          business_name: businessName
        }
      }
    });

    if (!error && data.user) {
      // Create user profile
      await supabase.from('user_profiles').insert({
        id: data.user.id,
        business_name: businessName
      });
    }

    return { data, error };
  };

  const signIn = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    return await supabase.auth.signOut();
  };

  const value = {
    user,
    signUp,
    signIn,
    signOut,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
```

### 6.5 Update App.js

```javascript
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      {/* Your existing app code */}
    </AuthProvider>
  );
}
```

---

## 🔄 Step 7: Update API Calls

### Example: Invoice Operations

Create `frontend/src/services/invoiceService.js`:

```javascript
import { supabase } from '../config/supabase';

export const invoiceService = {
  // Get all invoices for current user
  async getAll() {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get single invoice
  async getById(id) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create invoice
  async create(invoiceData) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        ...invoiceData,
        user_id: user.id
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update invoice
  async update(id, invoiceData) {
    const { data, error } = await supabase
      .from('invoices')
      .update(invoiceData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete invoice
  async delete(id) {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
```

---

## 📤 Step 8: File Upload Implementation

### Example: Upload Company Logo

```javascript
import { supabase } from '../config/supabase';

export const uploadCompanyLogo = async (file) => {
  const { data: { user } } = await supabase.auth.getUser();
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/logo.${fileExt}`;

  // Upload file
  const { data, error } = await supabase.storage
    .from('company-logos')
    .upload(fileName, file, {
      upsert: true // Replace if exists
    });

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('company-logos')
    .getPublicUrl(fileName);

  return publicUrl;
};
```

---

## 🚀 Step 9: Deployment

### 9.1 Vercel (Frontend)

1. Push code to GitHub
2. Go to Vercel → Import Project
3. Add environment variables:
   ```
   REACT_APP_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=eyJhbGc...
   ```
4. Deploy

### 9.2 Backend Options

**Option A: Keep Backend (Recommended for complex logic)**
- Deploy to Render/Railway with Supabase client
- Use for complex business logic, email sending, etc.

**Option B: Go Serverless (Use Supabase only)**
- Remove backend entirely
- Use Supabase Edge Functions for server-side logic
- Simpler deployment, lower cost

### 9.3 Update Supabase Settings

1. Go to **Authentication** → **URL Configuration**
2. Update **Site URL**: `https://your-app.vercel.app`
3. Add **Redirect URLs**: `https://your-app.vercel.app/**`

---

## ✅ Testing Checklist

- [ ] User registration works
- [ ] User login works
- [ ] User logout works
- [ ] Create invoice works
- [ ] Update invoice works
- [ ] Delete invoice works
- [ ] Create expense works
- [ ] File upload works (logo, signature)
- [ ] Dashboard shows correct data
- [ ] RLS policies prevent unauthorized access

---

## 🎯 Migration Strategy

### Option 1: Big Bang (Replace Everything)
- Migrate all at once
- Higher risk, faster completion
- Best for small apps or new projects

### Option 2: Gradual Migration
1. Week 1: Setup Supabase, create schema
2. Week 2: Migrate authentication
3. Week 3: Migrate invoices
4. Week 4: Migrate expenses
5. Week 5: Migrate file storage
6. Week 6: Remove old backend

### Option 3: Hybrid Approach
- Keep MySQL backend running
- Add Supabase for new features
- Gradually migrate old features
- Lowest risk, longest timeline

---

## 💰 Cost Comparison

### Free Tier Limits:
- **Database**: 500MB (plenty for invoices/expenses)
- **Storage**: 1GB (good for logos/signatures)
- **Bandwidth**: 2GB/month
- **API Requests**: Unlimited
- **Auth Users**: 50,000 MAU

### Paid Plans (if needed):
- **Pro**: $25/month (8GB database, 100GB storage)
- **Team**: $599/month (unlimited)

---

## 🆘 Troubleshooting

### Issue: "Row Level Security policy violation"
**Solution**: Check RLS policies, ensure user is authenticated

### Issue: "relation does not exist"
**Solution**: Run table creation SQL in Supabase SQL Editor

### Issue: "Invalid API key"
**Solution**: Check environment variables, use correct key (anon for frontend, service for backend)

### Issue: File upload fails
**Solution**: Check storage bucket policies, ensure bucket exists

---

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## 🎉 Next Steps

After migration:
1. Test thoroughly in development
2. Deploy to production
3. Monitor performance
4. Set up backups (Supabase has daily backups)
5. Consider adding real-time features
6. Explore Supabase Edge Functions for advanced logic

---

Need help with the migration? Let me know which approach you'd like to take!
