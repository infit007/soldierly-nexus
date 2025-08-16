# Deploy to Render

## Prerequisites
1. Render account (free tier available)
2. PostgreSQL database (Render provides this)
3. Your code pushed to GitHub

## Step 1: Create PostgreSQL Database on Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "PostgreSQL"
3. Choose a name (e.g., "soldierly-nexus-db")
4. Select your region
5. Choose "Free" plan
6. Click "Create Database"
7. **Save the connection details** - you'll need them later

## Step 2: Deploy Backend Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Select the repository containing your backend code
5. Configure the service:
   - **Name**: soldierly-nexus-backend
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Root Directory**: `server` (if your backend is in a server folder)

## Step 3: Set Environment Variables
In your Render service settings, add these environment variables:

### Required Variables:
- `DATABASE_URL`: Your PostgreSQL connection string from Step 1
- `JWT_SECRET`: A secure random string (32+ characters)
- `CORS_ORIGIN`: Your frontend URL (e.g., `https://your-frontend.onrender.com`)

### Optional Variables:
- `NODE_ENV`: `production`
- `PORT`: `10000` (Render will set this automatically)

## Step 4: Deploy
1. Click "Create Web Service"
2. Render will automatically build and deploy your app
3. Wait for the build to complete (usually 2-5 minutes)

## Step 5: Update Database Schema
After deployment, you need to push your database schema:
1. Go to your service's "Shell" tab in Render
2. Run: `npx prisma db push`
3. Or run: `npx prisma migrate deploy`

## Step 6: Test Your API
Your API will be available at: `https://your-service-name.onrender.com`

Test the health endpoint: `https://your-service-name.onrender.com/api/health`

## Troubleshooting
- Check the "Logs" tab in Render for any errors
- Ensure all environment variables are set correctly
- Make sure your database is accessible from your service
- Verify CORS settings match your frontend URL
