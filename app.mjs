import express from 'express';
import expressLayouts from 'express-ejs-layouts';
import { pinoHttp } from 'pino-http';
import blogSettingsRouter from './routes/blogSettings.mjs';
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

app.use(blogSettingsRouter);
app.use(adminRouter);
app.use(userRouter);

export default app;
