/**
 * Notify class
 * 
 * Sends notification to slack, gsuite, whatsapp, and 
 * text, to alert the tech team of (fatal) issues
 */
class Notify {
  /**
     * Send a notification to slack only
     * 
     * @param {string} message The message to send
     * @param {string} channel The slack channel to send to
     */
  info(message/*, channel = 'computer-says-no'*/) {
    console.log(message);
  }

  /**
     * Send a notification to slack error channel only
     * 
     * @param {string} message The message to send
     * @param {string} channel The slack channel to send to
     */
  error(message/*, channel = 'computer-says-no', ...extras*/) {
    console.log(message/*, extras*/);
  }
}

const notify = new Notify();
export default notify;
