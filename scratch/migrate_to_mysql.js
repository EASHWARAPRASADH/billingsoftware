
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Use the central sequelize instance and models
const sequelize = require('../backend/config/database');
const User = require('../backend/models/User');
const BusinessProfile = require('../backend/models/BusinessProfile');
const Invoice = require('../backend/models/Invoice');
const Product = require('../backend/models/Product');
const Expense = require('../backend/models/Expense');

async function migrate() {
  // Syncing via the central instance will use the model definitions correctly
  await sequelize.sync({ force: true });
  console.log('MySQL Database Reset and Schema Created.');

  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) throw userError;

  const userMap = {};

  for (const sbUser of users) {
    console.log(`Migrating user: ${sbUser.email}`);
    const { data: profile } = await supabase.from('user_profiles').select('business_name').eq('id', sbUser.id).single();
    
    const mysqlUser = await User.create({
      email: sbUser.email,
      password: 'password123', // Default password for migrated users
      businessName: profile?.business_name || 'Business'
    });
    userMap[sbUser.id] = mysqlUser.id;
  }

  console.log('Migrating business profiles...');
  const { data: sbProfiles } = await supabase.from('business_profiles').select('*');
  for (const sbP of sbProfiles) {
    if (!userMap[sbP.user_id]) continue;
    await BusinessProfile.create({
      userId: userMap[sbP.user_id],
      company_name: sbP.company_name,
      company_email: sbP.company_email,
      company_phone: sbP.company_phone,
      company_address: sbP.company_address,
      company_logo: sbP.company_logo,
      gst_number: sbP.gst_number,
      pan_number: sbP.pan_number,
      bank_name: sbP.bank_name,
      account_number: sbP.account_number,
      ifsc_code: sbP.ifsc_code,
      signature_image: sbP.signature_image
    });
  }

  console.log('Migrating products...');
  const { data: sbProducts } = await supabase.from('products').select('*');
  for (const sbProd of sbProducts) {
    if (!userMap[sbProd.user_id]) continue;
    await Product.create({
      userId: userMap[sbProd.user_id],
      name: sbProd.name,
      hsn_code: sbProd.hsn_code,
      gst_rate: sbProd.gst_rate,
      description: sbProd.description
    });
  }

  console.log('Migrating invoices...');
  const { data: sbInvoices } = await supabase.from('invoices').select('*');
  for (const sbInv of sbInvoices) {
    if (!userMap[sbInv.user_id]) continue;
    await Invoice.create({
      userId: userMap[sbInv.user_id],
      invoice_number: sbInv.invoice_number,
      client_name: sbInv.client_name,
      client_email: sbInv.client_email,
      client_phone: sbInv.client_phone || '',
      client_address: sbInv.client_address,
      invoice_date: sbInv.invoice_date,
      due_date: sbInv.due_date,
      items: sbInv.items,
      subtotal: sbInv.subtotal,
      tax_amount: sbInv.tax_amount,
      discount_amount: sbInv.discount_amount,
      shipping_cost: sbInv.shipping_cost,
      total_amount: sbInv.total_amount,
      notes: sbInv.notes,
      terms: sbInv.terms,
      status: sbInv.status
    });
  }

  console.log('Migrating expenses...');
  const { data: sbExpenses } = await supabase.from('expenses').select('*');
  if (sbExpenses) {
    for (const sbExp of sbExpenses) {
      if (!userMap[sbExp.user_id]) continue;
      await Expense.create({
        userId: userMap[sbExp.user_id],
        category: sbExp.category,
        amount: sbExp.amount,
        description: sbExp.description,
        expense_date: sbExp.expense_date,
        receipt_url: sbExp.receipt_url
      });
    }
  }

  console.log('Migration Complete!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
