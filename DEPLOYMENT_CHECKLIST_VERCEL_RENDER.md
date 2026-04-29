# Deployment Checklist for Vercel + Render + PlanetScale

## Pre-Deployment Checklist

### 1. Database Preparation
- [ ] Export current MySQL database
  ```bash
  mysqldump -u root -p billmanagement > billmanagement_backup.sql
  ```
- [ ] Choose database provider (PlanetScale recommended or Hostinger)
- [ ] Create database account
- [ ] Create new database instance
- [ ] Import data to new database
- [ ] Test database connection
- [ ] Note down connection credentials

### 2. Code Preparation
- [ ] Update `.gitignore` to exclude sensitive files
- [ ] Remove hardcoded URLs
- [ ] Update CORS configuration in backend
- [ ] Test application locally one more time
- [ ] Commit all changes to Git
- [ ] Push to GitHub

### 3. Backend Deployment (Render.com)
- [ ] Create Render.com account
- [ ] Create new Web Service
- [ ] Connect GitHub repository
- [ ] Set root directory to `backend`
- [ ] Configure environment variables:
  - [ ] NODE_ENV=production
  - [ ] PORT=10000
  - [ ] DB_HOST
  - [ ] DB_USER
  - [ ] DB_PASSWORD
  - [ ] DB_NAME
  - [ ] DB_PORT
  - [ ] JWT_SECRET
  - [ ] CORS_ORIGINS (add temporarily: *)
- [ ] Deploy backend
- [ ] Wait for deployment to complete
- [ ] Test health endpoint: `https://your-app.onrender.com/api/health`
- [ ] Copy backend URL for frontend configuration

### 4. Frontend Deployment (Vercel)
- [ ] Create Vercel account
- [ ] Import project from GitHub
- [ ] Set framework preset to "Create React App"
- [ ] Set root directory to `frontend`
- [ ] Configure environment variables:
  - [ ] REACT_APP_API_URL=https://your-backend.onrender.com/api
- [ ] Deploy frontend
- [ ] Wait for deployment to complete
- [ ] Copy frontend URL

### 5. CORS Configuration Update
- [ ] Go back to Render.com
- [ ] Update CORS_ORIGINS environment variable:
  - [ ] Add your Vercel URL (e.g., https://your-app.vercel.app)
  - [ ] Remove the wildcard (*) if you added it
- [ ] Redeploy backend

### 6. Testing
- [ ] Open frontend URL in browser
- [ ] Test user registration
- [ ] Test user login
- [ ] Test creating an invoice
- [ ] Test creating an expense
- [ ] Test dashboard statistics
- [ ] Test all CRUD operations
- [ ] Check browser console for errors
- [ ] Check network tab for failed requests
- [ ] Test on mobile device

### 7. Custom Domain (Optional)
- [ ] Purchase domain (if needed)
- [ ] Add custom domain to Vercel
- [ ] Configure DNS settings
- [ ] Wait for SSL certificate
- [ ] Update CORS_ORIGINS with custom domain
- [ ] Test with custom domain

### 8. Monitoring & Maintenance
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Configure uptime monitoring (e.g., UptimeRobot)
- [ ] Set up database backups
- [ ] Document deployment process
- [ ] Create rollback plan

## Common Issues & Solutions

### Issue: CORS Error
**Symptom**: "Access to fetch has been blocked by CORS policy"
**Solution**: 
1. Check CORS_ORIGINS in backend includes your frontend URL
2. Ensure no trailing slashes in URLs
3. Redeploy backend after changes

### Issue: Database Connection Failed
**Symptom**: "Unable to connect to database"
**Solution**:
1. Verify database credentials
2. Check if database allows remote connections
3. Verify SSL settings for production database
4. Check database host whitelist

### Issue: 404 on API Calls
**Symptom**: All API calls return 404
**Solution**:
1. Verify REACT_APP_API_URL is set correctly
2. Check if backend is deployed and running
3. Test backend health endpoint directly
4. Ensure /api prefix is included in URL

### Issue: Backend Sleeping (Render Free Tier)
**Symptom**: First request takes 30-60 seconds
**Solution**:
1. This is normal for Render free tier
2. Upgrade to paid plan ($7/month) for always-on
3. Or use a cron job to ping every 10 minutes

### Issue: Environment Variables Not Working
**Symptom**: App uses default values instead of env vars
**Solution**:
1. Verify env vars are set in platform dashboard
2. Ensure REACT_APP_ prefix for frontend vars
3. Redeploy after adding env vars
4. Check for typos in variable names

## Rollback Plan

If deployment fails:

1. **Frontend Rollback**:
   - Go to Vercel Dashboard → Deployments
   - Find previous working deployment
   - Click "Promote to Production"

2. **Backend Rollback**:
   - Go to Render Dashboard → Deployments
   - Find previous working deployment
   - Click "Redeploy"

3. **Database Rollback**:
   - Restore from backup:
     ```bash
     mysql -h host -u user -p database < billmanagement_backup.sql
     ```

## Cost Tracking

### Free Tier Limits
- **Vercel**: 100GB bandwidth/month
- **Render**: 750 hours/month (not 24/7)
- **PlanetScale**: 5GB storage, 1B row reads

### When to Upgrade
- Render: When you need 24/7 uptime ($7/month)
- Vercel: When you exceed bandwidth ($20/month)
- PlanetScale: When you exceed 5GB storage ($29/month)

## Next Steps After Deployment

1. **Security**:
   - [ ] Enable 2FA on all platforms
   - [ ] Rotate JWT secret regularly
   - [ ] Set up security headers
   - [ ] Enable rate limiting

2. **Performance**:
   - [ ] Enable caching
   - [ ] Optimize images
   - [ ] Minimize bundle size
   - [ ] Set up CDN

3. **Monitoring**:
   - [ ] Set up error tracking
   - [ ] Monitor API response times
   - [ ] Track user analytics
   - [ ] Set up alerts

4. **Backups**:
   - [ ] Schedule daily database backups
   - [ ] Test backup restoration
   - [ ] Store backups in multiple locations

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **PlanetScale Docs**: https://planetscale.com/docs
- **Sequelize Docs**: https://sequelize.org/docs

## Emergency Contacts

- Vercel Support: support@vercel.com
- Render Support: support@render.com
- PlanetScale Support: support@planetscale.com

---

**Estimated Total Deployment Time**: 4-6 hours
**Skill Level Required**: Intermediate
**Cost**: $0 (free tier) or $7-56/month (production)
