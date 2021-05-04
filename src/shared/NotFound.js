import Controllers from '../controllers';

class NotFound {
  static pages = checkPublicOnly => (req, res, next) => {
  	let controllers = Controllers.private.concat(Controllers.public);
    if (checkPublicOnly) {
      controllers = Controllers.public;
    }
    const method = req.method;
    const originalUrl = req.originalUrl.split('?');
	  const exists = controllers.some(ctrl => {
      const origUrl = originalUrl[0].split('/');
      const pathUrl = ctrl.path.split('/');
      // Check for a complete match
      return pathUrl.every((url, i) => {
        if (/:/.test(url)) {
          // If a colon is detected do not compare urls
          return !!origUrl[i] && method === ctrl.method;
        }
        return url === origUrl[i] && method === ctrl.method;
      });
	  });

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
