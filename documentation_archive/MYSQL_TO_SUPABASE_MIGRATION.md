# MySQL to Supabase Data Migration Guide

## 📋 Overview

This guide will help you migrate your existing MySQL data from the `billmanagement` database to Supabase PostgreSQL.

---

## 🎯 Migration Strategy

### Option 1: Automated Script (Recommended)
- Use a Node.js script to migrate data
- Handles data type conversions automatically
- Safer and more reliable

### Option 2: Manual Export/Import
- Export from MySQL
- Convert SQL syntax
- Import to Supabase
- More control but requires manual work

### Option 3: CSV Export/Import
- Export tables to CSV
- Import CSV to Supabase
- Good for simple data

---

## 🚀 Option 1: Automated Migration Script (RECOMMENDED)

### Step 1: Install Dependencies

```bash
cd backend
npm install mysql2 @supabase/supabase-js dotenv
```

### Step 2: Create Migration Script

Create `backend/migrate-to-supabase.js`:

```javascript
const mysql = require('mysql2/promise');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// MySQL Configuration
const mysqlConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'billmanagement'
};

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// User ID mapping (MySQL ID -> Supabase UUID)
const userIdMap = new Map();

async function migrateUsers() {
  console.log('\n📊 Migrating Users...');
  
  const connection = await mysql.createConnection(mysqlConfig);
  
  try {
    // Get all users from MySQL
    const [users] = await connection.execute('SELECT * FROM Users');
    console.log(`Found ${users.length} users in MySQL`);

    for (const user of users) {
      try {
        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: 'TempPassword123!', // User will need to reset
          email_confirm: true,
          user_metadata: {
            business_name: user.businessName
          }
        });

        if (authError) {
          console.error(`❌ Error creating user ${user.email}:`, authError.message);
          continue;
        }

        // Map MySQL ID to Supabase UUID
        userIdMap.set(user.id, authData.user.id);

        // Create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            business_name: user.businessName
          });

        if (profileError) {
          console.error(`❌ Error creating profile for ${user.email}:`, profileError.message);
        } else {
          console.log(`✅ Migrated user: ${user.email}`);
        }

      } catch (error) {
        console.error(`❌ Error migrating user ${user.email}:`, error.message);
      }
    }

    console.log(`\n✅ Users migration complete! Migrated ${userIdMap.size}/${users.length} users`);

  } finally {
    await connection.end();
  }
}

async function migrateBusinessProfiles() {
  console.log('\n📊 Migrating Business Profiles...');
  
  const connection = await mysql.createConnection(mysqlConfig);
  
  try {
    const [profiles] = await connection.execute('SELECT * FROM BusinessProfiles');
    console.log(`Found ${profiles.length} business profiles in MySQL`);

    let migrated = 0;

    for (const profile of profiles) {
      try {
        const supabaseUserId = userIdMap.get(profile.userId);
        
        if (!supabaseUserId) {
          console.log(`⚠️  Skipping profile for user ID ${profile.userId} (user not migrated)`);
          continue;
        }

        const { error } = await supabase
          .from('business_profiles')
          .insert({
            user_id: supabaseUserId,
            company_name: profile.companyName,
            company_email: profile.companyEmail,
            company_phone: profile.companyPhone,
            company_address: profile.companyAddress,
            company_logo: profile.companyLogo,
            gst_number: profile.gstNumber,
            pan_number: profile.panNumber,
            bank_name: profile.bankName,
            account_number: profile.accountNumber,
            ifsc_code: profile.ifscCode,
            signature_image: profile.signatureImage,
            created_at: profile.createdAt,
            updated_at: profile.updatedAt
          });

        if (error) {
          console.error(`❌ Error migrating profile ID ${profile.id}:`, error.message);
        } else {
          migrated++;
          console.log(`✅ Migrated business profile ID: ${profile.id}`);
        }

      } catch (error) {
        console.error(`❌ Error migrating profile ID ${profile.id}:`, error.message);
      }
    }

    console.log(`\n✅ Business profiles migration complete! Migrated ${migrated}/${profiles.length} profiles`);

  } finally {
    await connection.end();
  }
}

async function migrateInvoices() {
  console.log('\n📊 Migrating Invoices...');
  
  const connection = await mysql.createConnection(mysqlConfig);
  
  try {
    const [invoices] = await connection.execute('SELECT * FROM Invoices');
    console.log(`Found ${invoices.length} invoices in MySQL`);

    let migrated = 0;

    for (const invoice of invoices) {
      try {
        const supabaseUserId = userIdMap.get(invoice.userId);
        
        if (!supabaseUserId) {
          console.log(`⚠️  Skipping invoice ${invoice.invoiceNumber} (user not migrated)`);
          continue;
        }

        // Parse items JSON if it's a string
        let items = invoice.items;
        if (typeof items === 'string') {
          items = JSON.parse(items);
        }

        const { error } = await supabase
          .from('invoices')
          .insert({
            user_id: supabaseUserId,
            invoice_number: invoice.invoiceNumber,
            client_name: invoice.clientName,
            client_email: invoice.clientEmail,
            client_phone: invoice.clientPhone,
            client_address: invoice.clientAddress,
            invoice_date: invoice.invoiceDate,
            due_date: invoice.dueDate,
            items: items,
            subtotal: invoice.subtotal,
            tax_amount: invoice.taxAmount,
            discount_amount: invoice.discountAmount,
            shipping_cost: invoice.shippingCost,
            total_amount: invoice.totalAmount,
            notes: invoice.notes,
            terms: invoice.terms,
            status: invoice.status || 'pending',
            created_at: invoice.createdAt,
            updated_at: invoice.updatedAt
          });

        if (error) {
          console.error(`❌ Error migrating invoice ${invoice.invoiceNumber}:`, error.message);
        } else {
          migrated++;
          console.log(`✅ Migrated invoice: ${invoice.invoiceNumber}`);
        }

      } catch (error) {
        console.error(`❌ Error migrating invoice ${invoice.invoiceNumber}:`, error.message);
      }
    }

    console.log(`\n✅ Invoices migration complete! Migrated ${migrated}/${invoices.length} invoices`);

  } finally {
    await connection.end();
  }
}

async function migrateExpenses() {
  console.log('\n📊 Migrating Expenses...');
  
  const connection = await mysql.createConnection(mysqlConfig);
  
  try {
    const [expenses] = await connection.execute('SELECT * FROM Expenses');
    console.log(`Found ${expenses.length} expenses in MySQL`);

    let migrated = 0;

    for (const expense of expenses) {
      try {
        const supabaseUserId = userIdMap.get(expense.userId);
        
        if (!supabaseUserId) {
          console.log(`⚠️  Skipping expense ID ${expense.id} (user not migrated)`);
          continue;
        }

        const { error } = await supabase
          .from('expenses')
          .insert({
            user_id: supabaseUserId,
            category: expense.category,
            amount: expense.amount,
            description: expense.description,
            expense_date: expense.expenseDate,
            payment_method: expense.paymentMethod,
            receipt_url: expense.receiptUrl,
            created_at: expense.createdAt,
            updated_at: expense.updatedAt
          });

        if (error) {
          console.error(`❌ Error migrating expense ID ${expense.id}:`, error.message);
        } else {
          migrated++;
          console.log(`✅ Migrated expense ID: ${expense.id}`);
        }

      } catch (error) {
        console.error(`❌ Error migrating expense ID ${expense.id}:`, error.message);
      }
    }

    console.log(`\n✅ Expenses migration complete! Migrated ${migrated}/${expenses.length} expenses`);

  } finally {
    await connection.end();
  }
}

async function runMigration() {
  console.log('🚀 Starting MySQL to Supabase Migration...\n');
  console.log('⚠️  WARNING: This will create new users in Supabase Auth');
  console.log('⚠️  Users will need to reset their passwords\n');

  try {
    // Test connections
    console.log('Testing MySQL connection...');
    const mysqlConn = await mysql.createConnection(mysqlConfig);
    await mysqlConn.end();
    console.log('✅ MySQL connection successful\n');

    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Supabase connection successful\n');

    // Run migrations in order
    await migrateUsers();
    await migrateBusinessProfiles();
    await migrateInvoices();
    await migrateExpenses();

    console.log('\n🎉 Migration Complete!');
    console.log('\n📊 Summary:');
    console.log(`   Users migrated: ${userIdMap.size}`);
    console.log('\n⚠️  IMPORTANT: All users have temporary passwords: TempPassword123!');
    console.log('   Users must reset their passwords on first login\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
runMigration();
```

### Step 3: Update .env File

Make sure your `backend/.env` has both MySQL and Supabase credentials:

```env
# MySQL (source)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=billmanagement

# Supabase (destination)
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

### Step 4: Run Migration

```bash
cd backend
node migrate-to-supabase.js
```

### Step 5: Verify Migration

```bash
# Check in Supabase Dashboard:
# 1. Go to Table Editor
# 2. Check each table has data
# 3. Verify counts match MySQL
```

---

## 🔧 Option 2: Manual Export/Import

### Step 1: Export Data from MySQL

```bash
# Export all data
mysqldump -u root -p billmanagement > mysql_dump.sql

# Or export specific tables
mysqldump -u root -p billmanagement Users BusinessProfiles Invoices Expenses > mysql_dump.sql

# Export as CSV (alternative)
mysql -u root -p billmanagement -e "SELECT * FROM Invoices" > invoices.csv
```

### Step 2: Convert MySQL Dump to PostgreSQL

**Option A: Use Online Converter**
1. Go to https://www.convert-in.com/mysql-to-postgres.htm
2. Upload `mysql_dump.sql`
3. Download converted PostgreSQL file

**Option B: Manual Conversion**

Create `convert-mysql-to-postgres.sql`:

```sql
-- Example conversions needed:

-- 1. Change AUTO_INCREMENT to SERIAL
-- MySQL:
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY
);

-- PostgreSQL:
CREATE TABLE users (
  id SERIAL PRIMARY KEY
);

-- 2. Change DATETIME to TIMESTAMP
-- MySQL:
created_at DATETIME

-- PostgreSQL:
created_at TIMESTAMP

-- 3. Change backticks to double quotes
-- MySQL:
`users`

-- PostgreSQL:
"users" or just users

-- 4. Change TINYINT to BOOLEAN
-- MySQL:
is_active TINYINT(1)

-- PostgreSQL:
is_active BOOLEAN
```

### Step 3: Import to Supabase

1. Go to Supabase Dashboard
2. Click **SQL Editor**
3. Click **New Query**
4. Paste converted SQL
5. Click **Run**

---

## 📊 Option 3: CSV Export/Import

### Step 1: Export Tables to CSV

```bash
# Windows (using MySQL Workbench)
# 1. Right-click table → Table Data Export Wizard
# 2. Choose CSV format
# 3. Save file

# Or use command line:
mysql -u root -p billmanagement -e "SELECT * FROM Users INTO OUTFILE 'C:/temp/users.csv' FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n';"
```

### Step 2: Prepare CSV Files

Make sure CSV files have:
- Headers in first row
- Proper date format (YYYY-MM-DD)
- JSON fields properly formatted
- No special characters issues

### Step 3: Import to Supabase

**Method 1: Using Supabase Dashboard**
1. Go to Table Editor
2. Select table
3. Click "Insert" → "Import data from CSV"
4. Upload CSV file
5. Map columns
6. Import

**Method 2: Using SQL**

```sql
-- In Supabase SQL Editor
COPY invoices(invoice_number, client_name, total_amount, ...)
FROM '/path/to/invoices.csv'
DELIMITER ','
CSV HEADER;
```

---

## ⚠️ Important Considerations

### 1. User IDs Change
- MySQL uses integer IDs
- Supabase uses UUIDs
- You must map old IDs to new UUIDs
- Update all foreign keys

### 2. Passwords
- MySQL passwords are hashed with bcrypt
- Supabase uses different auth system
- Users will need to reset passwords
- Set temporary passwords during migration

### 3. Dates and Times
- MySQL: DATETIME
- PostgreSQL: TIMESTAMP or TIMESTAMPTZ
- Ensure timezone handling

### 4. JSON Fields
- MySQL: JSON type
- PostgreSQL: JSONB type (better performance)
- Ensure proper JSON formatting

### 5. Auto-increment IDs
- MySQL: AUTO_INCREMENT
- PostgreSQL: SERIAL or IDENTITY
- Sequences may need adjustment

---

## 🧪 Testing Migration

### Step 1: Test with Sample Data

```bash
# Create test database
mysql -u root -p -e "CREATE DATABASE billmanagement_test;"

# Copy some sample data
mysql -u root -p billmanagement_test < sample_data.sql

# Run migration on test database
# Update .env to use billmanagement_test
node migrate-to-supabase.js
```

### Step 2: Verify Data

```sql
-- In Supabase SQL Editor

-- Check user count
SELECT COUNT(*) FROM auth.users;

-- Check invoices
SELECT COUNT(*) FROM invoices;
SELECT * FROM invoices LIMIT 5;

-- Check expenses
SELECT COUNT(*) FROM expenses;
SELECT * FROM expenses LIMIT 5;

-- Verify relationships
SELECT 
  u.email,
  COUNT(i.id) as invoice_count
FROM auth.users u
LEFT JOIN invoices i ON i.user_id = u.id
GROUP BY u.email;
```

### Step 3: Test Application

1. Update frontend to use Supabase
2. Test login (users need new passwords)
3. Test viewing invoices
4. Test creating new invoice
5. Test all CRUD operations

---

## 🔄 Rollback Plan

### If Migration Fails:

1. **Keep MySQL Running**
   - Don't delete MySQL database
   - Keep it as backup

2. **Clear Supabase Data**
   ```sql
   -- In Supabase SQL Editor
   DELETE FROM expenses;
   DELETE FROM invoices;
   DELETE FROM business_profiles;
   DELETE FROM user_profiles;
   -- Delete auth users from dashboard
   ```

3. **Try Again**
   - Fix errors
   - Re-run migration script

---

## 📋 Migration Checklist

### Before Migration:
- [ ] Backup MySQL database
- [ ] Create Supabase project
- [ ] Run SUPABASE_SETUP_SCRIPT.sql
- [ ] Test Supabase connection
- [ ] Update .env with both credentials

### During Migration:
- [ ] Run migration script
- [ ] Monitor for errors
- [ ] Check logs
- [ ] Verify data counts

### After Migration:
- [ ] Verify all tables have data
- [ ] Test user login
- [ ] Test all features
- [ ] Update frontend to use Supabase
- [ ] Notify users about password reset

### Cleanup:
- [ ] Keep MySQL backup for 1 month
- [ ] Update documentation
- [ ] Remove MySQL credentials from production
- [ ] Monitor Supabase for issues

---

## 🆘 Troubleshooting

### Issue: "User already exists"
**Solution:** User email already in Supabase Auth. Skip or delete existing user first.

### Issue: "Foreign key violation"
**Solution:** Migrate users first, then related tables in order.

### Issue: "Invalid JSON format"
**Solution:** Check items field in invoices, ensure valid JSON.

### Issue: "Date format error"
**Solution:** Convert dates to YYYY-MM-DD format.

### Issue: "Connection timeout"
**Solution:** Migrate in smaller batches, add delays between inserts.

---

## 💡 Pro Tips

1. **Test First**: Always test on sample data first
2. **Backup Everything**: Keep MySQL backup for at least 1 month
3. **Migrate in Stages**: Users → Profiles → Invoices → Expenses
4. **Monitor Logs**: Watch for errors during migration
5. **Verify Counts**: Compare record counts before/after
6. **Keep Both Running**: Run MySQL and Supabase in parallel initially
7. **User Communication**: Notify users about password reset

---

## 📞 Need Help?

If you encounter issues:
1. Check error messages in console
2. Verify .env credentials
3. Check Supabase logs
4. Test connections separately
5. Ask me for help with specific errors!

---

**Ready to migrate? Start with Option 1 (Automated Script) - it's the safest!** 🚀
