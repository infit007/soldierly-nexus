#!/bin/bash

echo "🚀 Preparing for Render deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the server directory."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

echo "✅ Build completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Push your code to GitHub"
echo "2. Create a PostgreSQL database on Render"
echo "3. Deploy your web service on Render"
echo "4. Set environment variables in Render"
echo "5. Run 'npx prisma db push' in Render shell"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
