import type { Request, Response } from "express";
import type { CatalogService } from "../service/catalog.service";

export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  list = async (_req: Request, res: Response) => {
    res.json({ services: await this.catalog.list() });
  };
}