import fs from 'fs';
import path from 'path';
import { Lame } from 'node-lame';
import { v4 as uuidv4 } from 'uuid';
import { Storage } from '@google-cloud/storage';
import { Op } from 'sequelize';

import AudioEngine from './AudioEngine';
import UserService from './User';

import {
  User as UserModel,
  Audio as AudioModel,
  Drop as DropModel,
  Cloud as CloudModel,
  SubCloud as SubCloudModel,
  Like as LikeModel,
  Listen as ListenModel,
} from '../models';
import { Notify } from '../shared';

class Drop {
  recording = {
    min: 2,
    max: 90,
  };

  /**
   * Trim an audio file, identified by `tag`
   *
   * @param {*} tag     The audio tag to trim
   * @param {*} start   The start time to begin the trim from (inclusive)
   * @param {*} end     The end time to stop the trim at (inclusive)
   * @param {*} filter  The filter to trim, rather than the original audio
   * @returns
   */
  trim = async (tag, start, end, filter) => {
    const recording = await AudioEngine.getFile(tag, null, filter);
    const audioEngine = new AudioEngine(recording, 'buffer');
    const data = await audioEngine.getProcessedData(audioEngine.buffer);
    const duration = await audioEngine.getDuration(data) / 1000;

    console.log('TRIM RANGE:', start, end);
    if (start >= end || start >= duration || end > duration) {
      return {
        message: 'The trimming range selected is invalid.',
        data: { start, end },
        code: 400,
      };
    }

    // Translate the seconds mark to bytes
    const WAV_HEADER_OFFSET = 44;
    // const newStart = start >= 0 && start <= end ? WAV_HEADER_OFFSET + Math.floor(2 * data.numberOfChannels * data.sampleRate * start) : undefined;
    const newStart = WAV_HEADER_OFFSET + Math.floor(2 * data.numberOfChannels * data.sampleRate * start);
    // const newEnd = end > 0 ? WAV_HEADER_OFFSET + Math.floor(2 * data.numberOfChannels * data.sampleRate * end) : undefined;
    const newEnd = WAV_HEADER_OFFSET + Math.floor(2 * data.numberOfChannels * data.sampleRate * end);
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
    // const enc = new TextDecoder('utf-8');
    // console.log('Are equal', enc.decode(newData.slice(44)) === enc.decode(bodyData));
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
            duration: 1000 * (end - start),
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
   * @param {Boolean}           extension   Download extension
   * @returns ResponseObject
   */
  download = async (res, tag, isTrimmed, filter, extension) => {
    try {
      const mp3File = await AudioEngine.directory(tag, isTrimmed, filter, extension);
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
    const duration = await audioEngine.getDuration() / 1000;
    if (!duration) {
      return {
        code: 400,
        data: {},
        message: 'Sorry, we could not process the file.',
      };
    }

    const message = `Please record/select an audio file of between ${this.recording.min} and ${this.recording.max} seconds`;
    if (duration <= this.recording.min) {
      return {
        code: 400,
        data: { duration, code: 'too-short' },
        message,
      };
    } else if (duration > this.recording.max) {
      return {
        code: 400,
        data: { duration, code: 'too-long' },
        message,
      };
    }

    const tag = uuidv4();
    const success = await audioEngine.storeFile(tag);
    if (!success){
      return {
        code: 400,
        data: { tag, duration, code: 'too-long' },
        message: 'We are unable to process the request completely.',
      };
    }

    await AudioModel.create({
      user_id: user.user_id,
      tag,
      duration: duration * 1000,
      filesize: audioEngine.size,
      date: new Date(),
      source,
      trimmed: '0',
    });

    return {
      code: 200,
      data: { tag, duration, code: 'valid' },
      message: 'The audio file is valid',
    };
  }

  waveform = async (tag, bars, filter) => {
    const recording = await AudioEngine.getFile(tag, null, filter);
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

  loadClouds = async () => {
    const clouds = await CloudModel.findAll({ where: { status: '1' }, });
    if (clouds.length === 0) {
      return {
        code: 400,
        message: 'No clouds were found',
        data: [],
      };
    }

    const all = {};
    clouds.map(cloud => all[cloud.cloud_id] = cloud.get());
    return {
      code: 200,
      message: 'Clouds successfully loaded',
      data: clouds,
      all,
    };
  }

  loadSubClouds = async () => {
    const subClouds = await SubCloudModel.findAll({
      where: { status: '1' },
      order: [
        ['order', 'ASC'],
      ],
    });
    if (subClouds.length === 0) {
      return {
        code: 400,
        message: 'No sub clouds were found',
        data: [],
      };
    }

    return {
      code: 200,
      message: 'Sub clouds successfully loaded',
      data: subClouds,
    };
  }

  /**
   * Creates a new drop
   *
   * @param {BigInt}  user_id
   * @param {UUID}    tag
   * @param {String}  caption
   * @param {String}  subCloudName    A sub cloud name or id
   * @param {Boolean} isTrimmed   
   * @param {Boolean} filter
   * @param {Date}    date            A JS Date object to use in creating drops
   * @returns ResponseObject
   */
  create = async (user_id, tag, caption, subCloudName, isTrimmed, filter, date) => {
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

    let sub_cloud_id = subCloudName;
    if (isNaN(sub_cloud_id)){
      const subCloud = await SubCloudModel.findOne({ attributes: ['sub_cloud_id'], where: { name: subCloudName } });
      if (subCloud === null){
        return {
          code: 400,
          message: 'The sub cloud (' + subCloudName + ') does not exist.',
          data: { tag, subCloud: subCloudName },
        };
      }
      sub_cloud_id = subCloud.sub_cloud_id;
    }

    const user = await UserModel.findOne({ where: { ...UserService.searchForUser(user_id) }  });
    if (user === null) {
      return {
        code: 400,
        message: 'The user does not exist.',
        data: { tag },
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

    const drop = await DropModel.create({
      user_id: user.user_id,
      audio_id: audio.audio_id,
      sub_cloud_id,
      caption,
      status: '1',
      date: date || new Date(),
    });
    if (drop === null){
      return {
        code: 400,
        message: 'Unfortunately we failed to create your drop. Try again.',
        data: { drop, tag },
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
   * @param {String} extension        The extension to append when uploading/downloading
   * @param {String} from             Where to upload/download from
   * @returns
   */
  static bucket = async (command = 'upload', localFilePath, remoteFileName, extension = 'mp3', from = 'gcp') => {
    let pathToFile;
    let bucket = '';
    if (from === 'gcp') {
      bucket = process.env.GOOGLE_BUCKET_NAME;
      pathToFile = path.join(
        __dirname,
        '../../google-services.json',
      );
      if (!fs.existsSync(pathToFile)){
        fs.writeFileSync(pathToFile, process.env.GOOGLE_KEYFILE, { flag: 'w' });
      }
    } else if (from === 'firebase') {
      bucket = process.env.FIREBASE_BUCKET_NAME;
      pathToFile = path.join(
        __dirname,
        '../../firebase-services.json',
      );
      if (!fs.existsSync(pathToFile)){
        fs.writeFileSync(pathToFile, process.env.FIREBASE_KEYFILE, { flag: 'w' });
      }
    }

    try {
      const storage = new Storage({
        projectId: process.env.GOOGLE_PROJECT_ID,
        keyFilename: pathToFile,
      });
      const bucketFile = await storage.bucket(bucket);
      let options = {
        destination: '',
      };
      if (command === 'upload') {
        options.destination = remoteFileName + (extension ? '.' + extension : ''),
        await bucketFile.upload(localFilePath, options);
      } else if (command === 'download') {
        const exists = await bucketFile.file(remoteFileName + (extension ? '.' + extension : '')).exists();
        if (!exists || !exists[0]) {
          return false;
        }
        options.destination = localFilePath;
        await bucketFile.file(remoteFileName + (extension ? '.' + extension : '')).download(options);
      } else {
        return false;
      }
      return true;
    } catch (e) {
      Notify.error(e);
      Notify.info((command.toUpperCase()) + '-ERROR: Unable to ' + command + (command === 'upload' ? ' to' : ' from' ) + ' Google bucket, see the issue on Sentry.');
      return false;
    }
  }

  featured = () => {
    return {
      code: 200,
      data: {
        users: {
          'yanniet': {
            'category': 'convo',
            'desc': 'Music YouTuber and Stanford student'
          },
          'arpi': {
            'category': 'comedy',
            'desc': 'Stanford YouTuber'
          },
          'elenatheodora': {
            'category': 'music',
            'desc': 'Stanford and NYU Music Technology PHD'
          },
          'doubleohjohn': {
            'category': 'music',
            'desc': 'Musician, beatboxer, creative'
          },
          'dave': {
            'category': 'comedy',
            'desc': 'Harvard Student, best dad jokes ever'
          },     
        }
      },
      message: 'Successfully retrieved the featured list'
    };
  }

  /**
   * Like a drop
   * 
   * @param {BigInt} uid 
   * @param {BigInt} drop_id 
   * @returns 
   */
  like = async (uid, drop_id) => {
    const user = await UserModel.findOne({ where: { ...UserService.searchForUser(uid) }  });
    if (!user) {
      return {
        code: 400,
        message: 'The user does not exist.',
        data: {},
      };
    }

    const drop = await DropModel.findOne({ where: { drop_id } });
    if (!drop) {
      return {
        code: 400,
        message: 'The drop does not exist.',
        data: {},
      };
    }

    // If you've previously liked then this is an unlike action
    const user_id = user.user_id;
    const like = await LikeModel.findOne({ where: { user_id, drop_id } });
    const [newLike] = await LikeModel.upsert({
      like_id: like && like.like_id ? like.like_id : null,
      user_id,
      drop_id,
      status: like && like.status === '1' ? '0' : '1',
      date: new Date(),
    });

    if (newLike.drop_id != drop_id) {
      return {
        code: 400,
        data: {},
        message: 'Unable to record like.',
      };
    }

    const likes = await LikeModel.count({
      where: { drop_id: newLike.drop_id, status: '1' },
    });
    return {
      code: 200,
      data: { liked: newLike.status === '1', likes },
      message: 'Successfully recorded the ' + (newLike.status === '1' ? 'like' : 'unlike') + '.',
    };
  }

  /**
   * Get a single drop by audio_id, tag or drop_id AND optionally
   * check if `user_id` has listened or liked it
   * 
   * @param {BigInt|UUID} audio_idORtagORdrop_id    An audio_id, audio tag, or drop_id
   * @param {BigInt}      user_id                   A user's id
   * @param {Enum}        getBy                     Flag - whether to treat `audio_idORtagORdrop_id` as an audio_id or drop_id
   * @returns 
   */
  single = async (audio_idORtagORdrop_id, user_id, getBy) => {
    const tag = audio_idORtagORdrop_id;
    let options = {
      include: UserService.includeForUser,
      where: {
        status: '1',
        [Op.or]: getBy === 'drop_id' ? [
          { drop_id: tag },
          { '$audio.tag$': tag },
        ] : [
          { '$audio.audio_id$': tag },
          { '$audio.tag$': tag },
        ],
      },
      limit: 1,
    };

    return await this.feed(user_id, null, null, 0, options);
  }

  /**
   * Update a drop
   * 
   * @param {BigInt|UUID} drop_id    An audio_id, audio tag, or drop_id
   * @param {BigInt}      caption    The drop's caption
   * @param {BigInt}      status    The drop's status
   * @returns 
   */
  update = async (drop_id, caption, status = '1') => {
    const [drop] = await DropModel.update({
      caption,
      status: status + '',
    },{
      where: {
        drop_id,
        status: '1',
      },
    }).catch(() => null);

    if (!drop) {
      return {
        code: 400,
        message: 'Unable to update the drop.' + (status == '0' ? ' You have already deleted it.' : ''),
        data: {},
      };
    }
    
    return {
      code: 200,
      message: 'Successfully updated the drop.',
      data: {},
    };
  }

  /**
   * Display the application feed
      // ALGORITHMS
      // 1. gauss-ranking
      // result_n = gaussFn() * log(like_n + comment_n)10

      // 2. followers-following-personalization
      //

      // 3. -----
      // sort(drops) for largest comments
      // sort(drops) for largest likes
      // Math.pow(S.D, 2) = Math.pow(C, 2)
      // f =  Math.exponential   (1 / (S.D * Math.root(2 * Math.PI)))

      // public static double gaussian(double x, double mean, double sigma)
      // {
      //   double norm = 1 / (sigma * Math.sqrt(2 * Math.PI));
      //   double  is = 1 / sigma;
      //   double i2s2 = 0.5 * is * is;
      //   double xMinusMean = x - mean;
      //   return norm * Math.exp(-xMinusMean * xMinusMean * i2s2);
      // }
   * @param {*} signedInUserID 
   * @param {*} selectForUserID 
   * @param {*} limit 
   * @param {*} offset 
   * @param {*} opt 
   * @param {Array|String} subCloud   A string or array of sub cloud names or ids 
   * @returns 
   */
  feed = async (signedInUserID, selectForUserID, limit = 10, offset = 0, opt, subCloud) => {
    let options = opt;
    if (!options) {
      const where = subCloud ? { status: '1', [Op.or]: { '$sub_cloud.name$': { [Op.in]: subCloud }, '$sub_cloud.sub_cloud_id$': { [Op.in]: subCloud } } } : { status: '1', };
      options = {
        where,
        include: UserService.includeForUser,
        nest: true,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        order: [
          ['date', 'DESC'],
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
    const total = await DropModel.count(options);
    const clouds = await this.loadClouds();
    if (drops === null || !clouds.all) {
      return {
        code: 200,
        message: 'There are no drops to display within this range.',
        data: { drops: [] },
      };
    }

    UserService.generateAssociation({}, UserModel, LikeModel);
    UserService.generateAssociation({}, UserModel, ListenModel);
    const dropsArray = await Promise.all(
      drops.map(async drop => {
        const dropData = drop.get();

        // Clouds
        dropData['cloud'] = clouds.all[dropData.sub_cloud.cloud_id];

        // Likes
        // Count all likes (whether or not it's the user making this request)
        const likes = await LikeModel.count({
          where: { drop_id: dropData.drop_id, status: '1' },
        });
        // Get the like for only the user making this request
        const liked = !signedInUserID ? false : await LikeModel.findOne({
          where: { drop_id: dropData.drop_id, status: '1', ...UserService.searchForUser(signedInUserID) },
          include: [{ model: UserModel, required: true }],
        });

        // Listens
        // Count all listens (whether or not it's the user making this request)
        const listens = await ListenModel.count({
          where: { drop_id: dropData.drop_id },
        });
        // Get the listens for only the user making this request
        const listened = !signedInUserID ? false : await ListenModel.findOne({
          where: { drop_id: dropData.drop_id, ...UserService.searchForUser(signedInUserID) },
          include: [{ model: UserModel, required: true }],
        });
        return {
          ...dropData,
          likes: likes,
          liked: !!(liked && liked.status === '1'),
          listens,
          listened: !!listened
        };
      })
    );

    return {
      code: 200,
      message: 'Successfully loaded drops.',
      data: {
        drops: [...dropsArray],
        page: ((offset * limit) / limit) + 1,
        total,
      },
    };
  }
}

export default Drop;
