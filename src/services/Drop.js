import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Storage } from '@google-cloud/storage';
import { Op } from 'sequelize';

import AudioEngine from './AudioEngine';
import UserService from './User';

import sequelize from '../models/base';
import {
  User as UserModel,
  Audio as AudioModel,
  Drop as DropModel,
  Cloud as CloudModel,
  SubCloud as SubCloudModel,
  Like as LikeModel,
  Listen as ListenModel,
  Group as GroupModel,
  Seen as SeenModel,
} from '../models';
import { Notify, promiseAll } from '../shared';

class Drop {
  recording = {
    min: 2,
    max: 90,
    soft: {
      min: 2,
      max: 90,
    },
    strict: true,
  };

  upload = {
    min: 2,
    max: 90,
    soft: {
      min: 2,
      max: 300,
    },
    strict: false,
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
    const resolved = AudioEngine.toMp3(newData.buffer, mp3File);
    if (resolved) {
      await AudioModel.update({
        trimmed: '1',
        duration: 1000 * (end - start),
      }, { where: { tag } }).catch((e) => console.log('Couldn\'t update trim to "1" for', tag, e));

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

    const audioSource = this[source];
    const max = audioSource.strict ? audioSource.max : audioSource.soft.max;
    const min = audioSource.strict ? audioSource.min : audioSource.soft.min;
    const message = `Please ${source === 'recording' ? 'record' : 'upload'} an audio file between ${min} and ${max} seconds.`;
    if (duration <= min) {
      return {
        code: 400,
        data: { duration, code: 'too-short' },
        message,
      };
    } else if (duration > max) {
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
      where: { status: '1', user_id: null },
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

  loadGroups = async (user_id) => {
    const memberships = await GroupModel.findAll({ where: { user_id, status: '1' } });
    return {
      code: 200,
      message: 'Groups successfully loaded',
      data: { memberships: !memberships ? [] : memberships.map(membership => membership.get().sub_cloud_id) },
    };
  }

  createSubCloud = async (user_id, cloud_id, name, description) => {
    const subClouds = await SubCloudModel.create({
      cloud_id,
      user_id,
      name,
      description,
      status: '1',
      order: '0',
      date: new Date(),
    });

    await GroupModel.create({
      sub_cloud_id: subClouds.sub_cloud_id,
      user_id,
      status: '1',
      date: new Date(),
    });
    return {
      code: 200,
      message: 'Sub cloud successfully created',
      data: subClouds,
    };
  }

  getSingleSubCloud = async (sub_cloud_id) => {
    const subClouds = await SubCloudModel.findOne({
      where: { sub_cloud_id },
    });
    if (subClouds.length === 0) {
      return {
        code: 400,
        message: 'No sub clouds were found',
        data: [],
      };
    }

    const users = await GroupModel.findAll({ where: { sub_cloud_id, status: '1' } });
    return {
      code: 200,
      message: 'Sub clouds successfully loaded',
      data: { sub_cloud: subClouds.get(), users: !users ? [] : users.map(user => user.get().user_id) },
    };
  }

  toggleUserInSubCloud = async (sub_cloud_id, users, status) => {
    if (!Array.isArray(users) || users.length === 0) {
      return {
        code: 400,
        message: 'No users were added to the cloud, because users were not selected.',
        data: {},
      };
    }

    const groups = [];
    const date = new Date();
    let count = await GroupModel.count({ where: { sub_cloud_id, } });
    await promiseAll(async user_id => {
      let group_id = 0;
      if (count < 100) {
        const user = await UserService.getUser(user_id);
        const [entry, created] = await GroupModel.findOrCreate({
          where: { sub_cloud_id, user_id: user.user_id, },
          defaults: { status, date, }
        });
        group_id = entry.group_id;
        groups.push({ entry, created });

        if (created) {
          count++;
        }
      } else {
        const user = await UserService.getUser(user_id);
        const entry = await GroupModel.findOne({
          where: { sub_cloud_id, user_id: user.user_id, },
        });
        group_id = !entry ? 0 : entry.group_id;
        groups.push({ entry, created: false });
      }

      if (group_id) {
        await GroupModel.update({ status: status === 1 ? '1' : '0' }, { where: { group_id } });
      }
    }, users);

    if (groups.length === 0) {
      return {
        code: 400,
        message: 'Users were not added to the cloud. An error occcured.',
        data: { group: groups },
      };
    }

    return {
      code: 200,
      message: 'Users were successfully ' + (status === 1 ? 'added to' : 'removed from') + ' the sub_cloud.',
      data: { group: groups },
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

    // Always save the original, or the duetted version of the trimmed version
    const fileName = AudioEngine.directory(tag, isTrimmed, isTrimmed ? undefined : filter);
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
      ranking: 9999999999,
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
            'category': 'music',
            'desc': 'a composer at heart, and an ella fitzgerald lover 🌙',
            'profilePicURL': '01iCSH6eAuRtpqugOj7X6CtHP5r2',
          },
          'arpi': {
            'category': 'convo',
            'desc': 'student and writer ✍🏼, occasional dancer 🕺',
            'profilePicURL': 'HhyE7Ogh0MVpyOui2zdV211lBKg2',
          },
          'elenatheodora': {
            'category': 'music',
            'desc': 'acapella enthusiast 🎶, music tech genius 🎧, duet master',
            'profilePicURL': '',
          },
          'jimmy': {
            'category': 'music',
            'desc': '#1 music producer and Dropper 🎹, Vandy ‘23',
            'profilePicURL': 'NpifdRRhFmVqYw7Va6N5lNkWGHF3',
          },
          'alix': {
            'category': 'blue',
            'desc': 'random thoughts enthusiast, occasionally funny 🥑',
            'profilePicURL': '6ZdSOakPWFYaZYUjxahNRNgZFn82',
          },
          'doubleohjohn': {
            'category': 'music',
            'desc': 'musician at heart 🎸, beatboxer 🥁, vocal mixer, creative all around',
            'profilePicURL': 'XfipHGrwn6TGoa6S4VQC1BSzyre2',
          },
          'dave': {
            'category': 'yellow',
            'desc': 'full time dad joker, part time harvard student 🍺',
            'profilePicURL': 'y2cg7CDIvncGNV0PQ1GLwXjiCSv1',
          },
        },
        featured:{
          'drop of the week': {
            dropIDs: [252],
          },
          'featured cloud': {
            cloudID: 6,
          },
          'top picks in convo': {
            dropIDs: [377, 75, 353],
            color: '#3894FF',
          },
          'top picks in music': {
            dropIDs: [371, 334, 140],
            color: '#B15EE1',
          },
          'top picks in comedy': {
            dropIDs: [369, 332, 288],
            color: '#FDB446',
          },
          'top picks in relax': {
            dropIDs: [21, 389, 292],
            color: '#3AC67B',
          },
          'sound meme of the week': {
            dropIDs: [17],
          },
        },
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
   * Mark a drop as seen
   * 
   * @param {BigInt} uid 
   * @param {BigInt} drop_id 
   * @returns 
   */
  seen = async (uid, drop_id) => {
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

    const user_id = user.user_id;
    const [newSeen] = await SeenModel.findOrCreate({
      where: { user_id, drop_id },
      defaults: { date: new Date() },
    });

    if (newSeen.drop_id != drop_id) {
      return {
        code: 400,
        data: {},
        message: 'Unable to record seen.',
      };
    }

    return {
      code: 200,
      data: { seen: true },
      message: 'Successfully recorded the seen.',
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

    // 3.
    // sort(drops) for largest comments
    // sort(drops) for largest likes
    // Math.pow(S.D, 2) = Math.pow(C, 2)
    // f =  Math.exponential   (1 / (S.D * Math.root(2 * Math.PI)))
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
      const where = subCloud ? { status: '1', [Op.or]: { '$sub_cloud.name$': { [Op.in]: subCloud }, '$sub_cloud.sub_cloud_id$': { [Op.in]: subCloud } } } : { status: '1', '$sub_cloud.user_id$': null, };
      options = {
        where,
        include: UserService.includeForUser,
        nest: true,
        group: ['drop.drop_id'],
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        order: [
          !selectForUserID && !subCloud ? ['ranking', 'DESC'] : ['date', 'DESC'],
        ],
      };
      if (selectForUserID) {
        options.where = {
          ...where,
          ...UserService.searchForUser(selectForUserID)
        };
      }
    }

    // GCP doesn't allow `GROUP BY` queries because `sql_mode` is set to `only_full_group_by` to fix it use:
    // SET SESSION sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''));
    // note that 'SESSION' should be 'GLOBAL' and thus permanent but GCP again doesn't give the necessary 
    // SUPER ADMIN permissions to make such a change
    await sequelize.query('SET SESSION sql_mode=(SELECT REPLACE(@@sql_mode,\'ONLY_FULL_GROUP_BY\',\'\'));');

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
    UserService.generateAssociation({}, UserModel, SeenModel);
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

        // Seen
        // Count all seen
        const seen = await SeenModel.count({
          where: { drop_id: dropData.drop_id, ...UserService.searchForUser(signedInUserID) },
          include: [{ model: UserModel, required: true }],
        });

        return {
          ...dropData,
          likes: likes,
          liked: !!(liked && liked.status === '1'),
          listens,
          listened: !!listened,
          seen: seen > 0,
        };
      })
    );

    return {
      code: 200,
      message: 'Successfully loaded drops.',
      data: {
        drops: [...dropsArray],
        page: ((offset * limit) / limit) + 1,
        total: total.length,
      },
    };
  }
}

export default Drop;
