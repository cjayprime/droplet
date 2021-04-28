import Controllers from '../controllers';

class NotFound {
  static pages = (req, res, next) => {
  	const controllers = Controllers.private.concat(Controllers.public);
  	const exists = controllers
  		.some(
  			ctrl => ctrl.path.split('?')[0] === req.originalUrl.split('?')[0] &&
                      (ctrl.method === req.method || req.method === 'OPTIONS')
  		);
  	if (!exists){
  		res
  			.status(404)
  			.send({ status: false, data: {}, message: 'Not found' });
  		return;
  	}
  
  	next();
  };
}

export default NotFound;
