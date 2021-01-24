import express, { NextFunction } from 'express';
import bodyParser from 'body-parser';

const loggerMiddleware: express.RequestHandler = (request: express.Request, response: express.Response, next: NextFunction) => {
  console.log(`${request.method} ${request.path}`);
  next();
}
 
const app: express.Application = express();
app.use(bodyParser);
app.use(loggerMiddleware);
 
app.get('/', (request: express.Request, response: express.Response) => {
  response.send('Hello world!');
});

app.post('/', (request: express.Request, response: express.Response) => {
  response.send(request.body);
});
 
app.listen(5000);