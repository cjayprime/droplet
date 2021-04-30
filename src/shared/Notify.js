import * as Sentry from '@sentry/node';

/**
 * Notify class
 * 
 * Sends notification to slack, gsuite, whatsapp, and 
 * text, to alert the tech team of (fatal) issues
 */
class Notify {
  constructor(){    
  }

  /**
     * Send a notification to slack only
     * 
     * @param {string} message The message to send
     * @param {string} channel The slack channel to send to
     */
  info(message/*, channel = 'computer-says-no'*/) {
    console.log('Notify.info - Logging this message', message);
    Sentry.init({
      dsn: process.env.SENTRY_DNS,
      environment: process.env.NODE_ENV,
    
      // Set tracesSampleRate to 1.0 to capture 100%
      // of transactions for performance monitoring.
      // We recommend adjusting this value in production
      tracesSampleRate: 1.0,
    });
    
    const transaction = Sentry.startTransaction({
      op: process.env.NODE_ENV,
      name: message.name || message.code,
    });
    Sentry.captureMessage(message);
    transaction.finish();
  }

  /**
     * Send a notification to slack error channel only
     * 
     * @param {string} message The message to send
     * @param {string} channel The slack channel to send to
     */
  error(message/*, channel = 'computer-says-no', ...extras*/) {
    console.log('Notify.error - This is a fatal level error that failed silently', message/*, extras*/);
    Sentry.init({
      dsn: process.env.SENTRY_DNS,
      environment: process.env.NODE_ENV,
    
      // Set tracesSampleRate to 1.0 to capture 100%
      // of transactions for performance monitoring.
      // We recommend adjusting this value in production
      tracesSampleRate: 1.0,
    });

    const transaction = Sentry.startTransaction({
      op: process.env.NODE_ENV,
      name: message.name || message.code,
    });
    Sentry.captureException(message);
    transaction.finish();
  }
}

const notify = new Notify();
export default notify;
