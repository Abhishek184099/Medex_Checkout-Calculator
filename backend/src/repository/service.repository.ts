import type { Service } from "@prisma/client";
import type { Db } from "../config/prisma";

export class ServiceRepository {
  constructor(private readonly db: Db) {}

  findAll(): Promise<Service[]> {
    return this.db.service.findMany({ orderBy: { id: "asc" } });
  }

  findByIds(ids: string[]): Promise<Service[]> {
    return this.db.service.findMany({ where: { id: { in: ids } } });
  }

  async upsert(row: Service): Promise<void> {
    const { id, ...data } = row;
    await this.db.service.upsert({ where: { id }, create: row, update: data });
  }
}