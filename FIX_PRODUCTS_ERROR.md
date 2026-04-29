# 🔧 Fix Products & Business Profile Errors

## 🐛 Issues Identified

Based on the console errors, there are **2 main issues**:

1. **404 Error on `/products` endpoint** - The `products` table doesn't exist in Supabase
2. **406 Error on `/business_profiles` endpoint** - RLS policy or column name mismatch

---

## ✅ Solution 1: Add Products Table to Supabase

### Step 1: Run the SQL Script

1. **Open Supabase Dashboard**
   - Go to https://supabase.com
   - Select your project: `billmanagement`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Run the Script**
   - Open the file: `SUPABASE_PRODUCTS_TABLE.sql`
   - Copy the entire content
   - Paste it into the SQL Editor
   - Click "Run" or press `Ctrl+Enter`

4. **Verify Success**
   - You should see: `Products table setup complete! ✅`
   - Go to "Table Editor" and verify the `products` table exists

---

## ✅ Solution 2: Fix Business Profiles Table

The 406 error suggests a column name mismatch. Let me check what's expected vs what exists.

### Step 1: Check Current Schema

Run this query in Supabase SQL Editor:

```sql
-- Check business_profiles columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'business_profiles' 
ORDER BY ordinal_position;
```

### Step 2: Fix Column Names (if needed)

The frontend is querying with `user_id` but the error suggests it might not match. Run this to ensure consistency:

```sql
-- Verify the business_profiles table structure
SELECT * FROM public.business_profiles LIMIT 1;

-- If you see any issues, you can recreate the table with correct structure
-- (Only run if there's a problem - this will delete existing data!)
-- DROP TABLE IF EXISTS public.business_profiles CASCADE;
```

### Step 3: Update RLS Policies for Business Profiles

Run this in Supabase SQL Editor to ensure proper RLS policies:

```sql
-- Drop and recreate RLS policies for business_profiles
DROP POLICY IF EXISTS "Users can view own business profile" ON public.business_profiles;
CREATE POLICY "Users can view own business profile"
  ON public.business_profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own business profile" ON public.business_profiles;
CREATE POLICY "Users can update own business profile"
  ON public.business_profiles FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own business profile" ON public.business_profiles;
CREATE POLICY "Users can insert own business profile"
  ON public.business_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own business profile" ON public.business_profiles;
CREATE POLICY "Users can delete own business profile"
  ON public.business_profiles FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 🧪 Test the Fixes

### Test 1: Check Tables Exist

Run in Supabase SQL Editor:

```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- ✅ business_profiles
- ✅ expenses
- ✅ invoices
- ✅ products
- ✅ user_profiles

### Test 2: Test Product Creation

1. **Refresh your application** (press `F5` in browser)
2. **Try adding a new product**:
   - Go to Invoice Form
   - Click "Add Product"
   - Fill in: Name, HSN Code, GST Rate
   - Click "Add"
3. **Check for errors** in the console (F12)

### Test 3: Test Business Profile

1. **Go to Settings page**
2. **Fill in business details**
3. **Save**
4. **Check for 406 errors** in console

---

## 🔍 Additional Debugging

If you still see errors after running the SQL scripts:

### Check RLS is Enabled

```sql
-- Check if RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

All tables should show `rowsecurity = true`

### Check User Authentication

Open browser console and run:

```javascript
// Check if user is authenticated
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);
```

You should see your user object with an `id` field.

### Check API Key Configuration

Verify your `.env` files:

**Frontend `.env`:**
```env
REACT_APP_SUPABASE_URL=https://bdwpqipvaavxbwtdbjnf.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

**Backend `.env`:**
```env
SUPABASE_URL=https://bdwpqipvaavxbwtdbjnf.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here
```

---

## 📝 Quick Fix Checklist

- [ ] Run `SUPABASE_PRODUCTS_TABLE.sql` in Supabase SQL Editor
- [ ] Verify `products` table exists in Table Editor
- [ ] Run RLS policy updates for `business_profiles`
- [ ] Refresh browser (F5)
- [ ] Test adding a new product
- [ ] Test updating business profile
- [ ] Check console for errors

---

## 🆘 Still Having Issues?

If you still see errors:

1. **Check Supabase Dashboard** → Project Settings → API
   - Verify your API keys are correct
   - Check if RLS is enabled

2. **Check Network Tab** (F12 → Network)
   - Look for the failed request
   - Check the response body for detailed error message

3. **Check Supabase Logs**
   - Go to Supabase Dashboard → Logs
   - Look for recent errors

4. **Restart the application**:
   ```bash
   # Stop both frontend and backend
   # Then restart
   cd backend
   npm start
   
   # In another terminal
   cd frontend
   npm start
   ```

---

## 💡 Prevention

To avoid similar issues in the future:

1. **Always run the complete setup script** when setting up Supabase
2. **Check Table Editor** to verify all tables exist
3. **Test RLS policies** before deploying
4. **Use Supabase Studio** to visually inspect your database

---

**After running the SQL scripts, your products feature should work! 🎉**
