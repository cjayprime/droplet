import Controllers from '../controllers';

class NotFound {
  /**
   * Check the endpoints of the server if an endpoint 
   * being requested exists or not
   * 
   * @param {Boolean} checkPublicOnly   Whether or not to limit the check to public endpoints
   * @returns {Express Middleware} The middleware in turn will return a boolean if
   *                               `checkPublicOnly` is true or Response with status 404 if it's false
   */
  static pages = checkPublicOnly => (req, res, next) => {
  	let controllers = Controllers.private.concat(Controllers.public);
    if (checkPublicOnly) {
      controllers = Controllers.public;
    }

    const method = req.method;
    const originalUrl = req.originalUrl.split('?');
    let exists = false;
    // Compare all parts of:
    // 1. req.originalUrl to controllers.path
    // 2. req.method to controllers.method || OPTIONS
    for (var i = 0; i < controllers.length; i++) {
      const ctrl = controllers[i];
      const pathUrl = ctrl.path.split('/');
      const origUrl = originalUrl[0].split('/');
      for (var j = 0; j < pathUrl.length; j++) {
        const url = pathUrl[j];
        if (/:/.test(url)) {
          // If a colon is detected do not compare urls literally
          exists = !!origUrl[j] && (method === ctrl.method || method === 'OPTIONS');
          continue;
        }
        exists = url === origUrl[j] && (method === ctrl.method || method === 'OPTIONS');
      }

      if (exists) {
        break;
      }
    }

    if (checkPublicOnly) {
      return exists;
    }

  	if (!exists) {
  		res
  			.status(404)
  			.send({ status: false, data: {}, message: 'Not found' });
  		return;
  	}

    next();
  };
}

export default NotFound;
