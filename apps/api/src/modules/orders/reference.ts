import { prisma } from "../../lib/prisma";

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid ambiguity

function randomCode(length = 4): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return code;
}

export async function generateUniqueReference(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const reference = `KY-${randomCode()}`;
    const existing = await prisma.order.findUnique({ where: { reference } });
    if (!existing) return reference;
  }
  throw new Error("Could not generate a unique order reference after 10 attempts");
}
