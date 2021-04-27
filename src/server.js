import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import expressJWT from 'express-jwt';
const morgan = require('morgan'); // Morgan has a bug, where I can't use es6 imports without getting a log to stdout 
import dotenv from 'dotenv';

import Controllers from './controllers';
import {
  Application,
  Configuration,
  Error,
  NotFound,
} from './shared';
import { Cron } from './services';

dotenv.config();
const app = express();
const application = new Application({
  app,
  config: {
    port: process.env.PORT || 9000,
  },
  error: Error.resolver,
  middlewares: [
    morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :total-time[digits]', {
      stream: fs.createWriteStream(path.join(__dirname, '../logs', 'access.log'), { flags: 'a' })
    }),
    
    morgan(':remote-addr - [:date] :method :url :status - :total-time[digits] ms'),
    
    NotFound.pages,
    
    cors(),
    
    express.urlencoded({extended: true}),
    
    express.json({limit: '100mb'}),

    function devlog(req, _, next) {
      console.log('-- REQUEST', req.body, req.query);
      next();
    },

    expressJWT({ secret: Configuration.privateKey(), algorithms: ['RS256'], requestProperty: 'account' })
      .unless((req) => Controllers.public.some(ctrl => req.originalUrl === ctrl.path && req.method === ctrl.method)),

    // TODO:
    // ADD Redis?,

    morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]', {
      skip: function (_, res) {
        return res.statusCode < 400; 
      },
      stream: fs.createWriteStream(path.join(__dirname, '../logs', 'error.log'), { flags: 'a' })
    }),
  ],
  controllers: Controllers.private.concat(Controllers.public),
  cron: new Cron(),
});

export { app }; // For tests
export default application;







setTimeout(async () => {
  if (process.env.NODE_ENV === 'development') {
    // Change any value here to test instantly in development
    const supertest = require('supertest');
    const request = supertest(app);
    const token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6Im5uYWNoaWppb2tlQHlhaG9vLmNvbSIsIm1vYmlsZSI6bnVsbCwiY29kZSI6bnVsbCwiZmlyc3RuYW1lIjoiQ2hpamlva2UiLCJsYXN0bmFtZSI6Ik5uYSIsImJ2biI6bnVsbCwiY2FyZCI6bnVsbCwiYmFsYW5jZSI6MjAwLCJzdGF0dXMiOnRydWUsImRhdGUiOiIyMDIxLTAxLTExVDA3OjUzOjU1LjAwMFoiLCJpYXQiOjE2MTQxNzUxMDQsImV4cCI6NDc2OTkzNTEwNH0.ceibXPNoS4_O4cnSgyIpRjM9gvBlhoHS5NMDaXB2ROGEJ1MSgSqlp3OjeUmlJJO8CM40hGaxkICWcnmc-mWGiqCor1sqgf6AUvew9PEK26n4FJtSbIHA9H39v7FvghwpP1HRKv_570g5nD_X2Q6e8Ys52I-_8Q5aRoew4q9gHN45JDz495dQM_GbX88LImbsuzkQ1vxS-JvRR_Z1eOHHhgdGByuhIw166Q9feXoz5arB6_E7Aq4gB-Hy-pUlj0XXM9ebiFaTFI7tyO5jAoz7cAu1GOWdWUeiv1fS3XCkt2x0p8nX6Hex4LWKF8KgXPDFfxZz45zHMll9HyCfHQfYYWU1uNsaDIezc_NeFI7Jd8Snge5W5MPUPQwkUR-Asa6HA319qVhqL0fIX4uEQmAWz8rpFUMVGM5ag5qyPmDx6BYN9u02lfePCR7OTE4LZzzO7abqzF0hklAP6UkGVQRXJ2SW6oz43_DIWq21kVFX9CVDW4QzHe6XPLA48zJj5BJac59qW8sKkFQodtyHHnQEJW0GmCCPLu5KKyF3Gp5gnngHmvbmyyFcaDAdDn8kF9wU_wRLmhemLikLQY-x046qAvllVKKTRbE2vGnbYqqGPQAjNx5HbkYYUo2b_YlEW7VyhCJxm_HoXRVvvyLjM6SrwhaEp45Zwh2D5akhBzeo2Pg';
    const headers = {
      'Authorization' : 'Bearer ' + token,
      'Content-Type': 'application/json',
    };
    
    
    const response = await request.post('/validate').send({user_id: 101010, tag: 'b0b031bd-23cd-477a-a2dd-5f4078b1931d', caption: 'Done', category: 'music'}).set(headers);
    // const response = await request.post('/trim').send({start: 35, end: 60, dropID: '24k'});
    // const response = await request.get('/download?dropID=24k&isTrimmed=true').send();
    // const response = await request.post('/create').send({user_id: 101010, tag: 'b0b031bd-23cd-477a-a2dd-5f4078b1931d', caption: 'Done', category: 'music'}).set(headers);
    console.log(response.body);
  }
}, 1500);
