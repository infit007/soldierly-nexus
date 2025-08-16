const { execSync } = require('child_process')
const fs = require('fs')

console.log('🔨 Starting build process...')

try {
  // Install dependencies
  console.log('📦 Installing dependencies...')
  execSync('npm install', { stdio: 'inherit' })

  // Generate Prisma client
  console.log('🗄️ Generating Prisma client...')
  execSync('npx prisma generate', { stdio: 'inherit' })

  console.log('✅ Build completed successfully!')
} catch (error) {
  console.error('❌ Build failed:', error.message)
  process.exit(1)
}
