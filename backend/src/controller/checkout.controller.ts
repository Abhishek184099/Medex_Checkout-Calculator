import type { Request, Response } from "express";
import { presentQuote } from "../presenters/checkout.presenter";
import type { CheckoutService } from "../service/checkout.service";
import type { CheckoutRequest } from "../validation/checkout.schema";

export class CheckoutController {
  constructor(private readonly checkout: CheckoutService) {}

  quote = async (req: Request, res: Response) => {
    const quote = await this.checkout.quote(req.body as CheckoutRequest);
    res.json(presentQuote(quote));
  };

  placeOrder = async (req: Request, res: Response) => {
    const order = await this.checkout.placeOrder(req.body as CheckoutRequest);
    res.status(201).json(order);
  };
}