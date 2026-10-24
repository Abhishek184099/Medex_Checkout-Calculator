import { Router } from "express";
import { CatalogController } from "../controller/catalog.controller";
import { CheckoutController } from "../controller/checkout.controller";
import type { CatalogService } from "../service/catalog.service";
import type { CheckoutService } from "../service/checkout.service";
import { validate } from "../middlewares/validate";
import { checkoutSchema } from "../validation/checkout.schema";

interface Deps {
  catalog: CatalogService;
  checkout: CheckoutService;
}

export function createRouter({ catalog, checkout }: Deps): Router {
  const router = Router();
  const catalogController = new CatalogController(catalog);
  const checkoutController = new CheckoutController(checkout);

  router.get("/services", catalogController.list);
  router.post("/quote", validate(checkoutSchema), checkoutController.quote);
  router.post("/orders", validate(checkoutSchema), checkoutController.placeOrder);

  return router;
}