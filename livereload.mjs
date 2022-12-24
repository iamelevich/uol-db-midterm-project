import app from './app.mjs';
import logger from './lib/logger.mjs';
import livereload from 'livereload';
import connectLiveReload from 'connect-livereload';

const port = 3000;

const liveReloadServer = livereload.createServer();
liveReloadServer.server.once('connection', () => {
  setTimeout(() => {
    liveReloadServer.refresh('/');
  }, 100);
});

app.use(connectLiveReload());

app.listen(port, () => {
  logger.info(`App listening on port ${port}`);
});
