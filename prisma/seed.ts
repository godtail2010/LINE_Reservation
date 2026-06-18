import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required. Set it to your PostgreSQL connection string.');
}

const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // 1. Clear existing data
  await prisma.booking.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.staff.deleteMany({});
  await prisma.setting.deleteMany({});

  // 2. Insert Settings
  const settings = [
    { key: 'salon_name', value: 'AURA Salon & Spa' },
    { key: 'salon_hours', value: '10:00 - 20:00' },
    { key: 'salon_address', value: '東京都渋谷区神宮前 1-2-3' },
    { key: 'salon_phone', value: '03-1234-5678' },
    { key: 'salon_description', value: '完全個室のプライベート空間で、あなただけの極上のサロンタイムを提供します。' },
  ];

  for (const s of settings) {
    await prisma.setting.create({ data: s });
  }
  console.log('Settings seeded.');

  // 3. Insert Services
  const services = [
    {
      name: 'ヘアカット (デザインカット)',
      price: 5500,
      duration: 60,
      description: 'シャンプー・ブロー込。お客様の骨格や髪質に合わせた、再現性の高いカットを提案します。',
    },
    {
      name: 'カット ＋ プレミアムカラー',
      price: 12000,
      duration: 120,
      description: 'ダメージを最小限に抑え、透明感と艶のあるカラーを実現。トリートメント配合。',
    },
    {
      name: 'カット ＋ デザインパーマ',
      price: 13500,
      duration: 120,
      description: 'ふんわりナチュラルなパーマから、立体感のあるデザインパーマまで幅広く対応します。',
    },
    {
      name: 'プレミアム超音波トリートメント',
      price: 4500,
      duration: 30,
      description: '超音波アイロンを使用して髪の深部まで栄養を浸透させ、なめらかな指通りに仕上げます。',
    },
    {
      name: 'オーガニックスカルプヘッドスパ',
      price: 6000,
      duration: 45,
      description: '厳選されたオーガニッククレイを使用し、頭皮の汚れを落としながらコリをほぐします。',
    },
  ];

  for (const svc of services) {
    await prisma.service.create({ data: svc });
  }
  console.log('Services seeded.');

  // 4. Insert Staff
  const staffMembers = [
    {
      name: 'KEN (ケン)',
      role: '代表 / トップスタイリスト',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop',
      workingDays: '1,2,3,4,5', // Mon-Fri
    },
    {
      name: 'YUKI (ユキ)',
      role: 'スタイリスト',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256&auto=format&fit=crop',
      workingDays: '1,3,4,5,6', // Mon, Wed, Thu, Fri, Sat
    },
    {
      name: 'TAKUMI (タクミ)',
      role: 'ジュニアスタイリスト',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop',
      workingDays: '2,3,4,5,6', // Tue-Sat
    },
  ];

  for (const st of staffMembers) {
    await prisma.staff.create({ data: st });
  }
  console.log('Staff seeded.');

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
