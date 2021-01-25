import redis from 'redis';
import 'dotenv/config';
import {
  cleanEnv, str, port
} from 'envalid';
import { App } from './app';
import 'reflect-metadata';
import { createConnection } from 'typeorm';
import config from './ormconfig';

cleanEnv(process.env, {
  APP_PORT: port(),
  REDIS_HOST: str(),
  REDIS_PORT: port(),
  JWT_SECRET: str()
});

const {
  APP_PORT,
  REDIS_HOST,
  REDIS_PORT
} = process.env;

if (!REDIS_PORT || !APP_PORT) {
  process.exit();
}

(async () => {
  try {
    await createConnection(config);
    const redisClient = redis.createClient({port: parseInt(REDIS_PORT), host: REDIS_HOST});
    const app = new App(parseInt(APP_PORT), redisClient);
    app.listen();
  } catch (error) {
    console.log('Error while connecting to the database', error);
    return error;
  }
})();