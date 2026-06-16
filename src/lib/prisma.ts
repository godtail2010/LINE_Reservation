import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';
import fs from 'fs';

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ||
  (() => {
    let dbPath = process.env.DATABASE_URL || 'file:./dev.db';
    
    // Vercel deployment trick: Vercel serverless environment filesystem is read-only.
    // We copy our seeded dev.db to /tmp/dev.db during function startup to allow write operations.
    if (process.env.VERCEL) {
      const tempDbPath = '/tmp/dev.db';
      const bundledDbPath = path.resolve(process.cwd(), 'dev.db');
      
      try {
        if (!fs.existsSync(tempDbPath) && fs.existsSync(bundledDbPath)) {
          fs.copyFileSync(bundledDbPath, tempDbPath);
          console.log('Successfully copied SQLite database to /tmp/dev.db for writing.');
        }
      } catch (err) {
        console.error('Failed to copy SQLite database to /tmp:', err);
      }
      
      dbPath = 'file:/tmp/dev.db';
    }

    let resolvedUrl = dbPath;
    if (dbPath.startsWith('file:')) {
      const relativePath = dbPath.replace(/^file:/, '');
      // If path is already absolute (like /tmp/dev.db), resolve directly.
      const absoluteDbPath = relativePath.startsWith('/')
        ? relativePath
        : path.resolve(process.cwd(), relativePath);
      resolvedUrl = `file:${absoluteDbPath}`;
    }
    
    const adapter = new PrismaBetterSqlite3({ url: resolvedUrl });
    return new PrismaClient({ adapter });
  })();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
