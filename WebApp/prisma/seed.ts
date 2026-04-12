import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await hash("password123", 12);

  await prisma.user.upsert({
    where: { email: "host@guestboard.com" },
    update: {},
    create: {
      email: "host@guestboard.com",
      hashedPassword,
      name: "Demo Host",
    },
  });

  console.log("Seed complete: host@guestboard.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
