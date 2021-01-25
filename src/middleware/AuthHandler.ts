import express, { NextFunction } from 'express';
import HttpException from '../exceptions/HttpException';
import { verifyToken } from '../utils/TokenUtils';
import { TokenPayload } from '../interfaces/TokenPayload';
import redis from 'redis';
import User from '../models/User';
import { getRepository } from 'typeorm';

class AuthHandler {
  private redisClient: redis.RedisClient;
  private userRepository = getRepository(User);

  constructor (redisClient: redis.RedisClient) {
    this.redisClient = redisClient;
  }

  handleAuthentication = (request: express.Request, response: express.Response, next: NextFunction) => {
    const cookies = request.cookies;

    if (cookies && cookies.Authorization) {
      let token = cookies.Authorization;

      try {
        let verificationResult: TokenPayload = verifyToken(token);

        if (!verificationResult) {
          next(new HttpException(400, `authentication error on path ${request.path}. Invalid token.`));
          return;
        }

        this.redisClient.get(token, (error, result) => {
          if (error || !result || result != verificationResult.userIdentifier) {
            next(new HttpException(400, `authentication error on path ${request.path}. Unregistered token.`));
            return;
          }
    
          this.userRepository.findOne({ where: { identifier: verificationResult.userIdentifier} })
          .then(user => {
            if (!user) {
              next(new HttpException(400, `User not found.`));
              return;
            }
            response.locals["token"] = token;
            response.locals["user"] = user;
            next();
            return;
          })
          .catch(err => {
            next(new HttpException(400, `authentication error on path ${request.path}: ${err}.`));
            return;
          });
        });
      } catch (error) {
        next(new HttpException(400, `authentication error on path ${request.path}: ${error}.`));
        return;
      }
    } else {
      next(new HttpException(400, `authentication error on path ${request.path}. No cookies or auth token found.`));
      return;
    }
  }
}

export default AuthHandler;