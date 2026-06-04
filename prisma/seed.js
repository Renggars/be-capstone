import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // ── Users ────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@capstone.com" },
    update: {},
    create: {
      name: "Administrator",
      email: "admin@capstone.com",
      password: adminPassword,
      age: 30,
      gender: "MALE",
      role: "ADMIN",
    },
  });
  console.log(`✅ Admin user seeded: ${admin.email}`);

  const userPassword = await bcrypt.hash("user1234", 10);
  const user = await prisma.user.upsert({
    where: { email: "user@capstone.com" },
    update: {},
    create: {
      name: "Test User",
      email: "user@capstone.com",
      password: userPassword,
      age: 25,
      gender: "FEMALE",
      role: "USER",
    },
  });
  console.log(`✅ Test user seeded: ${user.email}`);

  // ── Badges ───────────────────────────────────────────────
  const badges = [
    {
      name: "Pemula Mindful",
      description: "Selesaikan check-in pertamamu!",
      iconUrl: null,
      criteria: "Lakukan 1x daily check-in",
    },
    {
      name: "Konsisten 7 Hari",
      description: "Check-in 7 hari berturut-turut.",
      iconUrl: null,
      criteria: "Streak check-in 7 hari berturut",
    },
    {
      name: "Tidur Sehat",
      description: "Catat tidur ≥ 7 jam selama 5 hari.",
      iconUrl: null,
      criteria: "waktu_tidur >= 7 dalam 5 checkins terakhir",
    },
    {
      name: "Aktif Bergerak",
      description: "Pilih tingkat olahraga Rutin selama 3 hari.",
      iconUrl: null,
      criteria: "tingkat_olahraga = Rutin dalam 3 checkins berturut",
    },
    {
      name: "Jiwa Sosial",
      description: "Raih skor interaksi sosial 10 sebanyak 3 kali.",
      iconUrl: null,
      criteria: "interaksi_sosial = 10 dalam 3 checkins",
    },
    {
      name: "Penjelajah Grup",
      description: "Bergabung ke grup pertamamu.",
      iconUrl: null,
      criteria: "Bergabung ke minimal 1 grup",
    },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: {},
      create: badge,
    });
  }
  console.log(`✅ ${badges.length} badges seeded`);

  // ── Sample Groups ────────────────────────────────────────
  const groups = [
    {
      name: "Ruang Tenang",
      description:
        "Komunitas untuk berdiskusi dan berbagi tips menjaga ketenangan pikiran sehari-hari.",
      category: "Mindfulness",
      isPublic: true,
      inviteCode: null,
    },
    {
      name: "Tidur Nyenyak",
      description: "Grup khusus membahas cara meningkatkan kualitas tidur dan mengatasi insomnia.",
      category: "Sleep",
      isPublic: true,
      inviteCode: null,
    },
    {
      name: "Inner Circle Healing",
      description: "Grup privat untuk sesi healing & sharing eksklusif bersama fasilitator.",
      category: "Anxiety",
      isPublic: false,
      inviteCode: "HEAL-2025",
    },
  ];

  for (const group of groups) {
    const existingGroup = await prisma.group.findFirst({
      where: { name: group.name },
    });

    if (!existingGroup) {
      await prisma.group.create({
        data: group,
      });
      console.log(`✅ Sample group seeded: ${group.name}`);
    } else {
      console.log(`ℹ️ Sample group already exists: ${group.name}`);
    }
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(" Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
