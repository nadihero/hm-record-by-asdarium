import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'hm_record',
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Migrating image paths...');

  const result = await prisma.$executeRaw`
    UPDATE hm_records 
    SET fotoPath = REPLACE(fotoPath, '/uploads/', '/api/uploads/')
    WHERE fotoPath LIKE '/uploads/%' AND fotoPath NOT LIKE '/api/uploads/%'
  `;

  console.log(`Updated ${result} records to use API path`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
