import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

async function main() {
  console.log('Seeding database...')

  // ユーザーを作成
  const salesUser = await prisma.user.upsert({
    where: { email: 'sales@example.com' },
    update: {},
    create: {
      email: 'sales@example.com',
      name: '山田太郎',
      passwordHash: await hashPassword('password123'),
      department: '営業部',
      role: 'SALES',
    },
  })

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      email: 'manager@example.com',
      name: '鈴木花子',
      passwordHash: await hashPassword('password123'),
      department: '営業部',
      role: 'MANAGER',
    },
  })

  console.log('Created users:', { salesUser: salesUser.email, managerUser: managerUser.email })

  // 顧客を作成
  const customer1 = await prisma.customer.upsert({
    where: { id: 'customer-1' },
    update: {},
    create: {
      id: 'customer-1',
      name: '株式会社ABC',
      address: '東京都渋谷区1-2-3',
      phone: '03-1234-5678',
      contactPerson: '田中一郎',
    },
  })

  const customer2 = await prisma.customer.upsert({
    where: { id: 'customer-2' },
    update: {},
    create: {
      id: 'customer-2',
      name: '有限会社XYZ',
      address: '大阪府大阪市北区4-5-6',
      phone: '06-9876-5432',
      contactPerson: '佐藤次郎',
    },
  })

  const customer3 = await prisma.customer.upsert({
    where: { id: 'customer-3' },
    update: {},
    create: {
      id: 'customer-3',
      name: '合同会社DEF',
      address: '愛知県名古屋市中区7-8-9',
      phone: '052-1111-2222',
      contactPerson: '高橋三郎',
    },
  })

  console.log('Created customers:', { customer1: customer1.name, customer2: customer2.name, customer3: customer3.name })

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
