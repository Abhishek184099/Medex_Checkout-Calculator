import express from "express";
import { errorHandler } from "./middlewares/errorHandler";
import { createRouter } from "./routes";
import { CatalogService } from "./service/catalog.service";
import { CheckoutService } from "./service/checkout.service";

export function createApp() {
  const app = express();
  app.use(express.json());

  app.use(
    "/api",
    createRouter({
      catalog: new CatalogService(),
      checkout: new CheckoutService(),
    })
  );

  app.use(errorHandler);
  return app;
}