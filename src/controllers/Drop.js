import { oneOf, body, query, param } from 'express-validator';

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

    body('filter')
      .isAlphanumeric()
      .withMessage('must be a valid filter.')
      .optional(),

  	this.action(async (req, res, next) => {
      const { body: { tag, start, end, filter } } = req;
  		const dropService = new DropService();
  		const response = await dropService.trim(tag, start, end, filter);
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
      .withMessage('must be a boolean.')
      .optional(),

    query('filter')
      .isAlphanumeric()
      .withMessage('must be a valid filter.')
      .optional(),

  	this.action(async (req, res, next) => {
      const { query: { tag, isTrimmed, filter } } = req;
  		const dropService = new DropService();
  		const response = await dropService.download(res, tag, isTrimmed == 'true', filter);
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

    oneOf([
      body('source')
        .equals('recording')
        .withMessage('must be a either "recording" or "upload".'),
      body('source')
        .equals('upload')
        .withMessage('must be a either "recording" or "upload".')
    ]),

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

    body('filter')
      .isAlphanumeric()
      .withMessage('must be a valid filter.')
      .optional(),

  	this.action(async (req, res, next) => {
      const { body: { user_id, tag, caption, category, isTrimmed, filter } } = req;
  		const dropService = new DropService();
  		const response = await dropService.create(user_id, tag, caption, category, isTrimmed, filter);
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
  single = [
    param('tagORdrop_id')
      .notEmpty()
      .withMessage('must be a valid user_id.'),

  	this.action(async (req, res, next) => {
      const { params: { tagORdrop_id } } = req;
  		const dropService = new DropService();
  		const response = await dropService.single(tagORdrop_id);
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
  featured = [
  	this.action(async (_, res, next) => {
  		const dropService = new DropService();
  		const response = await dropService.featured();
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
  feed = [
  	query('limit')
  		.isInt()
  		.withMessage('must be a valid number.'),

    query('offset')
      .isInt()
      .withMessage('must be a valid number.'),

    param('user_id')
      .notEmpty()
      .withMessage('must be a valid user_id.')
      .optional(),

    query('category')
      .notEmpty()
      .withMessage('must be a valid category (id or name).')
      .optional(),

    query('category.*')
      .isAlphanumeric()
      .withMessage('must be a valid category (id or name).')
      .optional(),

  	this.action(async (req, res, next) => {
      const { query: { limit, offset, category, user_id: UID }, params: { user_id } } = req;
  		const dropService = new DropService();
  		const response = await dropService.feed(UID, user_id, limit, offset, null, typeof category === 'string' ? [category] : category);
      this.response(res, response.code, response.data, response.message);
  		next();
  	})
  ];
}

export default DropController;
