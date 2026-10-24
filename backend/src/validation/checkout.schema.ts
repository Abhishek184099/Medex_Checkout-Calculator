import { z } from "zod";

export const checkoutSchema = z.object({
  lines: z
    .array(
      z.object({
        serviceId: z.string().min(1),
        quantity: z.number().int().min(1).max(20),
      })
    )
    .min(1, "Add at least one service."),
  couponCodes: z.array(z.string()).max(10).default([]),
  customerId: z.string().min(1).nullable().default(null),
  at: z
    .iso
    .datetime({ offset: true })
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  expectedCouponCodes: z.array(z.string()).optional(),
});

export type CheckoutRequest = z.output<typeof checkoutSchema>;