import { body, query } from 'express-validator';

import Controller from './base';

import { Drop as DropService } from '../services';

class DropController extends Controller {
  /**
   * Trims a user's audio file identified by `tag` from the second mark `start` to `end`
   *
   * @param {Express.Response}    res     Express[.response] response object
   * @param {Express.Request}     req     Express[.request] request object
   * @param {Express.next}        next    Express callback to move to the next middleware
   * @return {void} void
   */
  trim = [
  	body('tag')
  		.isUUID()
  		.withMessage('must be a valid tag.'),

    body('start')
      .isInt()
      .withMessage('must be a number.'),

    body('end')
      .isInt()
      .withMessage('must be a number.'),

  	this.action(async (req, res, next) => {
      const { body: { tag, start, end } } = req;
  		const dropService = new DropService();
  		const response = await dropService.trim(tag, start, end);
      this.response(res, response.code, response.data, response.message);
  		next();
  	})
  ];

  /**
   * Download audio, use `isTrimmed` to specify if the last trimmed version should be downloaded
   * Note: Once the file is saved via POST /create the file is deleted
   *
   * @param {Express.Response}    res     Express[.response] response object
   * @param {Express.Request}     req     Express[.request] request object
   * @param {Express.next}        next    Express callback to move to the next middleware
   * @return {void} void
   */
  download = [
  	query('tag')
  		.isUUID()
  		.withMessage('must be a valid tag.'),

    query('isTrimmed')
      .isBoolean()
      .withMessage('must be a boolean.'),

  	this.action(async (req, res, next) => {
      const { query: { tag, isTrimmed } } = req;
  		const dropService = new DropService();
  		const response = await dropService.download(res, tag, isTrimmed == 'true');
      if (response.alreadySent) {
        return;
      }
      this.response(res, response.code, response.data, response.message);
  		next();
  	})
  ];

  /**
   * Validate a base64 encoded audio recording
   *
   * @param {Express.Response}    res     Express[.response] response object
   * @param {Express.Request}     req     Express[.request] request object
   * @param {Express.next}        next    Express callback to move to the next middleware
   * @return {void} void
   */
  validate = [
    body('user_id')
      .notEmpty()
      .withMessage('must be a valid user_id.'),

  	body('recording')
      .notEmpty()
  		.withMessage('must be a valid recording file.'),

    body('source')
      .notEmpty()
      .withMessage('must be a either "recording" or "upload".'),

  	this.action(async (req, res, next) => {
      const { body: { user_id, recording, source } } = req;
  		const dropService = new DropService();
  		const response = await dropService.validate(user_id, recording, source);
      this.response(res, response.code, response.data, response.message);
  		next();
  	})
  ];

  /**
   * Get a waveform for a drop using it's tag, and specify the bars to plot in the waveform
   *
   * @param {Express.Response}    res     Express[.response] response object
   * @param {Express.Request}     req     Express[.request] request object
   * @param {Express.next}        next    Express callback to move to the next middleware
   * @return {void} void
   */
  waveform = [
  	query('tag')
  		.isUUID(4)
  		.withMessage('must be a valid tag.'),

    query('bars')
      .isInt()
      .withMessage('must be a valid tag.'),

  	this.action(async (req, res, next) => {
      const { query: { tag, bars } } = req;
  		const dropService = new DropService();
  		const response = await dropService.waveform(tag, bars);
      this.response(res, response.code, response.data, response.message);
  		next();
  	})
  ];

  /**
   * Create a drop using it's tag, and specify the bars to plot in the waveform
   *
   * @param {Express.Response}    res     Express[.response] response object
   * @param {Express.Request}     req     Express[.request] request object
   * @param {Express.next}        next    Express callback to move to the next middleware
   * @return {void} void
   */
  getCategories = [
  	this.action(async (_, res, next) => {
  		const dropService = new DropService();
  		const response = await dropService.loadCategories();
      this.response(res, response.code, response.data, response.message);
  		next();
  	})
  ];

  /**
   * Create a drop using it's tag, and specify the bars to plot in the waveform
   *
   * @param {Express.Response}    res     Express[.response] response object
   * @param {Express.Request}     req     Express[.request] request object
   * @param {Express.next}        next    Express callback to move to the next middleware
   * @return {void} void
   */
  create = [
  	body('user_id')
      .notEmpty()
  		.withMessage('must be a user_id.'),

  	body('tag')
      .isUUID(4)
      .withMessage('must be a valid tag.'),

  	body('caption')
      .notEmpty()
      .withMessage('must be a caption.'),

  	body('category')
      .notEmpty()
      .withMessage('must be a valid category.'),

    body('isTrimmed')
      .isBoolean()
      .withMessage('must be a boolean.'),

  	this.action(async (req, res, next) => {
      const { body: { user_id, tag, caption, category, isTrimmed } } = req;
  		const dropService = new DropService();
      // Get user_id from firebase
  		const response = await dropService.create(user_id, tag, caption, category, isTrimmed);
      this.response(res, response.code, response.data, response.message);
  		next();
  	})
  ];
}

export default DropController;
