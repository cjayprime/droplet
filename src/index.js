import server from './server';

import { Notify } from './shared';

try {
  server.start();
} catch (e) {
  Notify.error(e);
}

if (process.env.NODE_ENV === 'production') {
  // console.log = () => null;
}
