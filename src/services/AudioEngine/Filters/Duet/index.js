import { PythonShell } from 'python-shell';
import { v4 as uuidv4 } from 'uuid';

import AudioEngine from '../..';
import DropService from '../../../Drop';

import { Audio as AudioModel, Filter as FilterModel, FilterUsage as FilterUsageModel } from '../../../../models';

class Duet {
  /**
   * Retrieves the wav format of a file stored in Droplet's bucket
   * If 1 file is invalid the entire process fails
   * 
   * @param {String} tag 
   * @returns 
   */
  getWav = async (tag) => {
    // Download the file to appropriate directory
    const fileName = await AudioEngine.directory(tag, false, 'duet');
    await DropService.bucket('download', fileName, tag);

    // Get the downloaded file
    const buffer = await AudioEngine.getFile(tag, 'duet');
    if (!buffer) {
      return {
        error: `Unable to find the drop: ${tag}`,
        tag,
      };
    }

    // Convert to wav
    const audioEngine = new AudioEngine();
    const audioData = await audioEngine.getProcessedData(buffer);
    if (!audioData) {
      return {
        error: `Unable to create duets from the drop: ${tag}, because of format issues.`,
        tag,
      };
    }
        
    // NOTE:
    // This will save with a .mp3 extension, although the format/content is .wav
    audioEngine.buffer = Buffer.from(audioData.wav);
    const file = await audioEngine.storeFile(tag, 'duet', 'wav');
    if (!file) {
      return {
        error: `Unable to handle file for drop: ${tag}.`,
        tag,
      };
    }
    return { wav: audioData.wav, file };
  }

  init = async (user_id, tags) => {
    if (!Array.isArray(tags) || (Array.isArray(tags) && tags.length !== 2)) {
      return {
        code: 400,
        message: 'The tags array provided must be of a length of 2.',
        data: { tag: tags[0] },
      };
    }

    // Loop through `tags` and load their fileNames (as wav)
    // because the duet feature only supports wav
    const fileNames = [];
    const tagsResult = await Promise.all(
      tags.map(async (_, i) => {
        const wavData = await this.getWav(tags[i]);
        if (wavData.error){
          return {
            code: 400,
            message: wavData.error,
            data: { tag: wavData.tag },
          };
        }
        fileNames[i] = wavData.file;
      })
    );
    const errIndex = tagsResult.findIndex(tagRes => !!tagRes);
    if (errIndex !== -1) {
      return tagsResult[errIndex];
    }

    const tag = uuidv4();
    let taggedFile = await AudioEngine.directory(tag, false, 'duet');
    taggedFile = taggedFile.replace('mp3', 'wav');

    const result = await new Promise((resolve, reject) => {
      let options = {
        mode: 'text',
        scriptPath: __dirname,
        args: [fileNames[0], fileNames[1], taggedFile]
      };
      PythonShell.run('duet_feature.py', options, function (err, results) {
        if (err) {
          return reject(err);
        }
        resolve(results);
      });
    });

    console.log('results: %j', result);
    if (result[0] !== 'success') {
      return {
        code: 400,
        message: 'An error occurred while trying to create a duet.',
        data: { tag },
      };
    }

    await DropService.bucket('upload', tag, taggedFile);
    const audioEngine = new AudioEngine();
    audioEngine.buffer = await AudioEngine.getFile(tag, 'duet', 'wav');
    const data = await audioEngine.getProcessedData();
    if (!data) {
      return {
        code: 400,
        message: 'A parsing error occurred while trying to create a duet.',
        data: { tag },
      };
    }
    const audio = await AudioModel.create({
      user_id,
      tag,
      duration: data.duration,
      filesize: data._data.length,
      source: 'recording',
      trimmed: '0',
      date: new Date(),
    });
    const filter = await FilterModel.findOne({
      attributes: ['filter_id'],
      where: { name: 'duet' }
    });
    await FilterUsageModel.create({
      user_id: audio.user_id,
      audio_id: audio.audio_id,
      filter_id: filter.filter_id,
      date: new Date(),
    });
    return {
      code: 200,
      message: 'Successfully created a duet',
      data: { tag },
    };
  }
}

export default Duet;
