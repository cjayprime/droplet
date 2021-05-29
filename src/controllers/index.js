import Drop from './Drop';
import Analytics from './Analytics';
import Authenticate from './Authenticate';
import Filter from './Filter';

const drop = new Drop();
const analytics = new Analytics();
const authenticate = new Authenticate();
const filter = new Filter();

export default {
  public: [
    // Download
    { method: 'GET', path: '/download', action: drop.download },

    // Authenticate
    { method: 'POST', path: '/authenticate', action: authenticate.firebase },

    // Health
    { method: 'GET', path: '/health', action: /*authenticate.health*/ (_, res, next) => {
      res.send('RUNNING');
      next();
    } },
  ],
  private: [
    // Drops
    { method: 'GET', path: '/drops', action: drop.feed },
    { method: 'GET', path: '/drops/user/:user_id', action: drop.feed },
    { method: 'GET', path: '/drops/:audio_idORtagORdrop_id', action: drop.single },
    { method: 'PUT', path: '/drops/:drop_id', action: drop.update },
    { method: 'GET', path: '/audio/:audio_idORtagORdrop_id', action: drop.single },
    { method: 'GET', path: '/featured', action: drop.featured },
    { method: 'GET', path: '/clouds', action: drop.getClouds },
    { method: 'GET', path: '/subclouds', action: drop.getSubClouds },
    { method: 'GET', path: '/waveform', action: drop.waveform },
    { method: 'POST', path: '/validate', action: drop.validate },
    { method: 'POST', path: '/create', action: drop.create },
    { method: 'PUT', path: '/trim', action: drop.trim },

    // Analytics
    { method: 'POST', path: '/listen', action: analytics.recordListen },
    { method: 'POST', path: '/like', action: analytics.recordLike },
    { method: 'POST', path: '/interaction', action: analytics.recordInteraction },
    { method: 'GET', path: '/analytics', action: analytics.analyze },

    // Filters
    { method: 'POST', path: '/filter/duet', action: filter.duet },
    { method: 'POST', path: '/filter/export-video', action: filter.exportVideo },
  ],
};
