import { body } from 'express-validator';

import Controller from './base';

import { AudioEngine } from '../services';

class FilterController extends Controller {
  /**
   * Create a drop using it's tag, and specify the bars to plot in the waveform
   *
   * @param {Express.Response}    res     Express[.response] response object
   * @param {Express.Request}     req     Express[.request] request object
   * @param {Express.next}        next    Express callback to move to the next middleware
   * @return {void} void
   */
  duet = [
    body('current.user_id')
      .notEmpty()
      .withMessage('must be a valid user_id.'),

    body('current.tag')
      .isUUID(4)
      .withMessage('must be a valid tag.'),

    body('current.isTrimmed')
      .isBoolean()
      .withMessage('must be a boolean.'),

    body('owner.user_id')
      .notEmpty()
      .withMessage('must be a valid user_id.'),

    body('owner.tag')
      .isUUID(4)
      .withMessage('must be a valid tag.'),

  	this.action(async (req, res, next) => {
      const { body: { current, owner } } = req;
  		const audioEngine = new AudioEngine();
  		const response = await audioEngine.filter.duet(current, owner);
      this.response(res, response.code, response.data, response.message);
  		next();
  	})
  ];
}

export default FilterController;
