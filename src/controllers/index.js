import Drop from './Drop';
import Analytics from './Analytics';
import Authenticate from './Authenticate';
import Filter from './Filter';
import Marketing from './Marketing';
import User from './User';

const drop = new Drop();
const analytics = new Analytics();
const authenticate = new Authenticate();
const filter = new Filter();
const marketing = new Marketing();
const user = new User();

export default {
  public: [
    // Authenticate
    { method: 'POST', path: '/authenticate', action: authenticate.firebase },

    // Analytics
    { method: 'POST', path: '/interaction', action: analytics.recordInteraction },

    // Download
    { method: 'GET', path: '/download', action: drop.download },

    // Marketing
    { method: 'POST', path: '/sms', action: marketing.sendSms },

    // Health
    { method: 'GET', path: '/health', action: /*authenticate.health*/ (_, res, next) => {
      res.send('RUNNING');
      next();
    } },
  ],
  private: [
    // Options
    { method: 'GET', path: '/controls', action: authenticate.controls },

    // Drops
    { method: 'GET', path: '/drops', action: drop.feed },
    { method: 'GET', path: '/drops/user/:user_id', action: drop.feed },
    { method: 'GET', path: '/drops/:audio_idORtagORdrop_id', action: drop.single },
    { method: 'PUT', path: '/drops/:drop_id', action: drop.update },
    { method: 'GET', path: '/audio/:audio_idORtagORdrop_id', action: drop.single },
    { method: 'GET', path: '/featured', action: drop.featured },
    { method: 'GET', path: '/clouds', action: drop.getClouds },
    { method: 'GET', path: '/subclouds', action: drop.getSubClouds },
    { method: 'POST', path: '/subclouds', action: drop.createSubCloud },
    { method: 'GET', path: '/subclouds/:sub_cloud_id', action: drop.getSingleSubCloud },
    { method: 'PUT', path: '/subclouds/:sub_cloud_id', action: drop.toggleUserInSubCloud },
    { method: 'GET', path: '/groups', action: drop.getGroups },
    { method: 'GET', path: '/waveform', action: drop.waveform },
    { method: 'POST', path: '/validate', action: drop.validate },
    { method: 'POST', path: '/create', action: drop.create },
    { method: 'PUT', path: '/trim', action: drop.trim },
    { method: 'POST', path: '/like', action: drop.like },

    // User
    { method: 'PUT', path: '/user', action: user.update },
    { method: 'GET', path: '/user/:user_idORuidORusername', action: user.get },

    // Analytics
    { method: 'POST', path: '/listen', action: analytics.recordListen },
    { method: 'GET', path: '/analytics', action: analytics.analyze },

    // Filters
    { method: 'GET', path: '/filters', action: filter.all },
    { method: 'POST', path: '/filter/duet', action: filter.duet },
    { method: 'POST', path: '/filter/export-video', action: filter.exportVideo },
    { method: 'POST', path: '/filter/pitch-shift-:type', action: filter.pitchShift },
  ],
};
