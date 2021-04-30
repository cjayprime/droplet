import Drop from './Drop';
import Analytics from './Analytics';

const drop = new Drop();
const analytics = new Analytics();

export default {
  public: [
    // Drop
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

    // Authenticate
    // {method: 'POST', path: '/authenticate', action: authenticate.firebase},

    // Health
    { method: 'GET', path: '/health', action: /*authenticate.health*/ (_, res, next) => {
      res.send('RUNNING');
      next();
    } },
  ],
  private: [
    // Analytics
    // {method: 'GET', path: '/analytics', action: user.analytics},
  ],
};
