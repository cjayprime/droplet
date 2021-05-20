import fs from 'fs';
import path from 'path';
import { Lame } from 'node-lame';
import { v4 as uuidv4 } from 'uuid';
import { Storage } from '@google-cloud/storage';
import { Op } from 'sequelize';

import AudioEngine from './AudioEngine';
import UserService from './User';

import { User as UserModel, Audio as AudioModel, Drop as DropModel, Category as CategoryModel, Like as LikeModel, Listen as ListenModel } from '../models';
import { Notify } from '../shared';

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
  trim = async (tag, start, end, filter) => {
    const recording = await AudioEngine.getFile(tag, null, filter);
    const audioEngine = new AudioEngine(recording, 'buffer');
    const data = await audioEngine.getProcessedData();
    const duration = await audioEngine.getDuration(data);

    console.log('TRIM RANGE:', start, end);
    if (start >= end || start >= duration || end > duration){
      return {
        message: 'The trimming range selected is invalid.',
        data: { start, end },
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
          }, { where: { tag } }).catch((e) => console.log('Couldn\'t update trim to "1" for', tag, e));
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
        message: 'Successfully trimmed your drop, you can now download it (GET /download?isTrimmed=true&tag=' + tag + ')',
        data: { start, end, tag },
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
   * @param {Boolean}           filter      If to download the filter made from the audio (identified by `tag`)
   * @returns ResponseObject
   */
  download = async (res, tag, isTrimmed, filter) => {
    try {
      const mp3File = await AudioEngine.directory(tag, isTrimmed, filter);
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
    const user = await UserModel.findOne({ where: { ...UserService.searchForUser(user_id) }  });
    if (user === null) {
      return {
        code: 400,
        message: 'The user does not exist.',
        data: {},
      };
    }

    const audioEngine = new AudioEngine(recording);
    const duration = await audioEngine.getDuration();
    if (!duration) {
      return {
        code: 400,
        data: {},
        message: 'Sorry, we could not process the file.',
      };
    } else if (duration <= this.recording.min) {
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
        data: { tag, duration, code: 'too-long' },
        message: 'We are unable to process the reqyest completely.',
      };
    }

    await AudioModel.create({
      user_id: user.user_id,
      tag,
      duration,
      filesize: audioEngine.size,
      date: new Date(),
      source,
      trimmed: '0',
    });
    if (this.recording.max < duration) {
      return {
        code: 400, // 201,
        data: { tag, duration, code: 'too-long' },
        message: `Please record/select an audio file of between ${this.recording.min} and ${this.recording.max} seconds`,
      };
    }

    return {
      code: 200,
      data: { tag, duration, code: 'valid' },
      message: 'The audio file is valid',
    };
  }

  waveform = async (tag, bars) => {
    const recording = await AudioEngine.getFile(tag);
    if (!recording) {
      return {
        code: 404,
        message: 'We were unable to find the file.',
        data: {},
      };
    }
    const audioEngine = new AudioEngine(recording, 'buffer');
    const waveform = await audioEngine.getWaveform(bars, 'full-width-per-second');
    if (waveform.length === 0){
      return {
        code: 400,
        data: { waveform: [] },
        message: 'The waveform could not be generated',
      };
    }

    return {
      code: 200,
      data: { waveform },
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

  /**
   * Creates a new drop
   *
   * @param {BigInt}  user_id
   * @param {UUID}    tag
   * @param {String}  caption
   * @param {String}  categoryName    A category name or id
   * @param {Boolean} isTrimmed
   * @param {Boolean} filter
   * @param {Date}    date            A JS Date object to use in creating drops
   * @returns ResponseObject
   */
  create = async (user_id, tag, caption, categoryName, isTrimmed, filter, date) => {
    if (caption.length > 70) {
      return {
        code: 400,
        message: 'The caption must be less than 70 characters.',
        data: { tag },
      };
    }

    const audio = await AudioModel.findOne({ attributes: ['audio_id'], where: { tag } });
    if (audio === null) {
      return {
        code: 400,
        message: 'The tag was not found.',
        data: { tag },
      };
    }

    let category_id = categoryName;
    if (isNaN(category_id)){
      const category = await CategoryModel.findOne({ attributes: ['category_id'], where: { name: categoryName } });
      if (category === null){
        return {
          code: 400,
          message: 'The category does not exist.',
          data: { tag },
        };
      }
      category_id = category.category_id;
    }

    const user = await UserModel.findOne({ where: { ...UserService.searchForUser(user_id) }  });
    if (user === null) {
      return {
        code: 400,
        message: 'The user does not exist.',
        data: { tag },
      };
    }

    const drop = await DropModel.create({
      user_id: user.user_id,
      audio_id: audio.audio_id,
      category_id,
      caption,
      date: date || new Date(),
    });
    if (drop === null){
      return {
        code: 400,
        message: 'Unfortunately we failed to create your drop. Try again.',
        data: { drop, tag },
      };
    }

    const fileName = AudioEngine.directory(tag, isTrimmed, filter);
    const uploaded = await Drop.bucket('upload', fileName, tag);
    if (!uploaded) {
      return {
        code: 400,
        message: 'Unable to store the drop.',
        data: { tag },
      };
    }

    return {
      code: 200,
      message: 'Successfully created your drop.',
      data: { drop, tag },
    };
  }

  /**
   * Upload/Download a file to/from Droplet's bucket (currently at GCP)
   *
   * @param {String} command          Action to take on the file path and name passed as
   *                                  parameters (possible values are upload and download)
   * @param {String} localFilePath    The local file path, just a tag, including format
   * @param {String} remoteFileName   The remote file name, just a tag, excluding format
   * @returns
   */
  static bucket = async (command = 'upload', localFilePath, remoteFileName) => {
    const extension = 'mp3';
    const pathToFile = path.join(
      __dirname,
      '../../google-services.json',
    );
    if (!fs.existsSync(pathToFile)){
      await fs.promises.writeFile(pathToFile, process.env.GOOGLE_KEYFILE, { flag: 'w' });
    }

    try {
      const storage = new Storage({
        projectId: process.env.GOOGLE_PROJECT_ID,
        keyFilename: pathToFile,
      });
      const bucketFile = await storage.bucket(process.env.GOOGLE_BUCKET_NAME);
      let options = {
        destination: '',
      };
      if (command === 'upload') {
        options.destination = remoteFileName + '.' + extension,
        await bucketFile.upload(localFilePath, options);
      } else if (command === 'download') {
        options.destination = localFilePath;
        await bucketFile.file(remoteFileName + '.' + extension).download(options);
      } else {
        return false;
      }
      return true;
    } catch (e) {
      Notify.error(e);
      Notify.info('UPLOAD-ERROR: Unable to save to Google bucket, see the issue on Sentry.');
      return false;
    }
  }

  featured = () => {
    return {
      code: 200,
      data: {
        users: {
          'arpi': {
            'category': 'comedy',
            'desc': 'guess'
          },
          'drelizabeth': {
            'category': '',
            'desc': 'Sample bio2'
          },
          'goodluigi': {
            'category': 'music',
            'desc': 'hello!'
          },
          'cyan': {
            'category': 'convo',
            'desc': 'stanford student and youtuber!'
          },
          'yanniet': {
            'category': 'convo',
            'desc': 'yannie is a composer at heart, and an ella fitzgerald lover'
          },
        }
      },
      message: 'Successfully retrieved the featured list'
    };
  }

  single = async (tagORdrop_id) => {
    const tag = tagORdrop_id;
    let options = {
      include: UserService.includeForUser,
      where: {
        [Op.or]: [
          { '$audio.tag$': tag },
          { drop_id: tag },
        ]
      }
    };

    return await this.feed(null, null, null, null, options);
  }

  feed = async (signedInUserID, selectForUserID, limit, offset, opt, category) => {
    let options = opt;
    if (!options) {
      const where = category ? { [Op.or]: { '$category.name$': { [Op.in]: category }, category_id: { [Op.in]: category } } } : {};
      options = {
        where,
        include: UserService.includeForUser,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        order: [
          ['drop_id', 'DESC'],
        ],
      };
      if (selectForUserID) {
        options.where = {
          ...where,
          ...UserService.searchForUser(selectForUserID)
        };
      }
    }

    UserService.associateForUser();
    const drops = await DropModel.findAll(options);
    if (drops === null) {
      return {
        code: 200,
        message: 'There are no drops to display within this range.',
        data: { drops: [] },
      };
    }

    UserService.generateAssociation(UserModel, LikeModel);
    UserService.generateAssociation(UserModel, ListenModel);
    const dropsArray = await Promise.all(
      drops.map(async drop => {
        const dropData = drop.get();
        // Likes
        // Count all likes (whether or not it's the user making this request)
        const likes = await LikeModel.count({
          where: { drop_id: dropData.drop_id },
        });
        // Get the like for only the user making this request
        const liked = await LikeModel.findOne({
          where: { drop_id: dropData.drop_id, ...UserService.searchForUser(signedInUserID) },
          include: [{ model: UserModel, required: true }],
        });

        // Listens
        // Count all listens (whether or not it's the user making this request)
        const listens = await ListenModel.count({
          where: { drop_id: dropData.drop_id },
        });
        // Get the listens for only the user making this request
        const listened = await ListenModel.findOne({
          where: { drop_id: dropData.drop_id, ...UserService.searchForUser(signedInUserID) },
          include: [{ model: UserModel, required: true }],
        });
        return { ...dropData, likes: likes, liked: !!(liked && liked.status === '1'), listens, listened: !!listened };
      })
    );
    return {
      code: 200,
      message: 'Successfully loaded drops.',
      data: { drops: [...dropsArray] },
    };
  }
}

export default Drop;
