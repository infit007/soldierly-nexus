import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

const sampleUsers = [
  {
    username: 'john.smith',
    email: 'john.smith@army.mil',
    password: 'password123',
    role: 'USER' as const
  },
  {
    username: 'sarah.johnson',
    email: 'sarah.johnson@army.mil',
    password: 'password123',
    role: 'USER' as const
  },
  {
    username: 'michael.brown',
    email: 'michael.brown@army.mil',
    password: 'password123',
    role: 'USER' as const
  },
  {
    username: 'emily.davis',
    email: 'emily.davis@army.mil',
    password: 'password123',
    role: 'USER' as const
  },
  {
    username: 'david.wilson',
    email: 'david.wilson@army.mil',
    password: 'password123',
    role: 'USER' as const
  },
  {
    username: 'lisa.miller',
    email: 'lisa.miller@army.mil',
    password: 'password123',
    role: 'USER' as const
  },
  {
    username: 'james.taylor',
    email: 'james.taylor@army.mil',
    password: 'password123',
    role: 'USER' as const
  },
  {
    username: 'jennifer.anderson',
    email: 'jennifer.anderson@army.mil',
    password: 'password123',
    role: 'USER' as const
  },
  {
    username: 'robert.thomas',
    email: 'robert.thomas@army.mil',
    password: 'password123',
    role: 'USER' as const
  },
  {
    username: 'amanda.jackson',
    email: 'amanda.jackson@army.mil',
    password: 'password123',
    role: 'USER' as const
  },
  {
    username: 'william.white',
    email: 'william.white@army.mil',
    password: 'password123',
    role: 'USER' as const
  },
  {
    username: 'jessica.harris',
    email: 'jessica.harris@army.mil',
    password: 'password123',
    role: 'USER' as const
  },
  {
    username: 'christopher.martin',
    email: 'christopher.martin@army.mil',
    password: 'password123',
    role: 'USER' as const
  },
  {
    username: 'ashley.thompson',
    email: 'ashley.thompson@army.mil',
    password: 'password123',
    role: 'USER' as const
  },
  {
    username: 'daniel.garcia',
    email: 'daniel.garcia@army.mil',
    password: 'password123',
    role: 'USER' as const
  },
  {
    username: 'stephanie.martinez',
    email: 'stephanie.martinez@army.mil',
    password: 'password123',
    role: 'USER' as const
  },
  {
    username: 'matthew.robinson',
    email: 'matthew.robinson@army.mil',
    password: 'password123',
    role: 'USER' as const
  },
  {
    username: 'nicole.clark',
    email: 'nicole.clark@army.mil',
    password: 'password123',
    role: 'USER' as const
  },
  {
    username: 'kevin.rodriguez',
    email: 'kevin.rodriguez@army.mil',
    password: 'password123',
    role: 'USER' as const
  },
  {
    username: 'laura.lewis',
    email: 'laura.lewis@army.mil',
    password: 'password123',
    role: 'USER' as const
  },
  {
    username: 'admin.user',
    email: 'admin@army.mil',
    password: 'admin123',
    role: 'ADMIN' as const
  }
]

async function main() {
  console.log('🌱 Starting database seed...')
  
  // Clear existing data in FK-safe order
  console.log('🗑️ Clearing existing data (requests -> users)...')
  await prisma.request.deleteMany({})
  await prisma.user.deleteMany({})
  
  // Create users
  console.log('👥 Creating sample users...')
  const now = new Date()
  for (let i = 0; i < sampleUsers.length; i++) {
    const userData = sampleUsers[i]
    const hashedPassword = await bcrypt.hash(userData.password, 10)
    // Spread user createdAt dates across the last 12 months
    const monthOffset = 11 - (i % 12)
    const createdAt = new Date(now.getFullYear(), now.getMonth() - monthOffset, 10 + (i % 15))

    await prisma.user.create({
      data: {
        username: userData.username,
        email: userData.email,
        passwordHash: hashedPassword,
        role: userData.role,
        // Assign a deterministic service number like ARMY0001
        serviceNumber: `ARMY${String(i + 1).padStart(4, '0')}`,
        createdAt
      }
    })
    
    console.log(`✅ Created user: ${userData.username} (${userData.role})`)
  }

  // Ensure a manager account exists
  const managerEmail = 'manager@army.mil'
  const existingManager = await prisma.user.findUnique({ where: { email: managerEmail } })
  if (!existingManager) {
    const managerHash = await bcrypt.hash('manager123', 10)
    await prisma.user.create({
      data: {
        username: 'manager.user',
        email: managerEmail,
        passwordHash: managerHash,
        role: 'MANAGER',
        serviceNumber: 'ARMY9999',
        createdAt: new Date()
      }
    })
    console.log('✅ Created manager: manager@army.mil / manager123')
  }

  // Seed requests for the last 6 months across types
  console.log('📝 Seeding historical requests...')
  const users = await prisma.user.findMany({ select: { id: true } })
  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
  const types = ['LEAVE','OUTPASS','SALARY','PROFILE_UPDATE'] as const
  const statuses = ['PENDING','APPROVED','REJECTED'] as const
  const now2 = new Date()
  for (let m = 5; m >= 0; m--) {
    const monthBase = new Date(now2.getFullYear(), now2.getMonth() - m, 5)
    for (let k = 0; k < 8; k++) {
      const type = types[(m + k) % types.length]
      const status = statuses[(m + k) % statuses.length]
      const requesterId = pick(users).id
      const createdAt = new Date(monthBase.getFullYear(), monthBase.getMonth(), 5 + (k % 20))
      const data: any = { userId: requesterId }
      if (type === 'LEAVE') data.leave = { days: 1 + (k % 5), reason: 'Seeded leave' }
      if (type === 'OUTPASS') data.outpass = { hours: 2 + (k % 6), purpose: 'Seeded outpass' }
      if (type === 'SALARY') data.salary = { basic: 5000 + k * 100, bonus: 100 + m * 25 }
      if (type === 'PROFILE_UPDATE') { data.section = 'personal'; data.data = { nickname: `Seed${m}${k}` } }
      await prisma.request.create({ data: { type, data, status, requesterId, createdAt } })
    }
  }
  
  console.log('🎉 Database seeding completed!')
  console.log(`📊 Total users created: ${sampleUsers.length}`)
  console.log('🔑 Admin credentials: admin@army.mil / admin123')
  console.log('🔑 User credentials: any email / password123')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
