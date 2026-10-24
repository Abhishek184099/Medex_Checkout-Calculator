import { prisma } from "../config/prisma";
import { presentService } from "../presenters/checkout.presenter";
import { ServiceRepository } from "../repository/service.repository";

export class CatalogService {
  private readonly services = new ServiceRepository(prisma);

  async list() {
    const rows = await this.services.findAll();
    return rows.map(presentService);
  }
}