import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors";
import { CreateProviderInput, UpdateProviderInput } from "./providers.schema";
import * as registry from "./registry";

export async function listActiveProviders() {
  return prisma.provider.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
}

export async function listAllProviders() {
  return prisma.provider.findMany({ orderBy: { name: "asc" } });
}

export async function createProvider(input: CreateProviderInput) {
  const existing = await prisma.provider.findUnique({ where: { slug: input.slug } });
  if (existing) throw AppError.conflict(`A provider with slug "${input.slug}" already exists`);
  return prisma.provider.create({ data: input });
}

export async function updateProvider(id: string, input: UpdateProviderInput) {
  const existing = await prisma.provider.findUnique({ where: { id } });
  if (!existing) throw AppError.notFound("Provider not found");
  return prisma.provider.update({ where: { id }, data: input });
}

export async function resolveUrl(url: string) {
  return registry.resolve(url);
}

export async function searchProvider(
  providerSlug: string,
  query: string,
  filters?: { category?: string; brand?: string; priceMin?: number; priceMax?: number; page?: number }
) {
  return registry.search(providerSlug, query, filters);
}
