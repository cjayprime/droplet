
import { body } from 'express-validator';

import Controller from './base';

import { User as UserService } from '../services';

class UserController extends Controller {
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
}

export default UserController;
