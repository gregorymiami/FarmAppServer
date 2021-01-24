import * as express from 'express';

const loggerMiddleware = (request: express.Request, response: express.Response, next) => {
  console.log(`${request.method} ${response.path}`);
  next();
}

const app = express();

app.get('/', (request, response) => {
  console.log("get called");
  response.send('FarmApp Get');
});

app.listen(5000);