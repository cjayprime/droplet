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
    body('user_id')
      .notEmpty()
      .withMessage('must be a valid user_id.'),

    body('tags')
      .isArray({ min: 2 })
      .withMessage('must be an array, with a minimum length of 2, containing valid tags.'),

  	this.action(async (req, res, next) => {
      const { body: { user_id, tags } } = req;
  		const audioEngine = new AudioEngine();
  		const response = await audioEngine.filter.duet(user_id, tags);
      this.response(res, response.code, response.data, response.message);
  		next();
  	})
  ];
}

export default FilterController;
