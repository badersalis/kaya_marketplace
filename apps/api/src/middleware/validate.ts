import { NextFunction, Request, Response } from "express";
import { ZodError, ZodType } from "zod";

type Schemas = {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
};

export function validate(schemas: Schemas) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) req.query = schemas.query.parse(req.query) as any;
      if (schemas.params) req.params = schemas.params.parse(req.params) as any;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: { code: "VALIDATION_ERROR", message: "Invalid request", details: err.flatten() },
        });
      }
      next(err);
    }
  };
}
