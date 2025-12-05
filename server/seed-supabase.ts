import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcrypt'
import { randomBytes } from 'crypto'

const supabaseUrl = process.env.DATABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing DATABASE_URL or SUPABASE_SERVICE_KEY in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Generate a CUID-like ID
function generateId(): string {
  const timestamp = Date.now().toString(36)
  const random = randomBytes(6).toString('hex')
  return `${timestamp}${random}`
}

async function main() {
  console.log('🌱 Starting Supabase database seed...')
  
  // Clear existing data
  console.log('🗑️ Clearing existing data...')
  await supabase.from('requests').delete().neq('id', '')
  await supabase.from('user_profiles').delete().neq('user_id', '')
  await supabase.from('users').delete().neq('id', '')
  
  // Create Admin user
  console.log('👤 Creating admin user...')
  const adminPasswordHash = await bcrypt.hash('admin123', 10)
  const adminId = generateId()
  const { error: adminError } = await supabase
    .from('users')
    .insert({
      id: adminId,
      username: 'admin',
      email: 'admin@army.mil',
      password_hash: adminPasswordHash,
      role: 'ADMIN',
      army_number: 'ARMY-ADMIN-001',
      created_at: new Date().toISOString()
    })
  
  if (adminError) {
    console.error('❌ Error creating admin:', adminError)
  } else {
    console.log('✅ Created admin: admin@army.mil / admin123')
  }
  
  // Create Manager user
  console.log('👤 Creating manager user...')
  const managerPasswordHash = await bcrypt.hash('manager123', 10)
  const managerId = generateId()
  const { error: managerError } = await supabase
    .from('users')
    .insert({
      id: managerId,
      username: 'manager',
      email: 'manager@army.mil',
      password_hash: managerPasswordHash,
      role: 'MANAGER',
      army_number: 'ARMY-MGR-001',
      created_at: new Date().toISOString()
    })
  
  if (managerError) {
    console.error('❌ Error creating manager:', managerError)
  } else {
    console.log('✅ Created manager: manager@army.mil / manager123')
  }
  
  // Create 10 dummy users with profile data
  const dummyUsers = [
    { username: 'john.smith', email: 'john.smith@army.mil', name: 'John Smith', armyNumber: 'ARMY-2024-0001' },
    { username: 'sarah.johnson', email: 'sarah.johnson@army.mil', name: 'Sarah Johnson', armyNumber: 'ARMY-2024-0002' },
    { username: 'michael.brown', email: 'michael.brown@army.mil', name: 'Michael Brown', armyNumber: 'ARMY-2024-0003' },
    { username: 'emily.davis', email: 'emily.davis@army.mil', name: 'Emily Davis', armyNumber: 'ARMY-2024-0004' },
    { username: 'david.wilson', email: 'david.wilson@army.mil', name: 'David Wilson', armyNumber: 'ARMY-2024-0005' },
    { username: 'lisa.miller', email: 'lisa.miller@army.mil', name: 'Lisa Miller', armyNumber: 'ARMY-2024-0006' },
    { username: 'james.taylor', email: 'james.taylor@army.mil', name: 'James Taylor', armyNumber: 'ARMY-2024-0007' },
    { username: 'jennifer.anderson', email: 'jennifer.anderson@army.mil', name: 'Jennifer Anderson', armyNumber: 'ARMY-2024-0008' },
    { username: 'robert.thomas', email: 'robert.thomas@army.mil', name: 'Robert Thomas', armyNumber: 'ARMY-2024-0009' },
    { username: 'amanda.jackson', email: 'amanda.jackson@army.mil', name: 'Amanda Jackson', armyNumber: 'ARMY-2024-0010' }
  ]
  
  console.log('👥 Creating 10 dummy users with profile data...')
  const userPasswordHash = await bcrypt.hash('password123', 10)
  const userIds: string[] = []
  
  for (let i = 0; i < dummyUsers.length; i++) {
    const userData = dummyUsers[i]
    const userId = generateId()
    
    // Create user
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        username: userData.username,
        email: userData.email,
        password_hash: userPasswordHash,
        role: 'USER',
        army_number: userData.armyNumber,
        created_at: new Date(Date.now() - (i * 30 * 24 * 60 * 60 * 1000)).toISOString() // Spread across last 10 months
      })
    
    if (userError) {
      console.error(`❌ Error creating user ${userData.username}:`, userError)
      continue
    }
    
    // Create profile with sample data
    const profileData = {
      personal_details: {
        fullName: userData.name,
        dateOfBirth: `198${5 + i}-${String(1 + (i % 12)).padStart(2, '0')}-${String(1 + (i % 28)).padStart(2, '0')}`,
        gender: i % 2 === 0 ? 'Male' : 'Female',
        bloodGroup: ['A+', 'B+', 'O+', 'AB+'][i % 4],
        phoneNumber: `+1-555-${String(1000 + i).padStart(4, '0')}`,
        address: `${100 + i} Main Street, City, State ${10000 + i}`
      },
      family: {
        maritalStatus: i < 5 ? 'Single' : 'Married',
        spouseName: i < 5 ? null : `Spouse ${userData.name}`,
        children: i < 5 ? [] : [{ name: `Child ${i - 4}`, age: 5 + (i % 10) }],
        emergencyContact: {
          name: `Emergency Contact ${i}`,
          relationship: 'Parent',
          phone: `+1-555-${String(2000 + i).padStart(4, '0')}`
        }
      },
      education: {
        highestQualification: ['High School', 'Bachelor', 'Master', 'PhD'][i % 4],
        institution: `University ${i + 1}`,
        yearOfGraduation: 2010 + (i % 10),
        specialization: ['Engineering', 'Science', 'Arts', 'Commerce'][i % 4]
      },
      medical: {
        height: `${170 + (i % 20)} cm`,
        weight: `${65 + (i % 15)} kg`,
        allergies: i % 3 === 0 ? ['Peanuts', 'Dust'] : [],
        medications: i % 4 === 0 ? ['Vitamin D'] : [],
        lastMedicalCheckup: new Date(Date.now() - (i * 30 * 24 * 60 * 60 * 1000)).toISOString()
      },
      others: {
        hobbies: ['Reading', 'Sports', 'Music'][i % 3],
        languages: ['English', 'Spanish', 'French'][i % 3],
        skills: ['Leadership', 'Communication', 'Technical'][i % 3]
      },
      leave: {
        totalLeaveDays: 30,
        usedLeaveDays: 5 + (i % 10),
        pendingRequests: i % 3 === 0 ? [{ days: 3, reason: 'Family event' }] : []
      },
      salary: {
        basicPay: 50000 + (i * 5000),
        allowances: 10000 + (i * 1000),
        deductions: 5000 + (i * 500),
        netSalary: 55000 + (i * 5500)
      }
    }
    
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        personal_details: profileData.personal_details,
        family: profileData.family,
        education: profileData.education,
        medical: profileData.medical,
        others: profileData.others,
        leave: profileData.leave,
        salary: profileData.salary,
        updated_at: new Date().toISOString()
      })
    
    if (profileError) {
      console.error(`❌ Error creating profile for ${userData.username}:`, profileError)
    } else {
      console.log(`✅ Created user: ${userData.username} (${userData.email}) with profile data`)
      userIds.push(userId)
    }
  }
  
  // Add manager to requesters list
  userIds.push(managerId)
  
  // Create sample requests for dashboard graphs
  console.log('\n📝 Creating sample requests for dashboard graphs...')
  const requestTypes = ['LEAVE', 'OUTPASS', 'SALARY', 'PROFILE_UPDATE']
  const statuses = ['PENDING', 'APPROVED', 'REJECTED']
  
  // Get current date and calculate dates for last 6 months (July to December)
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  // Create requests spread across last 6 months
  let requestCount = 0
  for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
    const targetMonth = currentMonth - monthOffset
    const targetYear = targetMonth < 0 ? currentYear - 1 : currentYear
    const month = targetMonth < 0 ? targetMonth + 12 : targetMonth
    
    // Create multiple requests per month for each type
    for (let typeIndex = 0; typeIndex < requestTypes.length; typeIndex++) {
      const type = requestTypes[typeIndex]
      
      // Create 3-5 requests per type per month with different statuses
      const requestsPerType = 3 + (monthOffset % 3)
      for (let reqIndex = 0; reqIndex < requestsPerType; reqIndex++) {
        const requesterId = userIds.length > 0 ? userIds[reqIndex % userIds.length] : managerId
        const status = statuses[(monthOffset + reqIndex) % statuses.length]
        
        // Create date within the month
        const day = 5 + (reqIndex * 7) % 25
        const createdAt = new Date(targetYear, month, day, 10 + reqIndex, 30)
        const updatedAt = status === 'PENDING' 
          ? createdAt 
          : new Date(createdAt.getTime() + (2 + reqIndex) * 24 * 60 * 60 * 1000)
        
        // Create request data based on type
        let requestData: any = { userId: requesterId }
        let adminRemark = null
        let managerResponse = null
        
        if (type === 'LEAVE') {
          requestData.leave = {
            days: 2 + (reqIndex % 5),
            reason: ['Family emergency', 'Personal leave', 'Medical appointment', 'Vacation', 'Other'][reqIndex % 5],
            startDate: createdAt.toISOString().split('T')[0],
            endDate: new Date(createdAt.getTime() + (2 + reqIndex) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        } else if (type === 'OUTPASS') {
          requestData.outpass = {
            hours: 2 + (reqIndex % 6),
            purpose: ['Personal work', 'Medical visit', 'Family visit', 'Shopping', 'Other'][reqIndex % 5],
            date: createdAt.toISOString().split('T')[0],
            time: `${10 + reqIndex}:00`
          }
        } else if (type === 'SALARY') {
          requestData.salary = {
            basicPay: 50000 + (reqIndex * 2000),
            allowances: 10000 + (reqIndex * 500),
            bonus: reqIndex % 2 === 0 ? 5000 : 0,
            reason: 'Salary adjustment request'
          }
        } else if (type === 'PROFILE_UPDATE') {
          requestData.section = ['personal', 'family', 'education', 'medical', 'others'][reqIndex % 5]
          requestData.data = {
            update: `Updated ${requestData.section} information`,
            reason: 'Profile correction needed'
          }
        }
        
        if (status === 'REJECTED') {
          adminRemark = ['Insufficient documentation', 'Not eligible', 'Policy violation', 'Incomplete information'][reqIndex % 4]
        } else if (status === 'APPROVED') {
          adminRemark = 'Approved as per policy'
        }
        
        if (status === 'REJECTED' && reqIndex % 2 === 0) {
          managerResponse = 'Will resubmit with additional documents'
        }
        
        const { error: requestError } = await supabase
          .from('requests')
          .insert({
            id: generateId(),
            type,
            data: requestData,
            status,
            requester_id: requesterId,
            admin_remark: adminRemark,
            manager_response: managerResponse,
            created_at: createdAt.toISOString(),
            updated_at: updatedAt.toISOString()
          })
        
        if (requestError) {
          console.error(`❌ Error creating ${type} request:`, requestError)
        } else {
          requestCount++
        }
      }
    }
  }
  
  console.log(`✅ Created ${requestCount} sample requests across last 6 months`)
  
  console.log('\n🎉 Database seeding completed!')
  console.log('\n📋 Login Credentials:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🔑 Admin:')
  console.log('   Email: admin@army.mil')
  console.log('   Password: admin123')
  console.log('\n🔑 Manager:')
  console.log('   Email: manager@army.mil')
  console.log('   Password: manager123')
  console.log('\n🔑 Users (any of the 10):')
  console.log('   Email: john.smith@army.mil (or any user email)')
  console.log('   Password: password123')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(() => {
    console.log('\n✨ Seed script completed!')
  })

