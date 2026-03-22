# UniConnect Deployment Guide

## Development Environment Setup

### Local Development

#### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager
- MongoDB Atlas account (free tier available)
- Git for version control

#### Step-by-Step Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd UniConnect

# 2. Install root dependencies
npm install

# 3. Setup Backend
cd backend
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
# Edit backend/.env and add:
#   - MONGO_URI from MongoDB Atlas
#   - JWT_SECRET (generate a random string)
#   - CLOUDINARY credentials

npm run dev
```

```bash
# 4. Setup Frontend (in new terminal)
cd frontend
npm install

# Create environment file
cp .env.example .env

# Keep VITE_API_URL as http://localhost:5000/api

npm run dev
```

Access the application at `http://localhost:5173`

## MongoDB Atlas Setup

1. Go to [mongodb.com/cloud](https://www.mongodb.com/cloud)
2. Create free account
3. Create new cluster
4. Add sample data or keep empty
5. Create database user with username/password
6. Add IP address to whitelist (or allow all: 0.0.0.0/0 for dev)
7. Copy connection string
8. Replace credentials in connection string
9. Add to backend .env as `MONGO_URI`

### Connection String Format
```
mongodb+srv://username:password@cluster-name.mongodb.net/database-name?retryWrites=true&w=majority
```

## Cloudinary Setup

1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for free account
3. Navigate to Dashboard
4. Copy:
   - Cloud Name
   - API Key
   - API Secret
5. Add to backend .env

## Production Deployment

### Backend Deployment (Render/Railway/Heroku)

#### Using Render

1. **Connect Repository**
   - Sign in to [render.com](https://render.com)
   - Connect GitHub account
   - Select UniConnect repository

2. **Create Web Service**
   - New → Web Service
   - Select repository
   - Name: `uniconnect-backend`
   - Environment: Node
   - Region: Choose closest
   - Build Command: `cd backend && npm install`
   - Start Command: `node backend/src/index.js`

3. **Add Environment Variables**
   - Add all variables from .env.example
   - Key names must match exactly

4. **Deploy**
   - Click Deploy
   - Monitor build logs
   - Note the URL (e.g., https://uniconnect-backend.onrender.com)

#### Using Railway

```bash
# 1. Install railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Create project
cd backend
railway init

# 4. Add environment variables via dashboard

# 5. Deploy
railway up
```

### Frontend Deployment (Vercel/Netlify)

#### Using Vercel

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select root directory: `frontend`
   - Add Environment Variables:
     - `VITE_API_URL`: Your backend URL
   - Deploy

#### Using Netlify

1. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy on Netlify**
   - Drag & drop `dist` folder to Netlify
   - Or connect GitHub for continuous deployment
   - Add build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`

#### Using GitHub Pages

```bash
# Add to frontend/vite.config.js
export default {
  base: '/',
  // ...
}

# Build and deploy
npm run build
git add dist
git commit -m "Deploy to GitHub Pages"
git push
```

### Database Configuration for Production

#### MongoDB Atlas Security

1. **IP Whitelist**
   - Only allow production server IP
   - Or use VPN for secure connection

2. **User Permissions**
   - Create separate user for production
   - Limit to specific database

3. **Backup**
   - Enable automated backups
   - Set backup window during low traffic

4. **Monitoring**
   - Enable Performance Advisor
   - Set up alerts for unusual activity

## Environment Variables Checklist

### Backend

```env
# Required
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/uniconnect
JWT_SECRET=your-super-secret-key-min-32-chars

# Optional but Recommended
CLOUDINARY_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NODE_ENV=production
```

### Frontend

```env
# Required
VITE_API_URL=https://your-backend-url.com/api
```

## Performance Optimization

### Backend
- Enable gzip compression
- Use MongoDB indexing
- Implement rate limiting
- Cache frequently accessed data
- Use environment variables for config

### Frontend
- Code splitting with React.lazy()
- Image optimization
- CSS/JS minification (Vite handles this)
- Remove unused CSS with Tailwind
- Use CDN for static assets

## Security Checklist

- [ ] Change JWT_SECRET to strong random value
- [ ] Set MONGO_URI with strong password
- [ ] Enable HTTPS everywhere
- [ ] Set secure cookie flags
- [ ] Enable CORS only for frontend domain
- [ ] Add rate limiting
- [ ] Validate all user inputs
- [ ] Use environment variables for all secrets
- [ ] Enable MongoDB authentication
- [ ] Regular security updates for dependencies
- [ ] Set Content Security Policy headers

## Continuous Integration/Deployment

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Install & Build Backend
        run: |
          cd backend
          npm install
          npm run build 2>/dev/null || true
      
      - name: Deploy Backend
        run: |
          # Deploy script here
      
      - name: Build Frontend
        run: |
          cd frontend
          npm install
          npm run build
      
      - name: Deploy Frontend
        run: |
          # Deploy script here
```

## Monitoring & Logging

### Backend Monitoring
- Use error tracking (Sentry, LogRocket)
- Monitor API response times
- Track database queries
- Set up alerts for errors

### Frontend Monitoring
- User error tracking
- Performance metrics
- Page load time
- User analytics

## Scaling Considerations

1. **Database**
   - Use read replicas
   - Implement connection pooling
   - Archive old data

2. **Backend**
   - Load balancing
   - Horizontal scaling
   - Cache layer (Redis)

3. **Frontend**
   - CDN for static assets
   - Service workers
   - Lazy loading

## Troubleshooting

### Backend Won't Start
```bash
# Check Node version
node --version

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check MongoDB connection
mongo "your-connection-string"
```

### Frontend Build Fails
```bash
# Clear cache
rm -rf node_modules dist .vite
npm install
npm run build
```

### API Connection Issues
- Ensure backend URL is correct in frontend .env
- Check CORS settings
- Verify frontend and backend are running
- Check browser console for errors

### Database Connection Error
- Verify MongoDB URI is correct
- Check IP whitelist in Atlas
- Ensure database user exists
- Test connection string locally

## Support & Documentation

- GitHub Issues for bug reports
- Documentation: See README.md
- Email support: support@uniconnect.dev

## Rollback Procedure

### Vercel/Netlify
- Go to Deployments tab
- Select previous version
- Click "Redeploy"

### Render/Railway
- View previous builds
- Click "Redeploy" on previous version

### Manual
```bash
git revert <commit-hash>
git push
# Redeploy from CD pipeline
```

## Cost Estimation

### Monthly Costs
- MongoDB Atlas (free): $0
- Render (basic): $7
- Cloudinary (free): $0
- Vercel/Netlify (free): $0
- **Total (minimum)**: ~$7/month

### With Premium
- MongoDB Atlas (M2): $57
- Render (Pro): $12
- Cloudinary (Pro): $99
- Vercel (Pro): $20
- **Total (premium)**: ~$188/month
