import { oneOf, body, query, param } from 'express-validator';

import Controller from './base';

import { Drop as DropService } from '../services';

class DropController extends Controller {
  // {{{WIP}}}
  // Needs a flag to allow mixing body, query and params functions
  parameter = ({ ...args }, type) => {
    const types = { body, query, param };
    const params = {
      user_id: types[type]('user_id')
        .notEmpty()
        .withMessage('must be a valid user_id.'),

      tag: types[type]('tag')
        .isUUID()
        .withMessage('must be a valid tag.'),

      isTrimmed: types[type]('isTrimmed')
        .isBoolean()
        .withMessage('must be a boolean.')
        .optional(),

      filter: types[type]('filter')
        .isSlug()
        .withMessage('must be a valid filter.')
        .optional(),

      subCloud: types[type]('subCloud')
        .notEmpty()
        .withMessage('must be a valid subCloud (id or name).')
        .optional(),

      'subCloud.*': types[type]('subCloud.*')
        .isAlphanumeric()
        .withMessage('must be a valid subCloud (id or name).')
        .optional(),
    };
    const allParams = Object.keys(params);
    const allArgs = Object.keys(args);
    return allParams.map(param => params[allArgs.find(arg => arg === param)])
      .filter(elem => !!elem);
  }

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
      .isNumeric()
      .withMessage('must be a number in seconds.'),

    body('end')
      .isNumeric()
      .withMessage('must be a number in seconds.'),

    body('filter')
      .isSlug()
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
      .isSlug()
      .withMessage('must be a valid filter.')
      .optional(),

    query('extension')
      .notEmpty()
      .withMessage('must be a valid extension.')
      .optional(),

  	this.action(async (req, res, next) => {
      const { query: { tag, isTrimmed, filter, extension } } = req;
  		const dropService = new DropService();
  		const response = await dropService.download(res, tag, isTrimmed == 'true', filter, extension);
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

    query('filter')
      .isSlug()
      .withMessage('must be a valid filter.')
      .optional(),

  	this.action(async (req, res, next) => {
      const { query: { tag, bars, filter } } = req;
  		const dropService = new DropService();
  		const response = await dropService.waveform(tag, bars, filter);
      this.response(res, response.code, response.data, response.message);
  		next();
  	})
  ];

  /**
   * Get a list of all clouds
   *
   * @param {Express.Response}    res     Express[.response] response object
   * @param {Express.Request}     req     Express[.request] request object
   * @param {Express.next}        next    Express callback to move to the next middleware
   * @return {void} void
   */
  getClouds = [
  	this.action(async (_, res, next) => {
  		const dropService = new DropService();
  		const response = await dropService.loadClouds();
      this.response(res, response.code, response.data, response.message);
  		next();
  	})
  ];

  /**
   * Get a list of all subclouds
   *
   * @param {Express.Response}    res     Express[.response] response object
   * @param {Express.Request}     req     Express[.request] request object
   * @param {Express.next}        next    Express callback to move to the next middleware
   * @return {void} void
   */
  getSubClouds = [
  	this.action(async (req, res, next) => {
      const { account: { user_id } } = req;
  		const dropService = new DropService();
  		const response = await dropService.loadSubClouds(user_id);
      this.response(res, response.code, response.data, response.message);
  		next();
  	})
  ];

  createSubCloud = [
  	body('cloud_id')
  		.isInt()
  		.withMessage('must be a valid number.'),

    body('name')
      .notEmpty()
      .withMessage('must be valid characters (it can include emojis).'),

    body('description')
      .notEmpty()
      .withMessage('must be a valid subCloud (id or name).'),

  	this.action(async (req, res, next) => {
      const { body: { cloud_id, name, description }, account: { user_id } } = req;
  		const dropService = new DropService();
  		const response = await dropService.createSubCloud(user_id, cloud_id, name, description);
      this.response(res, response.code, response.data, response.message);
  		next();
  	})
  ];

  getSingleSubCloud = [
  	param('sub_cloud_id')
  		.isInt()
  		.withMessage('must be a valid number.'),

  	this.action(async (req, res, next) => {
      const { params: { sub_cloud_id } } = req;
  		const dropService = new DropService();
  		const response = await dropService.getSingleSubCloud(sub_cloud_id);
      this.response(res, response.code, response.data, response.message);
  		next();
  	})
  ];

  addUsersToSubCloud = [
  	param('sub_cloud_id')
  		.isInt()
  		.withMessage('must be a valid number.'),

  	body('users')
  		.isArray()
  		.withMessage('must be an array of valid user_ids.'),

    body('status')
      .isInt({ min: 0, max: 1 })
      .withMessage('must be either 0 or 1.'),

  	this.action(async (req, res, next) => {
      const { params: { sub_cloud_id }, body: { users, status } } = req;
  		const dropService = new DropService();
  		const response = await dropService.addUsersToSubCloud(sub_cloud_id, users, status);
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

  	body('subCloud')
      .notEmpty()
      .withMessage('must be a valid sub cloud (id or name).'),

    body('isTrimmed')
      .isBoolean()
      .withMessage('must be a boolean.'),

    body('filter')
      .isSlug()
      .withMessage('must be a valid filter.')
      .optional(),

  	this.action(async (req, res, next) => {
      const { body: { user_id, tag, caption, subCloud, isTrimmed, filter } } = req;
  		const dropService = new DropService();
  		const response = await dropService.create(user_id, tag, caption, subCloud, isTrimmed, filter);
      this.response(res, response.code, response.data, response.message);
  		next();
  	})
  ];

  /**
   * Record a listen (to a drop) within the app
   */
  like = [
    body('user_id')
      .notEmpty()
      .withMessage('must be a valid user_id.'),

    body('drop_id')
      .isInt()
      .withMessage('must be a valid drop.'),

    this.action(async (req, res, next) => {
      const { body: { user_id, drop_id } } = req;
      const dropService = new DropService();
      const response = await dropService.like(user_id, drop_id);
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
    param('audio_idORtagORdrop_id')
      .notEmpty()
      .withMessage('must be a valid drop_id.'),

  	this.action(async (req, res, next) => {
      const { query: { user_id }, params: { audio_idORtagORdrop_id } } = req;
  		const dropService = new DropService();
  		const response = await dropService.single(
        audio_idORtagORdrop_id,
        user_id,
        req.originalUrl.indexOf('/drops') === 0 ? 'drop_id' : 'audio_id'
      );
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
  update = [
    param('drop_id')
      .isInt()
      .withMessage('must be a valid drop_id.'),

    body('caption')
      .notEmpty()
      .withMessage('must be a caption.')
      .optional(),

    body('status')
      .isInt({ min: 0, max: 1 })
      .withMessage('must be a valid status.')
      .optional(),

  	this.action(async (req, res, next) => {
      const { body: { caption, status }, params: { drop_id } } = req;
  		const dropService = new DropService();
  		const response = await dropService.update(drop_id, caption, status);
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

    query('subCloud')
      .notEmpty()
      .withMessage('must be a valid subCloud (id or name).')
      .optional(),

    query('subCloud.*')
      .isAlphanumeric()
      .withMessage('must be a valid subCloud (id or name).')
      .optional(),

  	this.action(async (req, res, next) => {
      const { query: { limit, offset, subCloud, user_id: UID }, params: { user_id } } = req;
  		const dropService = new DropService();
  		const response = await dropService.feed(UID || user_id, user_id, limit, offset, null, typeof subCloud === 'string' ? [subCloud] : subCloud);
      this.response(res, response.code, response.data, response.message);
  		next();
  	})
  ];
}

export default DropController;
