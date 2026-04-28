const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️  Supabase credentials not found in environment variables');
    console.warn('Please add SUPABASE_URL and SUPABASE_SERVICE_KEY to your .env file');
}

// Create Supabase client with service role key for backend operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
    }
});

// Test connection
const testConnection = async () => {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('count')
            .limit(1);

        if (error) {
            console.error('❌ Supabase connection test failed:', error.message);
            return false;
        }

        console.log('✅ Successfully connected to Supabase');
        return true;
    } catch (error) {
        console.error('❌ Supabase connection error:', error.message);
        return false;
    }
};

module.exports = { supabase, testConnection };
