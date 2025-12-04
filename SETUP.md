# Soldierly Nexus Setup Guide

## Issues Fixed

1. **401 Unauthorized Error**: Fixed by adding fallback authentication when database is not available
2. **404 Error for /user route**: Fixed by creating the missing user portal page

## Quick Start (Without Database)

1. **Set environment variables** (run in PowerShell):
   ```powershell
   .\setup-env.ps1
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Use demo credentials**:
   - Admin: `admin@soldierly-nexus.com` / `Passw0rd!`
   - Operator: `operator1@soldierly-nexus.com` / `Passw0rd!`
   - User: `user1@soldierly-nexus.com` / `Passw0rd!`

## Full Setup (With Database)

1. **Install Docker Desktop** and start it

2. **Start the database**:
   ```bash
   docker-compose up -d
   ```

3. **Set up the database**:
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

4. **Set environment variables**:
   ```powershell
   .\setup-env.ps1
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/soldierly_nexus"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-this-in-production"

# App
NODE_ENV="development"
```

## What Was Fixed

### Authentication Issues (401 Error)
- Added fallback authentication when database is not available
- Improved error handling and logging
- Added development-friendly configuration

### Routing Issues (404 Error)
- Created missing `/user` route and page
- Updated middleware to protect user routes
- Added proper authentication checks

### Portal Access
- User portal now accessible at `/user`
- Proper role-based access control
- Consistent UI/UX across all portals

## Troubleshooting

### Still getting 401 errors?
1. Check if environment variables are set: `echo $env:NEXTAUTH_SECRET`
2. Run the setup script: `.\setup-env.ps1`
3. Restart the development server

### Still getting 404 errors?
1. Make sure the development server is running
2. Check the browser console for any JavaScript errors
3. Verify the route exists in the file structure

### Database connection issues?
1. Check if Docker is running
2. Verify the database container is up: `docker ps`
3. Check the database logs: `docker logs soldierly-nexus-postgres`

## Development Notes

- The app now works without a database using fallback authentication
- All routes are properly protected and accessible
- User portal provides a complete user experience
- Authentication flow is robust and handles errors gracefully
