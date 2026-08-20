import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors";
import { AuthUser } from "../../middleware/auth";
import { CreateReservationInput, ListReservationsQuery } from "./reservations.schema";

const RESERVATION_INCLUDE = {
  provider: true,
  reservedByUser: { select: { id: true, name: true } },
  order: { select: { id: true, reference: true, status: true } },
} as const;

async function requireHubId(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { hubId: true } });
  if (!user?.hubId) throw AppError.badRequest("Set your hub before reserving products (see /me/hub).");
  return user.hubId;
}

export async function createReservation(user: AuthUser, input: CreateReservationInput) {
  const hubId = await requireHubId(user.id);
  return prisma.reservation.create({
    data: { ...input, hubId, reservedByUserId: user.id },
    include: RESERVATION_INCLUDE,
  });
}

export async function listReservations(user: AuthUser, query: ListReservationsQuery) {
  const hubId = await requireHubId(user.id);
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const where = { hubId, status: query.status };

  const [items, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: RESERVATION_INCLUDE,
    }),
    prisma.reservation.count({ where }),
  ]);

  return { items, total, page, limit };
}

export async function deleteReservation(user: AuthUser, id: string) {
  const hubId = await requireHubId(user.id);
  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation || reservation.hubId !== hubId) throw AppError.notFound("Reservation not found");
  if (reservation.status === "CONVERTED") {
    throw AppError.conflict("Cannot remove a reservation that already became an order");
  }
  await prisma.reservation.delete({ where: { id } });
}
