import express from 'express';
import expressLayouts from 'express-ejs-layouts';
import { pinoHttp } from 'pino-http';
import logger from './lib/logger.mjs';
import db from './lib/db.mjs';
import blogSettingsRouter from './routes/blogSettings.mjs';
import adminRouter from './routes/admin.mjs';

const app = express();
const port = 3000;

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

app.get('/', async (req, res) => {
  await db.run('SELECT * FROM  blogSettings;');
  res.render('home', { title: 'Home Page' });
});

app.listen(port, () => {
  logger.info(`App listening on port ${port}`);
});
