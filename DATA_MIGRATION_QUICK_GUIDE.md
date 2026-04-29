# Quick Data Migration Guide

## 🚀 Fastest Way to Migrate Your Data

### Prerequisites:
- ✅ Supabase account created
- ✅ SUPABASE_SETUP_SCRIPT.sql already run
- ✅ Both MySQL and Supabase credentials in .env

---

## Step-by-Step Instructions

### Step 1: Install Dependencies (2 minutes)

```bash
cd backend
npm install mysql2 @supabase/supabase-js dotenv
```

### Step 2: Verify .env File (1 minute)

Make sure `backend/.env` has:

```env
# MySQL (source)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=billmanagement

# Supabase (destination)
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc... (your service role key)
```

### Step 3: Run Migration Script (5-10 minutes)

```bash
cd backend
node migrate-to-supabase.js
```

**What happens:**
- Script connects to both databases
- Migrates users (creates new accounts in Supabase)
- Migrates business profiles
- Migrates all invoices
- Migrates all expenses
- Shows progress and statistics

### Step 4: Verify Migration (2 minutes)

**In Supabase Dashboard:**
1. Go to **Table Editor**
2. Check each table:
   - `user_profiles` - should have your users
   - `business_profiles` - should have company info
   - `invoices` - should have all invoices
   - `expenses` - should have all expenses

**Or use SQL:**
```sql
-- In Supabase SQL Editor
SELECT COUNT(*) FROM auth.users;
SELECT COUNT(*) FROM invoices;
SELECT COUNT(*) FROM expenses;
SELECT COUNT(*) FROM business_profiles;
```

### Step 5: Important Notes

⚠️ **All users will have temporary password:** `TempPassword123!`

Users must reset passwords on first login.

---

## 🎯 What the Script Does

### 1. Migrates Users
- Creates accounts in Supabase Auth
- Sets temporary password
- Creates user profiles
- Maps MySQL IDs to Supabase UUIDs

### 2. Migrates Business Profiles
- Transfers company information
- Links to new user IDs
- Preserves all data

### 3. Migrates Invoices
- Transfers all invoice data
- Converts items to JSONB
- Links to new user IDs
- Preserves dates and amounts

### 4. Migrates Expenses
- Transfers all expense data
- Links to new user IDs
- Preserves categories and amounts

---

## 📊 Expected Output

```
🚀 Starting MySQL to Supabase Migration...

⚠️  WARNING: This will create new users in Supabase Auth
⚠️  Users will need to reset their passwords

Press Ctrl+C to cancel, or wait 5 seconds to continue...

🔍 Testing MySQL connection...
✅ MySQL connection successful
🔍 Testing Supabase connection...
✅ Supabase connection successful

📊 Migrating Users...
Found 5 users in MySQL
✅ Migrated user: user1@example.com
✅ Migrated user: user2@example.com
...

✅ Users migration complete!
   Migrated: 5/5
   Failed: 0

📊 Migrating Business Profiles...
Found 5 business profiles in MySQL
✅ Migrated business profile ID: 1
...

📊 Migrating Invoices...
Found 25 invoices in MySQL
✅ Migrated invoice: INV-001
...

📊 Migrating Expenses...
Found 15 expenses in MySQL
✅ Migrated expense ID: 1
...

============================================================
🎉 MIGRATION COMPLETE!
============================================================

📊 Migration Summary:

Users:             5/5 migrated (0 failed)
Business Profiles: 5/5 migrated (0 failed)
Invoices:          25/25 migrated (0 failed)
Expenses:          15/15 migrated (0 failed)

Total:             50/50 records migrated (0 failed)

============================================================

⚠️  IMPORTANT NOTES:

1. All users have temporary password: TempPassword123!
2. Users MUST reset their passwords on first login
3. Keep MySQL database as backup for at least 1 month
4. Test all features before switching to Supabase
5. Update frontend to use Supabase authentication

============================================================
```

---

## 🆘 Troubleshooting

### Error: "Cannot connect to MySQL"
**Fix:**
```bash
# Check MySQL is running
mysql -u root -p

# Verify credentials in .env
```

### Error: "Invalid Supabase credentials"
**Fix:**
```bash
# Check .env has correct values
# Get from: Supabase Dashboard → Settings → API
```

### Error: "User already exists"
**Fix:**
```bash
# Delete users from Supabase first
# Or skip existing users in script
```

### Error: "Foreign key violation"
**Fix:**
```bash
# Make sure SUPABASE_SETUP_SCRIPT.sql was run
# Tables must exist before migration
```

---

## ✅ After Migration

### 1. Test in Supabase Dashboard
- Go to Table Editor
- Browse each table
- Verify data looks correct

### 2. Test with Frontend
- Update frontend to use Supabase
- Test login (use temp password)
- Test viewing invoices
- Test creating new data

### 3. Keep MySQL Backup
- Don't delete MySQL database yet
- Keep for at least 1 month
- Use as rollback option

### 4. Notify Users
- Send email about password reset
- Provide new login instructions
- Offer support for issues

---

## 🔄 If You Need to Re-run Migration

### Clear Supabase Data First:

```sql
-- In Supabase SQL Editor
DELETE FROM expenses;
DELETE FROM invoices;
DELETE FROM business_profiles;
DELETE FROM user_profiles;

-- Then delete auth users from:
-- Authentication → Users → Delete each user
```

### Then re-run:
```bash
node migrate-to-supabase.js
```

---

## 📞 Need Help?

**Common issues:**
- Script stops midway → Check error message, fix, re-run
- Some records failed → Check logs for specific errors
- Data looks wrong → Verify MySQL data first

**Ask me:**
- "Migration failed with error X"
- "How do I verify the data?"
- "Can I migrate just invoices?"

---

**Ready? Just run:** `node migrate-to-supabase.js` 🚀
