import { PrismaClient } from '../generated/prisma/index.js'

const TEST_EMAIL = 'e2e@example.com'

async function globalSetup() {
  const prisma = new PrismaClient()
  try {
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } })
  } finally {
    await prisma.$disconnect()
  }
}

export default globalSetup
