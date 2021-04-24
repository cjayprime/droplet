import fs from 'fs';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
const morgan = require('morgan');
import {v4 as uuidv4} from 'uuid';
import {Lame} from 'node-lame';

import {Audio as AudioService} from './service';


const app = express();
const port = 3000;

app.use(morgan('combined'));

app.use(bodyParser.json({type: 'json', limit: '100mb'}));

app.use(cors());

app.get('/download', async (req, res) => {
  const {query: {dropID, isTrimmed}} = req;
  try {
    const mp3File = await AudioService.directory(dropID, isTrimmed);
    if(!fs.existsSync(mp3File)){
      return res.status(404).json({
        message: 'We were unable to find the file.',
        data: {},
        status: false,
      });
    }
    res.download(mp3File);
  } catch {
    return res.status(404).json({
      message: 'An error occured.',
      data: {},
      status: false,
    });
  }
});

app.put('/trim', async (req, res) => {
  const {body: {dropID, start, end}} = req;
  const recording = await AudioService.getFile(dropID);
  const audioService = new AudioService(recording, 'buffer');
  const data = await audioService.getProcessedData();

  console.log('TRIM RANGE:', start, end, start === end);
  if(start === end || !((start >= 0 && start <= end) || end > 0)){
    return res.status(400).json({
      message: 'The audio range selected is invalid',
      data: {start, end},
      status: false,
    });
  }

  // TRIM
  const WAV_HEADER_OFFSET = 44;
  const newStart = start >= 0 && start <= end ? WAV_HEADER_OFFSET + Math.floor(2 * data.numberOfChannels * data.sampleRate * start) : undefined;
  const newEnd = end > 0 ? WAV_HEADER_OFFSET + Math.floor(2 * data.numberOfChannels * data.sampleRate * end) : undefined;
  const headerData = new Uint8Array(data.wav.slice(0, WAV_HEADER_OFFSET));
  const bodyData = new Uint8Array(data.wav.slice(
    newStart,
    newEnd,
  ));
  const newData = new Uint8Array(headerData.length + bodyData.length);
  newData.set(headerData);
  newData.set(bodyData, headerData.length);

  // After this, then the following is true:
  // const enc = new TextDecoder("utf-8");
  // enc.decode(newData.slice(44)) === enc.decode(bodyData)

  // CONVERT BACK TO MP3 AND SEND, WITH A NEW DROP ID
  // TODO: Lame appears slow, find an alternative
  const mp3File = AudioService.directory(dropID, true);
  // NOTE: Lame will create the file
  const encoder = new Lame({
    output: mp3File,
    bitrate: 192,
    'little-endian': true,
    mp3Input: false,
    quality: 9,
  }).setBuffer(Buffer.from(newData.buffer));

  await encoder.encode()
  .then(() => {
    res.status(200).json({
      status: true,
      message: 'Successfully trimmed your drop',
      data: {start, end, dropID},
    });
  })
  .catch((e) => {
    console.log(e);
    res.status(400).json({
      status: false,
      message: 'Unfortunately we were unable to trim your drop.',
      data: {},
    });
  });
});

app.get('/waveform', async (req, res) => {
  const {query: {dropID, bars}} = req;
  const recording = await AudioService.getFile(dropID);
  const audioService = new AudioService(recording, 'buffer');
  const waveform = await audioService.getWaveform(bars, 'full-width-per-second');
  if(waveform.length === 0){
    return res.status(400).json({
      data: {waveform: []},
      message: 'The waveform could not be generated',
      status: false,
    });
  }

  res.status(200).json({
    data: {waveform},
    message: 'Waveform successfully generated',
    status: false,
  });
});

app.post('/validate', async (req, res) => {
  const {body: {recording}} = req;
  const audioService = new AudioService(recording);
  const duration = await audioService.getDuration();
  const maxTime = 60;

  if (maxTime < duration && duration <= 0) {
    return res.status(400).json({
      data: {},
      message: 'Please record/select an audio file of between 1 and 60 seconds',
      status: false,
    });
  }
  const dropID = uuidv4();
  await audioService.storeFile(dropID);
  console.log({dropID, duration});
  res.status(200).json({
    data: {dropID, duration},
    message: 'The audio file is valid',
    status: true,
  });
});

app.post('/save', async (req, res) => {
  // Ensure that saved audio matches all criteria
});

app.listen(port, () => {
  console.log(`Server is now running at http://localhost:${port}`)
});

(async () => {
  // const response = await require('supertest')(app).post('/trim').send({start: 35, end: 60, dropID: '24k'});
  // const response = await require('supertest')(app).get('/download?dropID=24k&isTrimmed=true').send();
  // console.log(response.body)
})();

export default app;
