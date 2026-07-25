import { PrismaClient } from '../generated/prisma/client';
import * as fs from 'fs';

// {} as any ব্যবহার করে Type validation bypass করুন
const prisma = new PrismaClient({} as any);

async function main(): Promise<void> {
  const fullData = {
    users: await prisma.user.findMany(),
    // আপনার প্রজেক্টের অন্য Model গুলো নিচে যোগ করুন:
    // posts: await prisma.post.findMany(),
    // categories: await prisma.category.findMany(),
  };

  fs.writeFileSync('full_database.json', JSON.stringify(fullData, null, 2));
  console.log('JSON file created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });