import { body, param } from 'express-validator';

import Controller from './base';

import { AudioEngine } from '../services';

class FilterController extends Controller {
  /**
   * Create a duet filter using details as specified below
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

  /**
   * Create a fancy marketing video that will later be exported to other platforms from a drop using it's drop_id
   *
   * @param {Express.Response}    res     Express[.response] response object
   * @param {Express.Request}     req     Express[.request] request object
   * @param {Express.next}        next    Express callback to move to the next middleware
   * @return {void} void
   */
  exportVideo = [
    body('drop_id')
      .isInt()
      .withMessage('must be a valid drop_id.'),

  	this.action(async (req, res, next) => {
      const { body: { drop_id } } = req;
  		const audioEngine = new AudioEngine();
  		const response = await audioEngine.filter.exportVideo(drop_id);
      this.response(res, response.code, response.data, response.message);
  		next();
  	})
  ];

  /**
   * Create a pitch shift filter (of any one of the following types: baritone, helium, chipmunk and giant) 
   * using it's tag
   *
   * @param {Express.Response}    res     Express[.response] response object
   * @param {Express.Request}     req     Express[.request] request object
   * @param {Express.next}        next    Express callback to move to the next middleware
   * @return {void} void
   */
  pitchShift = [
    body('tag')
      .isUUID(4)
      .withMessage('must be a valid tag.'),

    body('isTrimmed')
      .isBoolean()
      .withMessage('must be a boolean.'),

    param('type').isIn(
      ['baritone', 'helium', 'chipmunk', 'giant']
    )
      .withMessage('must be a pitch shift type.'),

    this.action(async (req, res, next) => {
      const { body: { tag, isTrimmed }, params: { type } } = req;
      const audioEngine = new AudioEngine();
      const response = await audioEngine.filter.pitchShift(tag, type, isTrimmed);
      this.response(res, response.code, response.data, response.message);
      next();
    })
  ];
}

export default FilterController;
