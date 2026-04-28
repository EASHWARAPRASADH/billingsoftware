# 🚀 STEP 1: Create .env.local File

## Create this file manually:

**File location:** `frontend/.env.local`

**Content:**
```env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

## How to get your credentials:

1. Go to https://supabase.com
2. Open your `billmanagement` project
3. Click **Settings** (⚙️ icon) → **API**
4. Copy:
   - **Project URL** → Replace `https://your-project-id.supabase.co`
   - **anon public** key → Replace `your-anon-key-here`

## Example:
```env
REACT_APP_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MDk5NTIwMCwiZXhwIjoxOTU2NTcxMjAwfQ.abcdefghijklmnopqrstuvwxyz1234567890
```

---

**After creating this file, the code updates will work!** ✅
