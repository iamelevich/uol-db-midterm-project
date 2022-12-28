import express from 'express';
import expressLayouts from 'express-ejs-layouts';
import { pinoHttp } from 'pino-http';
import bodyParser from 'body-parser';
import articlesRouter from './routes/articles.mjs';
import blogSettingsRouter from './routes/blogSettings.mjs';
import commentsRouter from './routes/comments.mjs';
import adminRouter from './routes/admin.mjs';
import userRouter from './routes/user.mjs';

const app = express();

// Use Pino as Express logger
app.use(pinoHttp());

// Serve static files
app.use(express.static('public'));

// set the app to use ejs for rendering
app.use(expressLayouts);
app.set('layout', './layouts/full-width');
app.set('view engine', 'ejs');

// parse application/json
app.use(bodyParser.json());

app.use(articlesRouter);
app.use(commentsRouter);
app.use(blogSettingsRouter);
app.use(adminRouter);
app.use(userRouter);

export default app;
