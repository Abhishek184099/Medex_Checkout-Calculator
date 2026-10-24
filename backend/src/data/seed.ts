import { readFileSync } from "node:fs";
import path from "node:path";
import { prisma } from "../config/prisma";
import { CouponRepository } from "../repository/coupon.repository";
import { ServiceRepository } from "../repository/service.repository";
import { UserRepository } from "../repository/user.repository";
import { toCouponRow, toServiceRow, type CheckoutData } from "./mapping";

async function seed(): Promise<void> {
  const file = path.resolve(process.cwd(), "src/data/checkout.json");
  const data = JSON.parse(readFileSync(file, "utf8")) as CheckoutData;

  const services = new ServiceRepository(prisma);
  const users = new UserRepository(prisma);
  const coupons = new CouponRepository(prisma);

  for (const s of data.services) await services.upsert(toServiceRow(s));
  for (const c of data.customers) await users.upsert(c.id, c.name, c.ordersCount);
  for (const c of data.coupons) await coupons.upsert(toCouponRow(c));

  console.log(
    `Seeded ${data.services.length} services, ${data.customers.length} customers, ${data.coupons.length} coupons.`
  );
}

seed()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());