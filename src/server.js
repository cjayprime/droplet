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

    NotFound.pages(false),

    expressJWT({ secret: Configuration.privateKey(), algorithms: ['RS256'], requestProperty: 'account' })
      .unless(NotFound.pages(true)),

    cors(),

    express.urlencoded({ extended: true }),

    express.json({ limit: '100mb' }),

    function devlog(req, _, next) {
      console.log('\n\n-- INCOMING REQUEST', req.method, req.originalUrl, req.body, req.query, req.params);
      next();
    },

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
    // const supertest = require('supertest');
    // const request = supertest(app);
    // const token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6InNlYW4iLCJ1aWQiOiIwc2JmUTJBMURDVTc5WGJQaXVZcEN5NE5oQXgyIiwiZGF0ZSI6IjIwMjEtMDUtMTBUMDY6MTI6NDkuNjE4WiIsImlhdCI6MTYyMDYyNzE2OSwiZXhwIjo0Nzc2Mzg3MTY5fQ.SjmFdFwE5Ik6M33F7HnnW4nn9ggpQ0QVMQEAaQYGtYleL9IQvJNI-_rs4rDgPi2CcCgcTxC1P4PqQRqkwsXFZoBtwW0LrKn1hj-FG9ZzD_fzz2w9njetbEYPWhoL5_3WxANe8aBlCE1QWoBh3Prmo-kUN7eS-C0HZaywdIvbF60Z5yaWr46XyAIg0dV5RrwwYpf8lwNz-udDu1ZF1XOSEA9oQSt_5mAQ43g5QbtaUFaNkqbSkXGvky6p_o30ugIezWhK-NmdLol-hUbqRzlScwlQf99QQnZkbY6p9KMAZ0nSsqKOUq8z9fm8veUYCgsSQLDIJHAVGOrkZRv5JJETbR_jxLwtJIQgSXhZQKSZeHCQq-E3uulTmGmtZwme3WTcvtSqs3KWoMznmJ9CbeoRv8PdrUORX0GMMS3D3T6w7WMQc4QdWli0gtkVZLmS5m_WgANKOgOFEVdHhgUSWvaRsxqqWMWNy2wqkizsJ4Gugijz-4lTmvZq-vN2SlgsCgl221KdM1LYbhbNiC_kqyA7r-vTQ6kdiSVZ6Be3YX1Hc58npMDr7PAKIVR006mogaUXSqRgXFPODEMaXRaHSQCsy-AoziNkvydTzoLlA0XJzKEJssCLuddy5pdn08RXga1D02jGZ7jWDPtnbiBD_49lG0D3bglwGXgL53QbOGOlCNo';
    // const headers = {
    //   'Authorization' : 'Bearer ' + token,
    //   'Content-Type': 'application/json',
    // };

    // const recording = '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';
    // const response = await request.post('/validate').send({ recording, user_id: 'CQT6WGHo5FYoY60zzjB3eNcAFA73', source: 'recording' }).set(headers);
    // const response = await request.put('/trim').send({ start: 35, end: 60, tag: '00ba23bd-17e1-4001-aac0-87603c8ea18f' }).set(headers);
    // const response = await request.get('/download?tag=00ba23bd-17e1-4001-aac0-87603c8ea18f&isTrimmed=true').send().set(headers);
    // const response = await request.get('/waveform?tag=0c5ffe6f-5471-4612-bfe4-d6c93518a640&bars=10').send().set(headers);
    // const response = await request.get('/categories').send().set(headers);
    // const response = await request.post('/create').send({ user_id: '0sbfQ2A1DCU79XbPiuYpCy4NhAx2', tag: 'e73a0907-60e7-47ed-b278-917f401f93dc', caption: 'Done', category: 'music', isTrimmed: false }).set(headers);
    // const response = await request.post('/listen').send({ user_id: '0sbfQ2A1DCU79XbPiuYpCy4NhAx2', drop_id: 1 }).set(headers);
    // const response = await request.post('/like').send({ user_id: 1, drop_id: 1 }).set(headers);
    // const response = await request.get('/drops?offset=0&limit=10&category=comedy&category=convo').send().set(headers);
    // const response = await request.get('/drops/user/0sbfQ2A1DCU79XbPiuYpCy4NhAx2?offset=0&limit=10&category=comedy&category=convo').send().set(headers);
    // const response = await request.get('/drops/1'/*/drops/e73a0907-60e7-47ed-b278-917f401f93dc*/).send().set(headers);
    // const response = await request.post('/filter/duet').send({
    //   current: { user_id: '0sbfQ2A1DCU79XbPiuYpCy4NhAx2', tag: '00ba23bd-17e1-4001-aac0-87603c8ea18f', isTrimmed: true, },
    //   owner: { user_id: '0sbfQ2A1DCU79XbPiuYpCy4NhAx2', tag: '00ba23bd-17e1-4001-aac0-87603c8ea18f' } }).set(headers); //0b73a901-f4d3-4476-a3ac-cb2d343c228d
    // const response = await request.get('/featured').send().set(headers);
    // const response = await request.post('/authenticate').send({ username: 'sean', uid: '0sbfQ2A1DCU79XbPiuYpCy4NhAx2' }).set(headers);
    // const response = await request.get('/analytics').send().set(adminHeaders);
    // console.log(response.body);


    // const Analytics = require('./services/Analytics').default;
    // const analytics = new Analytics();
    // console.log(await analytics.generateCSV());
  }
}, 1500);
