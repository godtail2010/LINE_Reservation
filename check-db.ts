import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

config({ path: '.env' });
config({ path: '.env.local', override: true });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required. Set it to your PostgreSQL connection string.');
}

const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('=== データベース状態確認 ===\n');

  const services = await prisma.service.findMany();
  console.log(`Services: ${services.length}件`);
  services.forEach(s => {
    console.log(`  - ${s.name} (isActive: ${s.isActive})`);
  });

  const staff = await prisma.staff.findMany();
  console.log(`\nStaff: ${staff.length}件`);
  staff.forEach(s => {
    console.log(`  - ${s.name} (isActive: ${s.isActive})`);
  });

  const activeServices = await prisma.service.findMany({ where: { isActive: true } });
  const activeStaff = await prisma.staff.findMany({ where: { isActive: true } });
  
  console.log(`\n=== APIで取得されるデータ ===`);
  console.log(`Active Services: ${activeServices.length}件`);
  console.log(`Active Staff: ${activeStaff.length}件`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
