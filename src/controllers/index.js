import Drop from './Drop';

const drop = new Drop();

export default {
  public: [
    {method: 'GET', path: '/categories', action: drop.getCategories},
    {method: 'GET', path: '/download', action: drop.download},
    {method: 'GET', path: '/waveform', action: drop.waveform},
    {method: 'POST', path: '/validate', action: drop.validate},
    {method: 'POST', path: '/create', action: drop.create},
    {method: 'PUT', path: '/trim', action: drop.trim},
    {method: 'GET', path: '/health', action: (_, res, next) => {
      res.send('RUNNING');
      next();
    }},
  ],
  private: [
    // Analytics
    // {method: 'GET', path: '/analytics', action: user.analytics},
  ],
};
