import express from 'express';
import bodyParser from 'body-parser';
import redis from 'redis';
import cookieParser from 'cookie-parser';
import UserController from './controllers/UserController';
import HttpErrorHandler from './middleware/HttpErrorHandler';
import AuthHandler from './middleware/AuthHandler';

class App {
  public app: express.Application;
  public port: number;
  private redisClient: redis.RedisClient;
  private authHandler: AuthHandler;

  constructor(port: number, redisClient: redis.RedisClient) {
    this.app = express();
    this.port = port;
    this.redisClient = redisClient;
    this.authHandler = new AuthHandler(this.redisClient);

    this.initializeMiddleware();
    this.initializeControllers();
    this.initializeErrorHandler();
  }

  private initializeMiddleware() {
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(cookieParser());
  }

  private initializeControllers() {
    let userController: UserController = new UserController(this.redisClient, this.authHandler);
    this.app.use('/api', userController.router);
  }

  private initializeErrorHandler() {
    this.app.use(HttpErrorHandler);
  }

  public listen() {
    this.app.listen(this.port, () => {
      console.log(`App listening on the port ${this.port}`);
    });
  }
}

export { App };