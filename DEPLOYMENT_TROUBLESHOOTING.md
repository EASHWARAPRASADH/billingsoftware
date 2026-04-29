# Common Deployment Issues & Solutions

## 🔴 Critical Issues (Must Fix)

### Issue 1: MySQL Database Not Accessible

**Symptoms**:
- Backend logs show "Connection refused"
- Error: "ER_ACCESS_DENIED_ERROR"
- Error: "ECONNREFUSED"

**Causes**:
1. Database credentials incorrect
2. Database doesn't allow remote connections
3. IP not whitelisted
4. SSL/TLS configuration mismatch

**Solutions**:

#### For PlanetScale:
```javascript
// backend/config/database.js
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'mysql',
  dialectOptions: {
    ssl: {
      rejectUnauthorized: true
    }
  }
});
```

#### For Hostinger:
1. Login to Hostinger panel
2. Go to "MySQL Databases"
3. Click "Remote MySQL"
4. Add IP address or use `%` for all IPs (less secure)
5. Update connection string

#### Test Connection:
```bash
# Test from command line
mysql -h your-host.com -u your_user -p your_database

# Test from Node.js
node -e "const mysql = require('mysql2'); const conn = mysql.createConnection({host:'HOST',user:'USER',password:'PASS',database:'DB'}); conn.connect(err => {if(err) console.error(err); else console.log('Connected!'); conn.end();});"
```

---

### Issue 2: CORS Policy Blocking Requests

**Symptoms**:
- Browser console: "Access to fetch has been blocked by CORS policy"
- Network tab shows request with status "(failed)"
- Error: "No 'Access-Control-Allow-Origin' header"

**Causes**:
1. Backend CORS not configured for frontend domain
2. Credentials not allowed
3. Wrong HTTP methods
4. Preflight request failing

**Solutions**:

#### Update Backend CORS (backend/server.js):
```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://your-app.vercel.app',
    'https://your-custom-domain.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600
}));

// Handle preflight
app.options('*', cors());
```

#### Quick Fix (Development Only):
```javascript
// TEMPORARY - Allow all origins (NOT for production!)
app.use(cors({
  origin: '*',
  credentials: false
}));
```

#### Verify CORS:
```bash
# Test with curl
curl -H "Origin: https://your-app.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     --verbose \
     https://your-backend.onrender.com/api/auth/login
```

---

### Issue 3: Environment Variables Not Working

**Symptoms**:
- App uses default values
- `undefined` in logs
- Features not working in production

**Causes**:
1. Variables not set in platform dashboard
2. Missing `REACT_APP_` prefix (frontend)
3. Not redeployed after adding variables
4. Typo in variable names

**Solutions**:

#### Frontend (Vercel):
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add variables with `REACT_APP_` prefix:
   ```
   REACT_APP_API_URL=https://your-backend.onrender.com/api
   ```
3. Redeploy (important!)

#### Backend (Render):
1. Go to Render Dashboard → Service → Environment
2. Add variables:
   ```
   NODE_ENV=production
   DB_HOST=your-db-host.com
   DB_USER=your_user
   DB_PASSWORD=your_password
   DB_NAME=billmanagement
   JWT_SECRET=your-secret-key
   CORS_ORIGINS=https://your-app.vercel.app
   ```
3. Save (auto-redeploys)

#### Debug Environment Variables:
```javascript
// Add to backend for debugging
app.get('/api/debug/env', (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    DB_HOST: process.env.DB_HOST ? 'SET' : 'NOT SET',
    DB_USER: process.env.DB_USER ? 'SET' : 'NOT SET',
    JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
    // Don't expose actual values!
  });
});
```

---

### Issue 4: Backend Cold Starts (Render Free Tier)

**Symptoms**:
- First request takes 30-60 seconds
- Subsequent requests are fast
- Happens after 15 minutes of inactivity

**Causes**:
- Render free tier spins down after 15 minutes

**Solutions**:

#### Option 1: Upgrade to Paid Plan ($7/month)
- Always-on backend
- No cold starts
- Best for production

#### Option 2: Keep-Alive Service (Free)
```javascript
// Add to a free cron service like cron-job.org
// Ping every 10 minutes:
GET https://your-backend.onrender.com/api/health
```

#### Option 3: UptimeRobot (Free)
1. Sign up at uptimerobot.com
2. Add monitor for your backend URL
3. Set interval to 5 minutes
4. Keeps backend awake

#### Option 4: Accept Cold Starts
- Show loading message: "Waking up server..."
- Set longer timeout in frontend

---

### Issue 5: 404 on All API Routes

**Symptoms**:
- All API calls return 404
- Backend health check works
- Routes worked locally

**Causes**:
1. Wrong API URL in frontend
2. Missing `/api` prefix
3. Backend not deployed correctly
4. Routes not registered

**Solutions**:

#### Check Frontend API URL:
```javascript
// frontend/src/config/api.js or similar
console.log('API URL:', process.env.REACT_APP_API_URL);
// Should be: https://your-backend.onrender.com/api
```

#### Check Backend Routes:
```javascript
// backend/server.js
app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Add debug route
app.get('/api/routes', (req, res) => {
  res.json({
    routes: [
      '/api/auth/login',
      '/api/auth/register',
      '/api/invoices',
      '/api/expenses',
      '/api/dashboard'
    ]
  });
});
```

#### Test Backend Directly:
```bash
# Test health endpoint
curl https://your-backend.onrender.com/api/health

# Test specific route
curl -X POST https://your-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

---

## ⚠️ Common Issues (Important)

### Issue 6: JWT Token Not Persisting

**Symptoms**:
- User logged out on refresh
- Token not saved
- Authentication fails

**Causes**:
1. Token not stored in localStorage
2. CORS credentials not enabled
3. Token expired

**Solutions**:

#### Frontend:
```javascript
// After login
localStorage.setItem('token', response.data.token);

// On app load
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// On logout
localStorage.removeItem('token');
```

#### Backend:
```javascript
// Ensure CORS allows credentials
app.use(cors({
  origin: 'https://your-app.vercel.app',
  credentials: true // Important!
}));
```

---

### Issue 7: Database Migrations Not Running

**Symptoms**:
- Tables not created
- Columns missing
- Schema mismatch

**Causes**:
1. `sequelize.sync()` disabled in production
2. Migrations not run
3. Database permissions

**Solutions**:

#### Option 1: Enable Sync (Not Recommended for Production)
```javascript
// backend/server.js
if (process.env.ALLOW_SYNC === 'true') {
  sequelize.sync({ alter: true });
}
```

#### Option 2: Run Migrations Manually
```bash
# SSH into Render or use Render Shell
npm install -g sequelize-cli
npx sequelize-cli db:migrate
```

#### Option 3: Import Schema Directly
```bash
# Export schema from local
mysqldump -u root -p --no-data billmanagement > schema.sql

# Import to production
mysql -h prod-host -u user -p database < schema.sql
```

---

### Issue 8: File Uploads Failing

**Symptoms**:
- Company logo not saving
- Signature not uploading
- File upload returns error

**Causes**:
1. Serverless functions are stateless
2. No persistent file storage
3. File size limits

**Solutions**:

#### Use Cloud Storage (Recommended):

**Option A: Cloudinary (Free Tier)**
```javascript
// Install
npm install cloudinary multer-storage-cloudinary

// Configure
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'invoices',
    allowed_formats: ['jpg', 'png', 'pdf']
  }
});

const upload = multer({ storage: storage });
```

**Option B: AWS S3 (Free Tier)**
```javascript
// Install
npm install aws-sdk multer-s3

// Configure
const AWS = require('aws-sdk');
const multerS3 = require('multer-s3');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'your-bucket-name',
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + '-' + file.originalname);
    }
  })
});
```

---

### Issue 9: Build Failing on Vercel

**Symptoms**:
- Deployment fails
- Build errors in logs
- "Command failed with exit code 1"

**Causes**:
1. Missing dependencies
2. Build script errors
3. Environment variables missing during build
4. Memory limit exceeded

**Solutions**:

#### Check Build Logs:
1. Go to Vercel Dashboard → Deployments
2. Click failed deployment
3. Read error messages

#### Common Fixes:

**Missing Dependencies:**
```bash
# Make sure all deps are in package.json
npm install --save missing-package
```

**Build Script:**
```json
// frontend/package.json
{
  "scripts": {
    "build": "craco build",
    "vercel-build": "npm run build"
  }
}
```

**Increase Memory:**
```json
// vercel.json
{
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "maxLambdaSize": "50mb"
      }
    }
  ]
}
```

---

### Issue 10: Slow Performance

**Symptoms**:
- Pages load slowly
- API requests take long
- Database queries timeout

**Causes**:
1. No database indexing
2. N+1 query problem
3. Large bundle size
4. No caching

**Solutions**:

#### Database Optimization:
```javascript
// Add indexes to frequently queried columns
// In your models
{
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  // Add index
  indexes: [
    {
      fields: ['email']
    }
  ]
}
```

#### Query Optimization:
```javascript
// Use eager loading instead of N+1 queries
const invoices = await Invoice.findAll({
  include: [
    {
      model: User,
      attributes: ['id', 'name', 'email']
    }
  ]
});
```

#### Frontend Optimization:
```javascript
// Code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const InvoiceForm = lazy(() => import('./pages/InvoiceForm'));

// Use Suspense
<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>
```

---

## 🛠️ Debugging Tools

### 1. Check Backend Logs

**Render:**
```
Dashboard → Service → Logs
```

**Railway:**
```
Dashboard → Project → Deployments → Logs
```

### 2. Check Frontend Logs

**Vercel:**
```
Dashboard → Project → Deployments → Function Logs
```

**Browser:**
```
F12 → Console tab
F12 → Network tab
```

### 3. Test API Endpoints

**Using curl:**
```bash
# GET request
curl https://your-backend.onrender.com/api/health

# POST request
curl -X POST https://your-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# With authentication
curl https://your-backend.onrender.com/api/invoices \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Using Postman:**
1. Download Postman
2. Create new request
3. Set URL and method
4. Add headers
5. Add body (for POST/PUT)
6. Send and check response

### 4. Database Connection Test

```javascript
// Add to backend
app.get('/api/debug/db', async (req, res) => {
  try {
    await sequelize.authenticate();
    const result = await sequelize.query('SELECT 1+1 AS result');
    res.json({
      status: 'Connected',
      test: result
    });
  } catch (error) {
    res.status(500).json({
      status: 'Failed',
      error: error.message
    });
  }
});
```

---

## 📞 Getting Help

### 1. Platform Support

- **Vercel**: https://vercel.com/support
- **Render**: https://render.com/docs/support
- **PlanetScale**: https://planetscale.com/support
- **Railway**: https://railway.app/help

### 2. Community Forums

- **Stack Overflow**: Tag with platform name
- **Discord**: Most platforms have Discord servers
- **GitHub Issues**: For platform-specific bugs

### 3. Documentation

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **PlanetScale Docs**: https://planetscale.com/docs
- **Sequelize Docs**: https://sequelize.org/docs

---

## 🔍 Checklist for Troubleshooting

When something goes wrong:

1. ✅ Check browser console for errors
2. ✅ Check network tab for failed requests
3. ✅ Check backend logs
4. ✅ Verify environment variables are set
5. ✅ Test API endpoints directly
6. ✅ Check database connection
7. ✅ Verify CORS configuration
8. ✅ Check if services are running
9. ✅ Compare with local environment
10. ✅ Read error messages carefully

---

## 💡 Pro Tips

1. **Always check logs first** - Most issues show up in logs
2. **Test locally first** - Ensure it works locally before deploying
3. **Use environment variables** - Never hardcode credentials
4. **Enable debug mode** - Add logging for troubleshooting
5. **Keep backups** - Always have a database backup
6. **Monitor uptime** - Use UptimeRobot or similar
7. **Version control** - Commit before deploying
8. **Test in staging** - Use preview deployments
9. **Read documentation** - Platform docs are helpful
10. **Ask for help** - Don't struggle alone

---

Need help with a specific issue? Let me know and I'll help you debug it!
