import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function addSubhamAdmin() {
  console.log("🌸 Adding 'subham' as an AdminUser...");

  // Get current admin user to reuse password hash or hash NakundaMaa@2026
  const existingAdmin = await prisma.adminUser.findUnique({
    where: { username: "admin" }
  });

  const defaultPassword = process.env.ADMIN_DEFAULT_PASS || "NakundaMaa@2026";
  const passwordHash = existingAdmin?.passwordHash || (await bcrypt.hash(defaultPassword, 10));

  const subhamAdmin = await prisma.adminUser.upsert({
    where: { username: "subham" },
    update: {
      passwordHash,
      name: "Subham Ghorui (প্রধান অ্যাডমিন)",
      role: "SUPER_ADMIN",
    },
    create: {
      username: "subham",
      passwordHash,
      name: "Subham Ghorui (প্রধান অ্যাডমিন)",
      role: "SUPER_ADMIN",
    },
  });

  console.log(`✅ Admin user created/updated successfully:`);
  console.log(`- Username: ${subhamAdmin.username}`);
  console.log(`- Name: ${subhamAdmin.name}`);
  console.log(`- Role: ${subhamAdmin.role}`);
  console.log(`- Password: Same as admin password (${defaultPassword})`);

  const allAdmins = await prisma.adminUser.findMany();
  console.log("\nAll Admins in database:");
  for (const a of allAdmins) {
    console.log(`• ID: ${a.id} | Username: "${a.username}" | Name: "${a.name}" | Role: ${a.role}`);
  }
}

addSubhamAdmin().catch(console.error).finally(() => prisma.$disconnect());
