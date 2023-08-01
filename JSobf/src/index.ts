import express from 'express';
import apiRouter from './routes/Api';
import path from 'path';
import { lol } from './Compiler/CompilerVM';

const app = express();

app.use(express.json({
  limit: "6mb"
}));

app.use('/api', apiRouter);
app.use(express.static(path.resolve(__dirname, '../../client/build')))

app.listen(3000);//sg