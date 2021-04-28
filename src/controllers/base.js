import { validationResult } from 'express-validator';

import { Notify } from '../shared';

/**
 * Base controller from which all others are derived (extended)
 * 
 * @abstract
 */
class Controller {
    model = null;
    
    /**
     * Validates an action, based on express-validator errors, before running it
     * Curries to an express callback
     * 
     * @param {function}    Express.Action            callback to pass from a child class to express
     * @param {object}      Express.Request           The express(http) response object
     * @param {object}      Express.Response          The express(http) response object
     * @param {object}      Express.Next              The express(http) next callback
     * @returns {null} void
     */
    action = callback => async (req, res, next) => {
    	const errors = validationResult(req);
    	if (errors && !errors.isEmpty()) {
    		console.log(
    			'\n-- REQUEST ERROR (' + req.originalUrl + ') --', '\n',
    			'Body:', req.body, '\n',
    			'Error:', errors,
    			errors.array().map(err => err.nestedErrors)
    		);
    		this.response(res, null, {}, null, errors);
    	} else {
    		try {
    			await callback(req, res, next);
    		} catch (e) {
    			Notify.error(e);
    			next(e);
    		}
    	}
    }

    /**
     * Sends a response to the client (pre-determining the shape of all responses)
     * 
     * @param {object}          Express.Response    The express(http) response object
     * @param {object}          HTTPStatusCode      The http status code
     * @param {object|array}    data                The data within the request
     * @param {object}          msg                 The message describing the response
     * @param {object}          errors              The express-validator error array
     * @returns {null} void
     */
    response = (res, statusCode, data, msg, errors) => {
    	let code = statusCode;
    	let message = msg;
    	if (errors && !errors.isEmpty()) {
    		let errArray = errors.array();
    		code = 400;
    		message = 'The request was poorly formatted';
    		data = {
    			error: errArray.map(err => {
    				let report = 'The ' + err.param + ' ' + err.msg;
    				if (err.param === '_error') { 
    					// oneOf check failed, 
    					// only show errors from submission (identified
    					// by nestedError.value != undefined),
    					// if there are none show other errors
    					report = '';
    					let errLen = err.nestedErrors.length;
    					if (err.nestedErrors.some(nestedError => typeof nestedError.value !== 'undefined')){
    						err.nestedErrors.map((nestedError) => {
    							if (typeof nestedError.value !== 'undefined'){
    								report += 'The ' + nestedError.param + ' ' + nestedError.msg + '\n';
    							}
    						});
    					} else {
    						report = 'You must provide either ';
    						err.nestedErrors.map((nestedError, i) => {
    							report += nestedError.param + ' ' + nestedError.msg;
    							report += (i === errLen - 1 ? '' : i === errLen - 2 ? ' or ' : ', ');
    						});

    					}
    				}
                  
    				return report;
    			})
    		};
    	}

    	res
    		.status(code)
    		.json({
    			status: code >= 200 && code < 400,
    			data,
    			message,
    		});
    };
}

export default Controller;
