import fs from 'fs';
import {Lame} from 'node-lame';
import {v4 as uuidv4} from 'uuid';

import AudioEngine from './AudioEngine';

import {Audio as AudioModel, Drop as DropModel, Category as CategoryModel} from '../models';

class Drop {
    trim = async (dropID, start, end) => {
      const recording = await AudioEngine.getFile(dropID);
      const audioEngine = new AudioEngine(recording, 'buffer');
      const data = await audioEngine.getProcessedData();

      console.log('TRIM RANGE:', start, end, start === end);
      if (start === end || !((start >= 0 && start <= end) || end > 0)){
        return {
          message: 'The audio range selected is invalid',
          data: {start, end},
          code: 400,
        };
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
      const mp3File = AudioEngine.directory(dropID, true);
      // NOTE: Lame will create the file
      const encoder = new Lame({
        output: mp3File,
        bitrate: 192,
        'little-endian': true,
        mp3Input: false,
        quality: 9,
      }).setBuffer(Buffer.from(newData.buffer));

      const resolved = await encoder.encode()
        .then(() => true)
        .catch((e) => {
          console.log(e);
          return false;
        });

      if (resolved){
        return {
          code: 200,
          message: 'Successfully trimmed your drop',
          data: {start, end, dropID},
        };
      }

      return {
        code: 400,
        message: 'Unfortunately we were unable to trim your drop.',
        data: {},
      };
    }

    download = async (res, dropID, isTrimmed) => {
      try {
        const mp3File = await AudioEngine.directory(dropID, isTrimmed);
        if (!fs.existsSync(mp3File)){
          return {
            code: 404,
            message: 'We were unable to find the file.',
            data: {},
          };
        }
        res.download(mp3File);
      } catch {
        return {
          code: 404,
          message: 'An error occured.',
          data: {},
        };
      }
    }

    validate = async (recording) => {
      const audioEngine = new AudioEngine(recording);
      const duration = await audioEngine.getDuration();
      const maxTime = 60;

      if (maxTime < duration && duration <= 0) {
        return {
          code: 400,
          data: {},
          message: 'Please record/select an audio file of between 1 and 60 seconds',
        };
      }
      const dropID = uuidv4();
      await audioEngine.storeFile(dropID);
      console.log({dropID, duration});
      return {
        code: 200,
        data: {dropID, duration},
        message: 'The audio file is valid',
      };
    }

    waveform = async (dropID, bars) => {
      const recording = await AudioEngine.getFile(dropID);
      const audioEngine = new AudioEngine(recording, 'buffer');
      const waveform = await audioEngine.getWaveform(bars, 'full-width-per-second');
      if (waveform.length === 0){
        return {
          code: 400,
          data: {waveform: []},
          message: 'The waveform could not be generated',
        };
      }

      return {
        code: 200,
        data: {waveform},
        message: 'Waveform successfully generated',
      };
    }

    loadCategories = async () => {
      const categories = await CategoryModel.findAll();
      if (categories.length === 0) {
        return {
          code: 400,
          message: 'Categories weren\'t found',
          data: [],
        };
      }

      return {
        code: 200,
        message: 'Categories successfully loaded',
        data: categories,
      };
    }

    create = async (user_id, tag, caption, categoryName) => {
      const audio = await AudioModel.findOne({where: {tag}});
      if (audio === null){
        return {
          code: 400,
          message: 'The tag was not found.',
          data: {},
        };
      }

      let category_id = categoryName;
      if (isNaN(category_id)){
        const category = await CategoryModel.findOne({attributes: ['audio_id'], where: {name: categoryName}});
        if (category.length === null){
          return {
            code: 400,
            message: 'The category does not exist.',
            data: {},
          };
        }
        category_id = category.category_id;
      }

      const drop = await DropModel.create({
        user_id,
        audio_id: audio.audio_id,
        category_id,
        caption,
        date: new Date(),
      });
      console.log(drop);
      if(drop === null){
        return {
          code: 400,
          message: 'Unfortunately we failed to create your drop. Try again.',
          data: {drop},
        };
      }

      return {
        code: 200,
        message: 'Successfully created your drop.',
        data: {drop},
      };
    }
}

export default Drop;
