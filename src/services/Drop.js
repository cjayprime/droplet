import fs from 'fs';
import path from 'path';
import {Lame} from 'node-lame';
import {v4 as uuidv4} from 'uuid';
import {Storage} from '@google-cloud/storage';

import AudioEngine from './AudioEngine';

import {Audio as AudioModel, Drop as DropModel, Category as CategoryModel} from '../models';

class Drop {
  recording = {
    min: 2,
    max: 60,
  };

  /**
   * Trim an audio file, identified by `tag`
   *
   * @param {*} tag     The audio tag to trim
   * @param {*} start   The start time to begin the trim from (inclusive)
   * @param {*} end     The end time to stop the trim at (inclusive)
   * @returns
   */
  trim = async (tag, start, end) => {
    const recording = await AudioEngine.getFile(tag);
    const audioEngine = new AudioEngine(recording, 'buffer');
    const data = await audioEngine.getProcessedData();

    console.log('TRIM RANGE:', start, end);
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

    // ------
    // After this, then the following is true:
    // const enc = new TextDecoder("utf-8");
    // enc.decode(newData.slice(44)) === enc.decode(bodyData)
    // ------

    // CONVERT BACK TO MP3 AND SEND, WITH A NEW DROP ID
    // TODO: Lame appears slow, find an alternative
    const mp3File = AudioEngine.directory(tag, true);
    // NOTE: Lame will create the file
    const encoder = new Lame({
      output: mp3File,
      bitrate: 192,
      'little-endian': true,
      mp3Input: false,
      quality: 9,
    }).setBuffer(Buffer.from(newData.buffer));

    const resolved = await encoder.encode()
      .then(() => {
        (async () => {
          await AudioModel.update({
            trimmed: '1',
          }, {where: {tag}}).catch((e) => console.log('Couldn\'nt update trim to "1" for', tag, e));
        })();
        return true;
      })
      .catch((e) => {
        console.log(e);
        return false;
      });

    if (resolved){
      return {
        code: 200,
        message: 'Successfully trimmed your drop',
        data: {start, end, tag},
      };
    }

    return {
      code: 400,
      message: 'Unfortunately we were unable to trim your drop.',
      data: {},
    };
  }

  /**
   * Download an audio file, identified by `tag`, useful for playback
   *
   * @param {Express.Response}  res         The Express Resonse object
   * @param {String}            tag         The tagged audio to download
   * @param {Boolean}           isTrimmed   If the trimmed version should be downloaded
   * @returns ResponseObject
   */
  download = async (res, tag, isTrimmed) => {
    try {
      const mp3File = await AudioEngine.directory(tag, isTrimmed);
      if (!fs.existsSync(mp3File)){
        return {
          code: 404,
          message: 'We were unable to find the file.',
          data: {},
        };
      }
      res.download(mp3File);
      return {
        alreadySent: true,
      };
    } catch {
      return {
        code: 404,
        message: 'An error occured.',
        data: {},
      };
    }
  }

  /**
   * Validate an audio recording,passed as a base64 string
   *
   * @param {String} user_id     Firebase uid
   * @param {String} recording   Audio recording encoded as base64
   * @param {String} type        The source of recording (not related to audio source channel), useful for analytics
   *                             possible values are `recording` and `upload`
   * @returns ResponseObject
   */
  validate = async (user_id, recording, source) => {
    const audioEngine = new AudioEngine(recording);
    const duration = await audioEngine.getDuration();

    if (duration <= this.recording.min) {
      return {
        code: 400,
        data: {},
        message: `Please record/select an audio file of between ${this.recording.min} and ${this.recording.max} seconds`,
      };
    }

    const tag = uuidv4();
    const success = await audioEngine.storeFile(tag);
    if (!success){
      return {
        code: 400,
        data: {tag, duration, code: 'too-long'},
        message: 'We are unable to process the reqyest completely.',
      };
    }

    await AudioModel.create({
      user_id,
      tag,
      duration,
      filesize: audioEngine.size,
      date: new Date(),
      source,
      trimmed: '0',
    });
    console.log({tag, duration});
    if (this.recording.max < duration) {
      return {
        code: 400, // 201,
        data: {tag, duration, code: 'too-long'},
        message: `Please record/select an audio file of between ${this.recording.min} and ${this.recording.max} seconds`,
      };
    }

    return {
      code: 200,
      data: {tag, duration, code: 'valid'},
      message: 'The audio file is valid',
    };
  }

  waveform = async (tag, bars) => {
    const recording = await AudioEngine.getFile(tag);
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

  create = async (user_id, tag, caption, categoryName, isTrimmed) => {
    const audio = await AudioModel.findOne({attributes: ['audio_id'], where: {tag}});
    if (audio === null){
      return {
        code: 400,
        message: 'The tag was not found.',
        data: {},
      };
    }

    let category_id = categoryName;
    if (isNaN(category_id)){
      const category = await CategoryModel.findOne({attributes: ['category_id'], where: {name: categoryName}});
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
    if (drop === null){
      return {
        code: 400,
        message: 'Unfortunately we failed to create your drop. Try again.',
        data: {drop},
      };
    }

    const pathToFile = path.join(
      __dirname,
      '../../google-services.json',
    );
    if (!fs.existsSync(pathToFile)){
      await fs.promises.writeFile(pathToFile, process.env.GOOGLE_KEYFILE, { flag: 'w' });
    }

    const storage = new Storage({
      projectId: process.env.GOOGLE_PROJECT_ID,
      keyFilename: pathToFile,
    });
    const file = AudioEngine.directory(tag, isTrimmed);
    await storage.bucket(process.env.GOOGLE_BUCKET_NAME).upload(file, {
      destination: tag,
    });
    await storage.bucket(process.env.GOOGLE_BUCKET_NAME).file(file).makePublic();

    return {
      code: 200,
      message: 'Successfully created your drop.',
      data: {drop},
    };
  }
}

export default Drop;
