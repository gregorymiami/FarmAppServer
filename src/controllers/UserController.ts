import express from 'express';
import bcrypt from 'bcrypt';
import { createToken } from '../utils/TokenUtils';
import { TokenData } from '../interfaces/TokenData';
import { TokenPayload } from '../interfaces/TokenPayload';
import redis from 'redis';
import ValidationHandler from '../middleware/ValidationHandler'
import AuthHandler from '../middleware/AuthHandler';
import { IsString, IsAlphanumeric, IsEmail, IsNotEmpty } from 'class-validator';
import { getRepository } from 'typeorm';
import User from '../models/User';
import { AppRole } from '../models/User';
import HttpException from '../exceptions/HttpException'

const salt = 10;

class RegisterUserDto {
  @IsString()
  @IsAlphanumeric()
  @IsNotEmpty()
  public username: string;

  @IsString()
  @IsNotEmpty()
  public password: string;

  @IsString()
  @IsEmail()
  @IsNotEmpty()
  public email: string;
}

class LoginUserDto {
  @IsString()
  @IsNotEmpty()
  public password: string;

  @IsString()
  @IsEmail()
  @IsNotEmpty()
  public email: string;
}

class UserController {
  public path = '/users';
  public router = express.Router();
  private redisClient: redis.RedisClient;
  private authHandler: AuthHandler;
  private userRepository = getRepository(User);

  constructor(redisClient: redis.RedisClient, authHandler: AuthHandler) {
    this.redisClient = redisClient;
    this.authHandler = authHandler;
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.post('/users/register', ValidationHandler(RegisterUserDto), this.registerUser);
    this.router.post('/users/login', ValidationHandler(LoginUserDto), this.loginUser);
    this.router.get('/users/logout', this.authHandler.handleAuthentication, this.logoutUser);
  }

  registerUser = (request: express.Request, response: express.Response, next: express.NextFunction) => {
    const body: RegisterUserDto = request.body;
    bcrypt.hash(body.password, salt)
    .then(async encrypted_password => {
      let user: User = this.userRepository.create({
          userName: body.username,
          password: encrypted_password,
          email: body.email.toLowerCase(),
          emailVerified: false,
          role: AppRole.EXTERNAL,
      });
      await this.userRepository.save(user);
      return user;
    }).then(saved_user => {
      saved_user.password = "";
      response.status(200).json(saved_user);
    }).catch(err => {
      next(new HttpException(400, `User registration has failed: ${JSON.stringify(err)}.`));
      return;
    });
  }

  loginUser = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    let user: User;
    let tokenData: TokenData;
    let body: LoginUserDto = req.body;

    this.userRepository.findOne({ where: { email: body.email.toLowerCase()} }).then(result => {
      if (!result) {
        console.log(`No user with email ${body.email} found in database.`);
        throw `The email or password is incorrect.`;
      }
      user = result;
      return bcrypt.compare(body.password, user.password);
    }).then(result => {
      if (!result) {
        console.log(`encrypted password check failed`);
        throw "email or password is incorrect.";
      }

      let payload: TokenPayload = { userIdentifier: user.identifier };
      tokenData = createToken(payload);
      return this.redisClient.set(tokenData.token, user.identifier);
    }).then(redis_set_result => {
      if (!redis_set_result) {
        console.log(`Could not set token in redis.`);
        throw "An error occured during authentication. Please try again later.";
      }
      
      user.password = "";
      res.setHeader('Set-Cookie', [this.createCookie(tokenData)]);
      res.status(200).json({user: user});
    }).catch(err => {
      console.log(`Login user error: ${err}`);
      next(new HttpException(400, `Login user error: ${String(err)}`));
      return;
    });
  };

  logoutUser = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    let userToken = res.locals["token"];
    this.redisClient.del(userToken);
    res.setHeader('Set-Cookie', ['Authorization=;Max-age=0']);
    res.status(200).send({"response": "logout successful."});
  };

  private createCookie = (tokenData: TokenData) => {
    return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn}`;
  }
}

export default UserController;