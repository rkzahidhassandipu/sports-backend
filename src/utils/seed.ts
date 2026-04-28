// prisma/seed.ts
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create users
  const hash = async (pw: string) => bcrypt.hash(pw, 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@gym.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@gym.com",
      password: await hash("Admin@123456"),
      role: Role.ADMIN,
      emailVerified: true,
      profile: { create: { city: "New York", country: "USA" } },
    },
  });

  const coach = await prisma.user.upsert({
    where: { email: "coach@gym.com" },
    update: {},
    create: {
      name: "Coach Sarah",
      email: "coach@gym.com",
      password: await hash("Coach@123456"),
      role: Role.COACH,
      emailVerified: true,
      profile: { create: { specializations: ["Yoga", "HIIT"], certifications: ["ACE", "NASM"] } },
    },
  });

  const trainer = await prisma.user.upsert({
    where: { email: "trainer@gym.com" },
    update: {},
    create: {
      name: "Trainer Mike",
      email: "trainer@gym.com",
      password: await hash("Trainer@123456"),
      role: Role.TRAINER,
      emailVerified: true,
      profile: { create: { specializations: ["Strength", "Powerlifting"] } },
    },
  });

  const member = await prisma.user.upsert({
    where: { email: "member@gym.com" },
    update: {},
    create: {
      name: "John Member",
      email: "member@gym.com",
      password: await hash("Member@123456"),
      role: Role.MEMBER,
      emailVerified: true,
      profile: { create: { city: "Brooklyn", country: "USA" } },
    },
  });

  // Create sessions
  const sessions = [
    { title: "Morning Yoga Flow", description: "Start your day with mindful movement.", category: "Yoga", level: "Beginner", price: 25, duration: 60, startTime: "07:00", endTime: "08:00", date: new Date(Date.now() + 86400000) },
    { title: "HIIT Blast", description: "High-intensity interval training for max calorie burn.", category: "HIIT", level: "Advanced", price: 30, duration: 45, startTime: "09:00", endTime: "09:45", date: new Date(Date.now() + 172800000) },
    { title: "Strength & Conditioning", description: "Build functional strength and power.", category: "Strength", level: "Intermediate", price: 35, duration: 60, startTime: "11:00", endTime: "12:00", date: new Date(Date.now() + 259200000) },
    { title: "Pilates Core", description: "Strengthen your core with Pilates fundamentals.", category: "Pilates", level: "Beginner", price: 28, duration: 50, startTime: "14:00", endTime: "14:50", date: new Date(Date.now() + 345600000) },
  ];

  for (const s of sessions) {
    await prisma.session.create({ data: { ...s, coachId: coach.id, status: "SCHEDULED", capacity: 12 } });
  }

  // Static content
  await prisma.staticContent.upsert({
    where: { key: "privacy-policy" },
    update: {},
    create: { key: "privacy-policy", title: "Privacy Policy", content: "Your privacy matters to us. This policy explains how we collect and use your data..." },
  });

  await prisma.staticContent.upsert({
    where: { key: "terms-of-service" },
    update: {},
    create: { key: "terms-of-service", title: "Terms of Service", content: "By using our gym management platform, you agree to these terms..." },
  });

  // Blog posts
  await prisma.blogPost.upsert({
    where: { slug: "top-5-benefits-of-hiit-training" },
    update: {},
    create: {
      title: "Top 5 Benefits of HIIT Training",
      slug: "top-5-benefits-of-hiit-training",
      excerpt: "Discover why HIIT is one of the most effective workout methods.",
      content: "High-Intensity Interval Training (HIIT) alternates between intense bursts of activity and short rest periods...",
      authorId: coach.id,
      published: true,
      publishedAt: new Date(),
      tags: ["HIIT", "Fitness", "Cardio"],
      readTime: 5,
    },
  });

  console.log("✅ Seed complete!");
  console.log(`   Admin:   admin@gym.com / Admin@123456`);
  console.log(`   Coach:   coach@gym.com / Coach@123456`);
  console.log(`   Trainer: trainer@gym.com / Trainer@123456`);
  console.log(`   Member:  member@gym.com / Member@123456`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
