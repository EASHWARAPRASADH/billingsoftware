# Supabase Environment Variables Template

# ================================================
# BACKEND ENVIRONMENT VARIABLES
# File: backend/.env
# ================================================

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here

# Server Configuration
NODE_ENV=development
PORT=8000

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# JWT Configuration (if keeping custom auth)
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRES_IN=7d

# Legacy MySQL Configuration (optional, for migration period)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=billmanagement
DB_PORT=3306

# ================================================
# FRONTEND ENVIRONMENT VARIABLES
# File: frontend/.env
# ================================================

# Supabase Configuration (must have REACT_APP_ prefix)
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here

# API Configuration (if keeping backend)
REACT_APP_API_URL=http://localhost:8000/api

# ================================================
# PRODUCTION ENVIRONMENT VARIABLES
# ================================================

# Backend (Render/Railway)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here
NODE_ENV=production
PORT=8000
CORS_ORIGINS=https://your-app.vercel.app,https://your-domain.com

# Frontend (Vercel)
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
REACT_APP_API_URL=https://your-backend.onrender.com/api

# ================================================
# HOW TO GET SUPABASE CREDENTIALS
# ================================================
# 1. Go to https://supabase.com
# 2. Create/Open your project
# 3. Go to Project Settings (⚙️) → API
# 4. Copy:
#    - Project URL → SUPABASE_URL
#    - anon public → SUPABASE_ANON_KEY
#    - service_role → SUPABASE_SERVICE_KEY (keep secret!)
# ================================================

# ================================================
# SECURITY NOTES
# ================================================
# ⚠️ NEVER commit .env files to Git
# ⚠️ NEVER share your service_role key
# ⚠️ Use anon key for frontend only
# ⚠️ Use service_role key for backend only
# ⚠️ Add .env to .gitignore
# ================================================
