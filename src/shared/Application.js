import nodeCron from 'node-cron';
import cronstrue from 'cronstrue';

import sequelize from '../models/base';

import { Error, Notify } from '../shared';

class Application {
  app;
  config;
  port;
  middlewares;
  controllers;
  error;

  constructor(options) {
  	this.app = options.app;
  	this.config = options.config;
  	this.port = this.config.port;
  	this.middlewares = options.middlewares;
  	this.controllers = options.controllers;
  	this.error = options.error;
  	this.cron = options.cron;

  	this.register();
  }

  register() {
  	this.middlewares.forEach((middleware) => {
  		this.app.use(middleware);
  	});

  	this.controllers.forEach((controller) => {
  		this.app[controller.method.toLowerCase()](controller.path, controller.action);
  	});

  	this.app.use(this.error);
  }

  async start() {
    // GCP doesn't allow `GROUP BY` queries because `sql_mode` is set to `only_full_group_by` to fix it use:
    // SET SESSION sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''));
    // note that 'SESSION' should be 'GLOBAL' and thus permanent but GCP again doesn't give the necessary
    // SUPER ADMIN permissions to make such a change
    await sequelize.query('SET SESSION sql_mode=(SELECT REPLACE(@@sql_mode,\'ONLY_FULL_GROUP_BY\',\'\'));');

  	const server = this.app.listen(this.port, () => {
  		console.log(
  			`The server is now running at http://localhost:${this.port} for ${process.env.NODE_ENV}`
  		);
      
      if (process.env.RUN_CRON && process.env.RUN_CRON === 'false') {
        return;
      }        
        
      const throwError = (task) => {
        throw new Error.make('The format of the cron job schedule string is invalid for the task: ' + task, 'CronJobError', false);
      };
      const timezone = 'Africa/Lagos';
      Object.keys(this.cron).map(task => {
        if (nodeCron.validate(this.cron[task].schedule)) {
          console.log(
            `The cron job '${task}' is now scheduled and will run ${cronstrue.toString(this.cron[task].schedule).toLowerCase()}`,
          );
          nodeCron
            .schedule(
              this.cron[task].schedule,
              async () => {
                console.log(' \n -- CRON', this.cron[task].name || task, 'STARTED');
                try {
                  await this.cron[task].action();
                } catch (e) {
                  await Notify.info((this.cron[task].name || task) + ' failed because of a bug.');
                  await Notify.error(e);
                }
                console.log(' -- CRON', this.cron[task].name || task, 'ENDED\n');
              },
              { timezone, scheduled: true },
            ).start();
        } else {
          throwError(task);
        }
      });
  	});
    server.timeout = 600000;
  }
}

export default Application;
