import Drop from './Drop';
import Analytics from './Analytics';
import Filter from './Filter';

const drop = new Drop();
const analytics = new Analytics();
const filter = new Filter();

export default {
  public: [
    // Drop
    { method: 'GET', path: '/user/:user_id', action: drop.feed },
    { method: 'GET', path: '/drops', action: drop.feed },
    { method: 'GET', path: '/drops/:tagORdrop_id', action: drop.single },
    { method: 'GET', path: '/categories', action: drop.getCategories },
    { method: 'GET', path: '/download', action: drop.download },
    { method: 'GET', path: '/waveform', action: drop.waveform },
    { method: 'POST', path: '/validate', action: drop.validate },
    { method: 'POST', path: '/create', action: drop.create },
    { method: 'PUT', path: '/trim', action: drop.trim },

    // Analytics
    { method: 'POST', path: '/analytics/interaction', action: analytics.recordInteraction },
    { method: 'POST', path: '/analytics/listen', action: analytics.recordListen },
    { method: 'GET', path: '/analytics', action: analytics.analyze },

    // Filters
    { method: 'POST', path: '/filter/duet', action: filter.duet },

    // Authenticate
    // {method: 'POST', path: '/authenticate', action: authenticate.firebase},

    // Health
    { method: 'GET', path: '/health', action: /*authenticate.health*/ (_, res, next) => {
      res.send('RUNNING');
      next();
    } },

    { method: 'GET', path: '/status', action: (req, res, next) => {
      res.status(req.query.status).send('RUNNING');
      next();
    } },
  ],
  private: [
    // Analytics
    // {method: 'GET', path: '/analytics', action: user.analytics},
  ],
};
