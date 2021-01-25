import { plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import * as express from 'express';
import HttpException from '../exceptions/HttpException';

const ValidationHandler = <T>(type: any, skipMissingProperties = false): express.RequestHandler => {
  return (req, res, next) => {
    validate(plainToClass(type, req.body), { skipMissingProperties })
    .then((errors: ValidationError[]) => {
      if (errors.length > 0) {
        next(new HttpException(400, `validation error on path ${req.path}: ${JSON.stringify(errors)}`));
      } else {
        next();
      }
    });
  };
}
 
export default ValidationHandler;