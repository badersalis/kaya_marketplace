import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { signToken } from "../../middleware/auth";
import { AppError } from "../../lib/errors";
import { LoginInput } from "./auth.schema";

export function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  hubId?: string | null;
  hub?: { id: string; name: string; city: string; country: string; currency: string } | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    hubId: user.hubId ?? null,
    hub: user.hub ?? null,
  };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { hub: { select: { id: true, name: true, city: true, country: true, currency: true } } },
  });
  if (!user) throw AppError.unauthorized("Invalid email or password");

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw AppError.unauthorized("Invalid email or password");

  const token = signToken({ id: user.id, role: user.role });
  return { token, user: toPublicUser(user) };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { hub: { select: { id: true, name: true, city: true, country: true, currency: true } } },
  });
  if (!user) throw AppError.notFound("User not found");
  return toPublicUser(user);
}
