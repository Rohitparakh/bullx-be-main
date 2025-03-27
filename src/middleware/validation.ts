import { Request, Response, NextFunction } from "express";
import * as Joi from "joi";
import * as Validation from "express-joi-validation";

export const V = Validation.createValidator({ passError: true });

export const RetrunValidation = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error && error.error && error.value && error.type) {
    return res.status(400).json(error.error.toString().replace("Error: ", ""));
  } else {
    return next(error);
  }
};

export const Validator = {
  Pumpfun: {
    OnlyMint: Joi.object({
      address: Joi.string().min(44).max(44).required(),
    }),
  },
};
