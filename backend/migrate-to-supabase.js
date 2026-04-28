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

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    console.error('Please add SUPABASE_URL and SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// User ID mapping (MySQL ID -> Supabase UUID)
const userIdMap = new Map();

// Statistics
const stats = {
    users: { total: 0, migrated: 0, failed: 0 },
    profiles: { total: 0, migrated: 0, failed: 0 },
    invoices: { total: 0, migrated: 0, failed: 0 },
    expenses: { total: 0, migrated: 0, failed: 0 }
};

async function migrateUsers() {
    console.log('\n📊 Migrating Users...');

    const connection = await mysql.createConnection(mysqlConfig);

    try {
        // Get all users from MySQL
        const [users] = await connection.execute('SELECT * FROM Users');
        stats.users.total = users.length;
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
                    stats.users.failed++;
                    continue;
                }

                // Map MySQL ID to Supabase UUID
                userIdMap.set(user.id, authData.user.id);

                // Create user profile
                const { error: profileError } = await supabase
                    .from('user_profiles')
                    .insert({
                        id: authData.user.id,
                        business_name: user.businessName,
                        created_at: user.createdAt,
                        updated_at: user.updatedAt
                    });

                if (profileError) {
                    console.error(`❌ Error creating profile for ${user.email}:`, profileError.message);
                    stats.users.failed++;
                } else {
                    stats.users.migrated++;
                    console.log(`✅ Migrated user: ${user.email}`);
                }

            } catch (error) {
                console.error(`❌ Error migrating user ${user.email}:`, error.message);
                stats.users.failed++;
            }
        }

        console.log(`\n✅ Users migration complete!`);
        console.log(`   Migrated: ${stats.users.migrated}/${stats.users.total}`);
        console.log(`   Failed: ${stats.users.failed}`);

    } finally {
        await connection.end();
    }
}

async function migrateBusinessProfiles() {
    console.log('\n📊 Migrating Business Profiles...');

    const connection = await mysql.createConnection(mysqlConfig);

    try {
        const [profiles] = await connection.execute('SELECT * FROM BusinessProfiles');
        stats.profiles.total = profiles.length;
        console.log(`Found ${profiles.length} business profiles in MySQL`);

        for (const profile of profiles) {
            try {
                const supabaseUserId = userIdMap.get(profile.userId);

                if (!supabaseUserId) {
                    console.log(`⚠️  Skipping profile for user ID ${profile.userId} (user not migrated)`);
                    stats.profiles.failed++;
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
                    stats.profiles.failed++;
                } else {
                    stats.profiles.migrated++;
                    console.log(`✅ Migrated business profile ID: ${profile.id}`);
                }

            } catch (error) {
                console.error(`❌ Error migrating profile ID ${profile.id}:`, error.message);
                stats.profiles.failed++;
            }
        }

        console.log(`\n✅ Business profiles migration complete!`);
        console.log(`   Migrated: ${stats.profiles.migrated}/${stats.profiles.total}`);
        console.log(`   Failed: ${stats.profiles.failed}`);

    } finally {
        await connection.end();
    }
}

async function migrateInvoices() {
    console.log('\n📊 Migrating Invoices...');

    const connection = await mysql.createConnection(mysqlConfig);

    try {
        const [invoices] = await connection.execute('SELECT * FROM Invoices');
        stats.invoices.total = invoices.length;
        console.log(`Found ${invoices.length} invoices in MySQL`);

        for (const invoice of invoices) {
            try {
                const supabaseUserId = userIdMap.get(invoice.userId);

                if (!supabaseUserId) {
                    console.log(`⚠️  Skipping invoice ${invoice.invoiceNumber} (user not migrated)`);
                    stats.invoices.failed++;
                    continue;
                }

                // Parse items JSON if it's a string
                let items = invoice.items;
                if (typeof items === 'string') {
                    try {
                        items = JSON.parse(items);
                    } catch (e) {
                        console.error(`❌ Invalid JSON in invoice ${invoice.invoiceNumber}`);
                        items = [];
                    }
                }

                // Handle null invoice_date - use created_at or current date as fallback
                let invoiceDate = invoice.invoiceDate;
                if (!invoiceDate) {
                    invoiceDate = invoice.createdAt || new Date().toISOString().split('T')[0];
                    console.log(`⚠️  Invoice ${invoice.invoiceNumber} has no date, using ${invoiceDate}`);
                }

                // Handle null due_date - use invoice_date + 30 days as fallback
                let dueDate = invoice.dueDate;
                if (!dueDate && invoiceDate) {
                    const date = new Date(invoiceDate);
                    date.setDate(date.getDate() + 30);
                    dueDate = date.toISOString().split('T')[0];
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
                        invoice_date: invoiceDate,
                        due_date: dueDate,
                        items: items,
                        subtotal: parseFloat(invoice.subtotal) || 0,
                        tax_amount: parseFloat(invoice.taxAmount) || 0,
                        discount_amount: parseFloat(invoice.discountAmount) || 0,
                        shipping_cost: parseFloat(invoice.shippingCost) || 0,
                        total_amount: parseFloat(invoice.totalAmount) || 0,
                        notes: invoice.notes,
                        terms: invoice.terms,
                        status: invoice.status || 'pending',
                        created_at: invoice.createdAt,
                        updated_at: invoice.updatedAt
                    });

                if (error) {
                    console.error(`❌ Error migrating invoice ${invoice.invoiceNumber}:`, error.message);
                    stats.invoices.failed++;
                } else {
                    stats.invoices.migrated++;
                    console.log(`✅ Migrated invoice: ${invoice.invoiceNumber}`);
                }

            } catch (error) {
                console.error(`❌ Error migrating invoice ${invoice.invoiceNumber}:`, error.message);
                stats.invoices.failed++;
            }
        }

        console.log(`\n✅ Invoices migration complete!`);
        console.log(`   Migrated: ${stats.invoices.migrated}/${stats.invoices.total}`);
        console.log(`   Failed: ${stats.invoices.failed}`);

    } finally {
        await connection.end();
    }
}

async function migrateExpenses() {
    console.log('\n📊 Migrating Expenses...');

    const connection = await mysql.createConnection(mysqlConfig);

    try {
        const [expenses] = await connection.execute('SELECT * FROM Expenses');
        stats.expenses.total = expenses.length;
        console.log(`Found ${expenses.length} expenses in MySQL`);

        for (const expense of expenses) {
            try {
                const supabaseUserId = userIdMap.get(expense.userId);

                if (!supabaseUserId) {
                    console.log(`⚠️  Skipping expense ID ${expense.id} (user not migrated)`);
                    stats.expenses.failed++;
                    continue;
                }

                const { error } = await supabase
                    .from('expenses')
                    .insert({
                        user_id: supabaseUserId,
                        category: expense.category,
                        amount: parseFloat(expense.amount) || 0,
                        description: expense.description,
                        expense_date: expense.expenseDate,
                        payment_method: expense.paymentMethod,
                        receipt_url: expense.receiptUrl,
                        created_at: expense.createdAt,
                        updated_at: expense.updatedAt
                    });

                if (error) {
                    console.error(`❌ Error migrating expense ID ${expense.id}:`, error.message);
                    stats.expenses.failed++;
                } else {
                    stats.expenses.migrated++;
                    console.log(`✅ Migrated expense ID: ${expense.id}`);
                }

            } catch (error) {
                console.error(`❌ Error migrating expense ID ${expense.id}:`, error.message);
                stats.expenses.failed++;
            }
        }

        console.log(`\n✅ Expenses migration complete!`);
        console.log(`   Migrated: ${stats.expenses.migrated}/${stats.expenses.total}`);
        console.log(`   Failed: ${stats.expenses.failed}`);

    } finally {
        await connection.end();
    }
}

async function printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 MIGRATION COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📊 Migration Summary:\n');

    console.log(`Users:             ${stats.users.migrated}/${stats.users.total} migrated (${stats.users.failed} failed)`);
    console.log(`Business Profiles: ${stats.profiles.migrated}/${stats.profiles.total} migrated (${stats.profiles.failed} failed)`);
    console.log(`Invoices:          ${stats.invoices.migrated}/${stats.invoices.total} migrated (${stats.invoices.failed} failed)`);
    console.log(`Expenses:          ${stats.expenses.migrated}/${stats.expenses.total} migrated (${stats.expenses.failed} failed)`);

    const totalMigrated = stats.users.migrated + stats.profiles.migrated + stats.invoices.migrated + stats.expenses.migrated;
    const totalRecords = stats.users.total + stats.profiles.total + stats.invoices.total + stats.expenses.total;
    const totalFailed = stats.users.failed + stats.profiles.failed + stats.invoices.failed + stats.expenses.failed;

    console.log(`\nTotal:             ${totalMigrated}/${totalRecords} records migrated (${totalFailed} failed)`);

    console.log('\n' + '='.repeat(60));
    console.log('\n⚠️  IMPORTANT NOTES:\n');
    console.log('1. All users have temporary password: TempPassword123!');
    console.log('2. Users MUST reset their passwords on first login');
    console.log('3. Keep MySQL database as backup for at least 1 month');
    console.log('4. Test all features before switching to Supabase');
    console.log('5. Update frontend to use Supabase authentication\n');
    console.log('='.repeat(60) + '\n');
}

async function runMigration() {
    console.log('🚀 Starting MySQL to Supabase Migration...\n');
    console.log('⚠️  WARNING: This will create new users in Supabase Auth');
    console.log('⚠️  Users will need to reset their passwords\n');

    // Confirmation prompt
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
        // Test MySQL connection
        console.log('\n🔍 Testing MySQL connection...');
        const mysqlConn = await mysql.createConnection(mysqlConfig);
        await mysqlConn.query('SELECT 1');
        await mysqlConn.end();
        console.log('✅ MySQL connection successful');

        // Test Supabase connection
        console.log('🔍 Testing Supabase connection...');
        const { error: supabaseError } = await supabase.from('user_profiles').select('count').limit(1);
        if (supabaseError && supabaseError.code !== 'PGRST116') { // PGRST116 = no rows, which is fine
            throw supabaseError;
        }
        console.log('✅ Supabase connection successful');

        // Run migrations in order
        await migrateUsers();
        await migrateBusinessProfiles();
        await migrateInvoices();
        await migrateExpenses();

        // Print summary
        await printSummary();

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error('\nError details:', error);
        process.exit(1);
    }
}

// Run migration
runMigration();
