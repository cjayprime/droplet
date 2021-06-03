class Error {
  static make = function DropletErrorEngine (message, name, report) {
  	this.message = message;
  	this.name = name;
  	this.report = report;
  };

  static resolver = (err, req, res, next) => {
  	console.log('\n\n');
  	console.error('-----------------------FATAL BUT CAUGHT ERROR-----------------------');
  	console.error('STRINGIFIED ERROR IS:', JSON.stringify(err), req.originalUrl);
  	console.log('THE RAW ERROR IS:', err);
  	console.error('--------------------------------------------------------------------');
  	console.log('\n\n');

  	let message = err.report ? err.message : 'A fatal error occurred.', code = 400, data = {};
  	if (err.name === 'UnauthorizedError') {
  		console.log('AUTH HEADER IS:', req.headers.authorization);
  		code = 401;
  		if (err.inner.name === 'TokenExpiredError') {
  			message = 'Your session has expired, kindly signin and try again.';
  		}  else if (req.headers.authorization) {
        message = 'You provided corrupt authentication details.';
      } else {
  			message = 'You are signed out, kindly signin and try again.';
  		}
  	} else if (res.headersSent) {
  		return next(err);
  	}

  	res
      .status(code)
      .json({ status: false, data, message });
  };
}

export default Error; 
