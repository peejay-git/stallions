import { PrismaClient } from '@prisma/client'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Handle Prisma initialization with better error handling
let prisma: PrismaClient

try {
  if (process.env.NODE_ENV === 'production') {
    // In production, create a new instance each time (proper connection pooling)
    prisma = new PrismaClient()
  } else {
    // In development, reuse the existing instance if available
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = new PrismaClient({
        log: ['query', 'error', 'warn'],
      })
    }
    prisma = globalForPrisma.prisma
  }
} catch (error) {
  console.error('Failed to initialize Prisma client:', error)
  // Provide a fallback to prevent crashes
  // @ts-ignore - Emergency fallback
  prisma = {
    $connect: () => Promise.resolve(),
    $disconnect: () => Promise.resolve(),
  } as PrismaClient
}

export { prisma }
export default prisma 