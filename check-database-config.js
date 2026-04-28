const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Bill Management Application Configuration...\n');

// Check backend configuration
console.log('='.repeat(60));
console.log('BACKEND CONFIGURATION');
console.log('='.repeat(60));

const backendServerPath = path.join(__dirname, 'backend', 'server.js');
const backendDatabasePath = path.join(__dirname, 'backend', 'config', 'database.js');
const backendSupabasePath = path.join(__dirname, 'backend', 'config', 'supabase.js');

// Check server.js
if (fs.existsSync(backendServerPath)) {
    const serverContent = fs.readFileSync(backendServerPath, 'utf8');

    if (serverContent.includes('sequelize')) {
        console.log('✅ Backend is using: MYSQL (via Sequelize)');
        console.log('   File: backend/server.js');
        console.log('   Database config: backend/config/database.js');
    } else if (serverContent.includes('supabase')) {
        console.log('✅ Backend is using: SUPABASE');
        console.log('   File: backend/server.js');
        console.log('   Database config: backend/config/supabase.js');
    } else {
        console.log('⚠️  Backend database type: UNKNOWN');
    }
} else {
    console.log('❌ Backend server.js not found');
}

// Check if Supabase config exists
if (fs.existsSync(backendSupabasePath)) {
    console.log('📄 Supabase config file exists: backend/config/supabase.js');
} else {
    console.log('📄 Supabase config file: NOT FOUND');
}

// Check if MySQL config exists
if (fs.existsSync(backendDatabasePath)) {
    console.log('📄 MySQL config file exists: backend/config/database.js');
} else {
    console.log('📄 MySQL config file: NOT FOUND');
}

console.log('\n' + '='.repeat(60));
console.log('FRONTEND CONFIGURATION');
console.log('='.repeat(60));

const frontendAppPath = path.join(__dirname, 'frontend', 'src', 'App.js');
const frontendSupabaseConfigPath = path.join(__dirname, 'frontend', 'src', 'config', 'supabase.js');
const frontendAuthContextPath = path.join(__dirname, 'frontend', 'src', 'contexts', 'AuthContext.js');
const frontendEnvPath = path.join(__dirname, 'frontend', '.env.local');

// Check App.js
if (fs.existsSync(frontendAppPath)) {
    const appContent = fs.readFileSync(frontendAppPath, 'utf8');

    if (appContent.includes('AuthProvider') && appContent.includes('useAuth')) {
        console.log('✅ Frontend is using: SUPABASE (AuthProvider detected)');
        console.log('   File: frontend/src/App.js');
    } else if (appContent.includes('axios')) {
        console.log('✅ Frontend is using: MYSQL/Backend API (axios detected)');
        console.log('   File: frontend/src/App.js');
        console.log('   API calls via: axios to backend');
    } else {
        console.log('⚠️  Frontend auth type: UNKNOWN');
    }
} else {
    console.log('❌ Frontend App.js not found');
}

// Check if Supabase files exist
if (fs.existsSync(frontendSupabaseConfigPath)) {
    console.log('📄 Supabase config exists: frontend/src/config/supabase.js');
} else {
    console.log('📄 Supabase config: NOT FOUND');
}

if (fs.existsSync(frontendAuthContextPath)) {
    console.log('📄 AuthContext exists: frontend/src/contexts/AuthContext.js');
} else {
    console.log('📄 AuthContext: NOT FOUND');
}

if (fs.existsSync(frontendEnvPath)) {
    console.log('📄 Environment file exists: frontend/.env.local');
    const envContent = fs.readFileSync(frontendEnvPath, 'utf8');
    if (envContent.includes('REACT_APP_SUPABASE_URL')) {
        console.log('   ✅ Contains Supabase credentials');
    }
} else {
    console.log('📄 Environment file: NOT FOUND (frontend/.env.local)');
}

console.log('\n' + '='.repeat(60));
console.log('SUMMARY');
console.log('='.repeat(60));

// Determine current state
const backendUsesMySQL = fs.existsSync(backendServerPath) &&
    fs.readFileSync(backendServerPath, 'utf8').includes('sequelize');

const frontendUsesSupabase = fs.existsSync(frontendAppPath) &&
    fs.readFileSync(frontendAppPath, 'utf8').includes('AuthProvider');

const frontendUsesAxios = fs.existsSync(frontendAppPath) &&
    fs.readFileSync(frontendAppPath, 'utf8').includes('axios.interceptors');

console.log('\n📊 Current Configuration:\n');

if (backendUsesMySQL && frontendUsesAxios) {
    console.log('🔴 CURRENT STATE: Using MySQL Backend');
    console.log('   Backend: MySQL (via Sequelize)');
    console.log('   Frontend: Axios → Backend API → MySQL');
    console.log('\n💡 To switch to Supabase:');
    console.log('   1. Update frontend/src/App.js (see CONNECT_FRONTEND_TO_SUPABASE.md)');
    console.log('   2. Create frontend/.env.local with Supabase credentials');
    console.log('   3. Optionally update backend to use Supabase');
} else if (frontendUsesSupabase) {
    console.log('🟢 CURRENT STATE: Using Supabase');
    console.log('   Frontend: Supabase Auth + Direct DB access');
    console.log('   Backend: ' + (backendUsesMySQL ? 'Still using MySQL (can be removed)' : 'Not needed'));
} else {
    console.log('⚠️  CURRENT STATE: Mixed/Unknown Configuration');
    console.log('   Please check the files manually');
}

console.log('\n' + '='.repeat(60));
console.log('\n✅ Diagnostic complete!\n');
