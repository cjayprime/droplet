import { body, param } from 'express-validator';

import Controller from './base';

import { User as UserService } from '../services';

class UserController extends Controller {
  /**
   * Edit a user
   *
   * @param {Express.Response}    res     Express[.response] response object
   * @param {Express.Request}     req     Express[.request] request object
   * @param {Express.next}        next    Express callback to move to the next middleware
   * @return {void} void
   */
  update = [
    body('username')
      .notEmpty()
      .withMessage('must be a valid username.'),

    this.action(async (req, res, next) => {
      const { body: { username } } = req;
      const  { user_id } = req.account;
      const userService = new UserService();
      const response = await userService.update(username, user_id);
      this.response(res, response.code, response.data, response.message);
      next();
    })
  ];


  /**
   * Retrieve a user
   *
   * @param {Express.Response}    res     Express[.response] response object
   * @param {Express.Request}     req     Express[.request] request object
   * @param {Express.next}        next    Express callback to move to the next middleware
   * @return {void} void
   */
  get = [
    param('user_idORuidORusername')
      .notEmpty()
      .withMessage('must be a valid username user_id or uid.'),

    this.action(async (req, res, next) => {
      const { params: { user_idORuidORusername: user_id } } = req;
      const userService = new UserService();
      const response = await userService.get(user_id);
      this.response(res, response.code, response.data, response.message);
      next();
    })
  ];
}

export default UserController;
