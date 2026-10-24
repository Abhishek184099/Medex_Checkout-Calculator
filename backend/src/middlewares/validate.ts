import type { RequestHandler } from "express";
import type { z } from "zod";
import { AppError } from "../lib/error";

export function validate(schema: z.ZodType): RequestHandler {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      }));
      return next(new AppError(400, issues[0].message, { issues }));
    }
    req.body = parsed.data;
    next();
  };
}