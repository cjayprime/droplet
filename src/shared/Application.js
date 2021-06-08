import nodeCron from 'node-cron';
import cronstrue from 'cronstrue';

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

  start() {
  	const server = this.app.listen(this.port, () => {
  		console.log(
  			`The server is now running at http://localhost:${this.port} for ${process.env.NODE_ENV}`
  		);

      try {
        if (process.env.NODE_ENV === 'production'){
          const throwError = (task) => {
            throw new Error.make('The format of the cron job schedule string is invalid for the task: ' + task, 'CronJobError', false);
          };
          const timezone = 'Africa/Lagos';
          Object.keys(this.cron).map(task => {
            if (nodeCron.validate(this.cron[task].schedule)) {
              console.log(
                `The cron job '${task}' is now scheduled and will run ${cronstrue.toString(this.cron[task].schedule)}`,
              );
              nodeCron
                .schedule(
                  this.cron[task].schedule,
                  () => {
                    console.log('-- CRON ', this.cron[task].name || task);
                    this.cron[task].action();
                  },
                  { timezone, scheduled: true },
                ).start();
            } else {
              throwError(task);
            }
          });
        }
      } catch (e) {
        Notify.error(e);
      }
  	});
    server.timeout = 600000;
  }
}

export default Application;
