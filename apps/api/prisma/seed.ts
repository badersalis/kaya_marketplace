import "dotenv/config";
import crypto from "crypto";
import { PrismaClient, OrderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SEED_HUB_NAME = process.env.SEED_HUB_NAME ?? "Abidjan Hub";
const SEED_HUB_CITY = process.env.SEED_HUB_CITY ?? "Abidjan";
const SEED_HUB_COUNTRY = process.env.SEED_HUB_COUNTRY ?? "Côte d'Ivoire";
const SEED_HUB_COUNTRY_CODE = process.env.SEED_HUB_COUNTRY_CODE ?? "CI";
const SEED_HUB_LAT = Number(process.env.SEED_HUB_LAT ?? 5.3599517);
const SEED_HUB_LNG = Number(process.env.SEED_HUB_LNG ?? -4.0082563);
const SEED_HUB_TIMEZONE = process.env.SEED_HUB_TIMEZONE ?? "Africa/Abidjan";
const SEED_HUB_CURRENCY = process.env.SEED_HUB_CURRENCY ?? "XOF";

const SEED_SUPERADMIN_EMAIL = process.env.SEED_SUPERADMIN_EMAIL ?? "admin@kaya.app";
const SEED_SUPERADMIN_PASSWORD = process.env.SEED_SUPERADMIN_PASSWORD ?? "ChangeMe123!";
const SEED_PARTNER_EMAIL = process.env.SEED_PARTNER_EMAIL ?? "partner@kaya.app";
const SEED_PARTNER_PASSWORD = process.env.SEED_PARTNER_PASSWORD ?? "ChangeMe123!";
const SEED_DEMO = process.env.SEED_DEMO === "true";

async function upsertUser(params: {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: "SUPER_ADMIN" | "LOGISTICS_PARTNER";
  hubId?: string;
}) {
  const passwordHash = await bcrypt.hash(params.password, 10);
  return prisma.user.upsert({
    where: { email: params.email },
    update: { name: params.name, phone: params.phone, role: params.role, passwordHash, hubId: params.hubId },
    create: {
      email: params.email,
      name: params.name,
      phone: params.phone,
      role: params.role,
      passwordHash,
      hubId: params.hubId,
    },
  });
}

async function main() {
  console.log("Seeding default hub...");

  const hubData = {
    name: SEED_HUB_NAME,
    city: SEED_HUB_CITY,
    country: SEED_HUB_COUNTRY,
    countryCode: SEED_HUB_COUNTRY_CODE,
    latitude: SEED_HUB_LAT,
    longitude: SEED_HUB_LNG,
    timezone: SEED_HUB_TIMEZONE,
    currency: SEED_HUB_CURRENCY,
    isActive: true,
  };
  const existingHub = await prisma.hub.findFirst({ where: { name: SEED_HUB_NAME } });
  const hub = existingHub
    ? await prisma.hub.update({ where: { id: existingHub.id }, data: hubData })
    : await prisma.hub.create({ data: hubData });

  console.log("Seeding Super Admin and Logistics Partner accounts...");

  const superAdmin = await upsertUser({
    email: SEED_SUPERADMIN_EMAIL,
    password: SEED_SUPERADMIN_PASSWORD,
    name: "Gérant Abidjan",
    phone: "+22500000000",
    role: "SUPER_ADMIN",
    hubId: hub.id,
  });

  const partner = await upsertUser({
    email: SEED_PARTNER_EMAIL,
    password: SEED_PARTNER_PASSWORD,
    name: "Partenaire Niamey",
    phone: "+22700000000",
    role: "LOGISTICS_PARTNER",
  });

  console.log("Seeding provider registry...");

  const jumiaData = {
    name: "Jumia",
    domains: ["jumia.ci", "jumia.com"],
    type: "LOCAL_MARKETPLACE" as const,
    defaultCurrency: "XOF",
    logoUrl: "/images/brand/jumia.svg",
  };
  const jumia = await prisma.provider.upsert({
    where: { slug: "jumia" },
    update: jumiaData,
    create: { ...jumiaData, slug: "jumia", isActive: true },
  });

  const temuData = {
    name: "Temu",
    domains: ["temu.com"],
    type: "INTERNATIONAL" as const,
    defaultCurrency: "USD",
    logoUrl: "/images/brand/temu.svg",
    notes: "Recherche par mot-clé indisponible : leur page de recherche est une application cliente sans contenu statique. Le collage de lien fonctionne toujours.",
  };
  await prisma.provider.upsert({
    where: { slug: "temu" },
    update: temuData,
    create: { ...temuData, slug: "temu", isActive: true },
  });

  const amazonData = {
    name: "Amazon",
    domains: ["amazon.com", "amazon.fr", "amazon.co.uk"],
    type: "INTERNATIONAL" as const,
    defaultCurrency: "USD",
    logoUrl: "/images/brand/amazon.svg",
    notes: "Recherche par mot-clé indisponible : Amazon bloque les requêtes automatisées. Le collage de lien reste possible, mais sans garantie.",
  };
  await prisma.provider.upsert({
    where: { slug: "amazon" },
    update: amazonData,
    create: { ...amazonData, slug: "amazon", isActive: true },
  });

  // Example of adding another store — uncomment to enable AliExpress:
  // await prisma.provider.upsert({
  //   where: { slug: "aliexpress" },
  //   update: {},
  //   create: {
  //     name: "AliExpress",
  //     slug: "aliexpress",
  //     domains: ["aliexpress.com"],
  //     type: "INTERNATIONAL",
  //     defaultCurrency: "USD",
  //     isActive: true,
  //   },
  // });

  if (SEED_DEMO) {
    console.log("Seeding demo orders (SEED_DEMO=true)...");
    await seedDemoOrders(hub.id, superAdmin.id, partner.id, jumia.id);
  }

  console.log("Seed complete.");
}

interface DemoOrder {
  reference: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  destinationCity: string;
  destinationCountry: string;
  productName: string;
  productUrl: string;
  quantity?: number;
  productCost?: number;
  currency?: string;
  logisticsCost?: number;
  platformFee?: number;
  customerQuoteTotal?: number;
  paymentStatus?: "UNPAID" | "PAID";
  status: OrderStatus;
  withLogisticsQuote?: boolean;
  assignPartner?: boolean;
}

async function seedDemoOrders(hubId: string, superAdminId: string, partnerId: string, jumiaId: string) {
  const demoOrders: DemoOrder[] = [
    {
      reference: "KY-DEM1",
      customerName: "Aïcha Moussa",
      customerPhone: "+22790000001",
      destinationCity: "Niamey",
      destinationCountry: "Niger",
      productName: "Enceinte Bluetooth portable",
      productUrl: "https://www.jumia.ci/enceinte-bluetooth-portable.html",
      status: "QUOTING",
    },
    {
      reference: "KY-DEM2",
      customerName: "Ibrahim Souley",
      customerPhone: "+22790000002",
      destinationCity: "Niamey",
      destinationCountry: "Niger",
      productName: "Casque audio sans fil",
      productUrl: "https://www.jumia.ci/casque-audio-sans-fil.html",
      productCost: 25000,
      currency: "XOF",
      status: "QUOTED",
      withLogisticsQuote: true,
    },
    {
      reference: "KY-DEM3",
      customerName: "Fatouma Idé",
      customerPhone: "+22790000003",
      customerEmail: "fatouma.ide@example.com",
      destinationCity: "Niamey",
      destinationCountry: "Niger",
      productName: "Montre connectée",
      productUrl: "https://www.jumia.ci/montre-connectee.html",
      productCost: 15000,
      currency: "XOF",
      logisticsCost: 5000,
      platformFee: 1800,
      customerQuoteTotal: 21800,
      status: "QUOTE_SENT",
      withLogisticsQuote: true,
    },
    {
      reference: "KY-DEM4",
      customerName: "Boubacar Hassane",
      customerPhone: "+22790000004",
      destinationCity: "Niamey",
      destinationCountry: "Niger",
      productName: "Chargeur solaire portable",
      productUrl: "https://www.jumia.ci/chargeur-solaire-portable.html",
      productCost: 17000,
      currency: "XOF",
      logisticsCost: 6000,
      platformFee: 2040,
      customerQuoteTotal: 25040,
      paymentStatus: "PAID",
      status: "PURCHASED",
      withLogisticsQuote: true,
    },
    {
      reference: "KY-DEM5",
      customerName: "Halima Adamou",
      customerPhone: "+22790000005",
      destinationCity: "Niamey",
      destinationCountry: "Niger",
      productName: "Mixeur de cuisine",
      productUrl: "https://www.jumia.ci/mixeur-de-cuisine.html",
      productCost: 30000,
      currency: "XOF",
      logisticsCost: 7000,
      platformFee: 3600,
      customerQuoteTotal: 40600,
      paymentStatus: "PAID",
      status: "CONFIRMED_HUB",
      withLogisticsQuote: true,
      assignPartner: true,
    },
    {
      reference: "KY-DEM6",
      customerName: "Moussa Garba",
      customerPhone: "+22790000006",
      destinationCity: "Niamey",
      destinationCountry: "Niger",
      productName: "Ventilateur USB",
      productUrl: "https://www.jumia.ci/ventilateur-usb.html",
      productCost: 8000,
      currency: "XOF",
      logisticsCost: 4000,
      platformFee: 960,
      customerQuoteTotal: 12960,
      paymentStatus: "PAID",
      status: "IN_TRANSIT",
      withLogisticsQuote: true,
      assignPartner: true,
    },
    {
      reference: "KY-DEM7",
      customerName: "Zeinabou Oumarou",
      customerPhone: "+22790000007",
      destinationCity: "Niamey",
      destinationCountry: "Niger",
      productName: "Lampe solaire",
      productUrl: "https://www.jumia.ci/lampe-solaire.html",
      productCost: 10000,
      currency: "XOF",
      logisticsCost: 4500,
      platformFee: 1200,
      customerQuoteTotal: 15700,
      paymentStatus: "PAID",
      status: "DELIVERED",
      withLogisticsQuote: true,
      assignPartner: true,
    },
  ];

  for (const demo of demoOrders) {
    const existing = await prisma.order.findUnique({ where: { reference: demo.reference } });
    if (existing) continue;

    const order = await prisma.order.create({
      data: {
        reference: demo.reference,
        quoteToken: crypto.randomBytes(24).toString("base64url"),
        hubId,
        customerName: demo.customerName,
        customerPhone: demo.customerPhone,
        customerEmail: demo.customerEmail,
        destinationCity: demo.destinationCity,
        destinationCountry: demo.destinationCountry,
        providerId: jumiaId,
        productName: demo.productName,
        productUrl: demo.productUrl,
        quantity: demo.quantity ?? 1,
        productCost: demo.productCost,
        currency: demo.currency,
        logisticsCost: demo.logisticsCost,
        platformFee: demo.platformFee,
        customerQuoteTotal: demo.customerQuoteTotal,
        paymentStatus: demo.paymentStatus ?? "UNPAID",
        paidAt: demo.paymentStatus === "PAID" ? new Date() : undefined,
        status: demo.status,
        createdByUserId: superAdminId,
        assignedPartnerId: partnerId,
      },
    });

    if (demo.withLogisticsQuote) {
      await prisma.logisticsQuote.create({
        data: {
          orderId: order.id,
          submittedByUserId: partnerId,
          amount: demo.logisticsCost ?? 5000,
          currency: "XOF",
          lineItems: [
            { label: "Transport", amount: (demo.logisticsCost ?? 5000) * 0.7 },
            { label: "Manutention", amount: (demo.logisticsCost ?? 5000) * 0.3 },
          ],
          status: "ACCEPTED",
        },
      });
    }

    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: null,
        toStatus: "INTENT_SUBMITTED",
        changedByUserId: superAdminId,
        note: "Commande de démonstration",
      },
    });

    if (demo.status !== "INTENT_SUBMITTED") {
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: "INTENT_SUBMITTED",
          toStatus: demo.status,
          changedByUserId: superAdminId,
          note: "État initial de démonstration",
        },
      });
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
