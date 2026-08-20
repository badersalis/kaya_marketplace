import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors";
import { haversineKm } from "../../lib/haversine";
import { env } from "../../config/env";
import { CreateHubInput, UpdateHubInput } from "./hubs.schema";

export async function listActiveHubs() {
  return prisma.hub.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
}

export async function listAllHubs() {
  return prisma.hub.findMany({ orderBy: { name: "asc" } });
}

export async function createHub(input: CreateHubInput) {
  return prisma.hub.create({ data: input });
}

export async function updateHub(id: string, input: UpdateHubInput) {
  const existing = await prisma.hub.findUnique({ where: { id } });
  if (!existing) throw AppError.notFound("Hub not found");
  return prisma.hub.update({ where: { id }, data: input });
}

/** Nearest active hub to a point, within HUB_MATCH_RADIUS_KM. Null if none qualifies. */
export async function findNearestHub(point: { lat: number; lng: number }) {
  const hubs = await listActiveHubs();
  let nearest: { hub: (typeof hubs)[number]; distanceKm: number } | null = null;

  for (const hub of hubs) {
    const distanceKm = haversineKm(point, { lat: hub.latitude, lng: hub.longitude });
    if (!nearest || distanceKm < nearest.distanceKm) {
      nearest = { hub, distanceKm };
    }
  }

  if (!nearest || nearest.distanceKm > env.HUB_MATCH_RADIUS_KM) return null;
  return nearest;
}
