import fs from 'fs';
import path from 'path';
import audioDecode from 'audio-decode';
import { AudioContext } from 'web-audio-api';
import audioBufferToWav from 'audiobuffer-to-wav';
import { Lame } from 'node-lame';
import FFMpegCli from 'ffmpeg-cli';
import { PythonShell } from 'python-shell';

import { Duet, ExportVideo, PitchShift } from './Filters';

import { Filter as FilterModel } from '../../models';
import { Notify } from '../../shared';

/**
 * AudioEngine
 *
 * To use this note the following:
 * 1. All outputs are in mp3 format ONLY, this means stored files and returned files are in the .mp3 formats
 *    Because it has the best quality and size for handling
 * 2. All inputs are simply buffers (base64 too) and never guaranteed to be of a format, but are likely mp3
 * 3. Internal processing is done in .wav ONLY because it's binary is easiest to handle and parse
 */
class AudioEngine {
  base64;
  buffer;
  type;
  duration;
  size;

  constructor(data, type = 'base64'){
    this.type = type;
    if (type === 'base64') {
      this.base64 = data;
    } else {
      this.buffer = data;
    }
  }

  static directory = (filename, isTrimmed, filter, extension = 'mp3') => path.join(
    __dirname,
    '../../storage/' + (
      filter ?
        'filters/' + filter + '/'
        : (isTrimmed ? 'trimmed/' : '')
    ) + filename + (extension ? '.' + extension : '')
  );

  /**
   * Retrieve the raw binary data of a file identifed by it's tag
   * and it's location specified by filter, isTrimmed and extension
   * 
   * @param {String}  tag 
   * @param {Boolean} isTrimmed   Whether to check for the file in the trimmed storage location
   * @param {String}  filter      If specified the filter storage directory will be scanned
   * @param {String}  extension   
   * @returns 
   */
  static getFile = async (tag, isTrimmed, filter, extension) => {
    const drop = AudioEngine.directory(tag, isTrimmed, filter, extension);
    if (!fs.existsSync(drop)){
      return false;
    }

    const recording = await fs.promises.readFile(drop);
    return recording;
  };

  storeFile = async (tag, isTrimmed, filter, extension) => {
    const url = await new Promise((resolve, reject) => {
      const file = AudioEngine.directory(tag, isTrimmed, filter, extension);
      fs.writeFile(
        file,
        this.buffer,
        (err) => {
          if (err) {
            console.log('Tried to store file unsuccessfully', err);
            reject(false);
          }

          resolve(file);
        },
      );
    });

    return url;
  };

  /**
   * FFMpeg CLI execution method
   * 
   * @param {String} command            CLI/Terminal command to execute
   * @param {Promise.resolve} success   Callback to execute on success
   * @param {Promise.reject}  error     Callback to execute on failure 
   * @returns 
   */
  static ffMpegExec = async (command, success, error) => {
    return await FFMpegCli.run(
      // To view detailed logs use `-loglevel debug`
      `-y ${process.env.NODE_ENV === 'development' ? '-nostats' : '-nostats'} ${command}`
    ).then(success).catch(error);
  }

  static pythonExec = async (script, args, success, error) => {
    return await new Promise((resolve, reject) => {
      const options = {
        mode: 'text',
        args,
      };

      PythonShell.run(script, options, function (err, results) {
        if (err) {
          return reject(err);
        }
        resolve(results);
      });
    }).then(success).catch(error);
  }

  static generateRandomString = (length = 6) => {
    return Math.random().toString(20).substr(2, length);
  };

  /**
   * Processes a wav file into an audio buffer and returns it
   *
   * @param {Buffer}      buffer      An audio buffer
   * @returns {AudioBuffer}
   */
  parse = async (buffer) => {
    if (buffer || this.base64){
      let recordingData;
      recordingData = Buffer.from(buffer || this.base64, buffer ? undefined : 'base64');
      this.buffer = recordingData;
    }

    const result = await new Promise((resolve, reject) => {
      const audioContext = new AudioContext();
      // Audio files from android devices require this call, sadly
      audioContext.decodeAudioData(this.buffer, async buffer => {
        const wav = audioBufferToWav(buffer);
        const data = await audioDecode(wav).catch(e => console.log('Could not decode recording', e));
        if (!data){
          return reject('Could not decode recording');
        }
        data.wav = wav;
        return resolve(data);
      }, (e) => {
        console.log('\n\nAn audio processing error occurred', e, '\n\n');
        reject(false);
        return false;
      });
    }).catch(e => {
      console.log('Promise error while processing data', e);
      return false;
    });
    // console.log('Now parsing:::::::::::::', result);
    return result;
  };

  /**
   * Processes a Buffer (of any format) and produces an AudioBuffer
   * It processes a binary file or base64 string using ffmpeg and returns an AudioBuffer
   * NB: Pass a binary buffer or it falls back to base64
   * 
   * @param {Buffer} buffer   Buffer to process.
   * @returns {AudioBuffer}
   */
  getProcessedData = async (buffer) => {
    this.buffer = buffer || Buffer.from(this.base64, 'base64');

    // Create temp. files
    const randomName = AudioEngine.generateRandomString();
    const input = await this.storeFile('temp-' + randomName, null, null, 'wav');
    const intermediateOutput = input.replace('temp-', '');
    const output = await this.storeFile(randomName, null, null, 'mp3');

    // From whatever the buffer might be to wav
    const commandToWav = `-i "${input}" -vn -ac 2 -ar 44100 -acodec pcm_s16le "${intermediateOutput}"`;
    // From the wav to mp3
    const commandToMp3 = `-i "${intermediateOutput}" -vn -ac 2 -ar 44100 -b:a 320k "${output}"`;

    const result = await AudioEngine.ffMpegExec(commandToWav, async () => {
      const success = await AudioEngine.ffMpegExec(commandToMp3, () => true, (e) => {
        Notify.info('\nFFMpeg Error During Processing of Command 2', e);
        Notify.error(e);
        return false;
      });
      if (!success) {
        return false;
      }

      const bufferMp3 = await AudioEngine.getFile(randomName, undefined, undefined, 'mp3');
      const bufferWav = await AudioEngine.getFile(randomName, undefined, undefined, 'wav');

      // Delete temp. files
      await fs.promises.unlink(input);
      await fs.promises.unlink(intermediateOutput);
      await fs.promises.unlink(output);

      const audioBuffer = await this.parse(bufferWav);
      audioBuffer.mp3 = bufferMp3;
      return audioBuffer;
    }, e => {
      Notify.info('\nFFMpeg Error During Processing of Command 1', e);
      Notify.error(e);
      return false;
    });

    if (result) {
      this.buffer = result.mp3;
    }
    return result;
  };
    

  getDuration = async (dt) => {
    const data = dt || await this.getProcessedData();
    if (!data) {
      return 0;
    }
    this.duration = Math.round(1000 * ((data._data.length / data.numberOfChannels) / data.sampleRate));
    this.size = data._data.length;
    return this.duration;
  };

  getWaveform = async (bars, type) => {
    let data, originalData;
    data = originalData = await this.getProcessedData(this.buffer);
    if (!data || !data._channelData){
      return [];
    }
    data = Array.from(data._channelData[0]);

    // FULL-WIDTH PER SECOND WAVEFORM
    // This waveforms show only the current second on a graph, for a given data
    // so you see the current playback time (exact second) as a full width of the graph
    // returns an array of arrays, where an array's index is the time mark,
    // and it's content is used to plot
    if (type === 'full-width-per-second'){
      const filteredData = [];
      const samples = bars;
      const blockSize = Math.floor(originalData.sampleRate / samples);
      // Only loop `duration` number of times, since full-width-per-second
      // produces waveforms for each second
      for (let k = 0; k < Math.round(data.length / originalData.sampleRate); k++) {
        filteredData.push([]);
        filteredData[filteredData.length - 1] = [];
        for (let i = 0; i < samples; i++) {
          // The location of the first sample in this block is at the
          // sampleRate * sampleCountRunning (k)
          // +
          // blockSize * i
          let blockStart = (originalData.sampleRate * k) + (blockSize * i);
          let sum = 0;
          // Get the sum of all the data points
          for (let j = 0; j < blockSize; j++) {
            const dataPoint = Math.abs(data[blockStart + j]);
            sum = sum + (dataPoint ? dataPoint : 0);
          }
          // Get the average
          filteredData[filteredData.length - 1].push(sum / blockSize);
        }
      }
      const normalisedData = filteredData.map(arr => {
        const multiplier = Math.pow(Math.max(...arr), -1);
        return arr.map(n => n * multiplier);
      });
      return normalisedData;

    } else if (type === 'full-width-full-time') {
      // FULL-WIDTH FULL TIME WAVEFORM
      // This waveforms show the full time on a graph, for a given data
      // so while viewing the current playback time, you see all the past data plotted as well
      // returns an array, where the content is used to plot
      const filteredData = [];
      const samples = bars;
      const blockSize = Math.floor(data.length / samples);
      for (let i = 0; i < samples; i++) {
        // The location of the first sample in this block is at
        // blockSize * i
        let blockStart = blockSize * i;
        let sum = 0;
        // Get the sum
        for (let j = 0; j < blockSize; j++) {
          sum = sum + Math.abs(data[blockStart + j]);
        }
        // Get the average
        filteredData.push(sum / blockSize);
      }
      const multiplier = Math.pow(Math.max(...filteredData), -1);
      const normalisedData = filteredData.map(n => n * multiplier);
      return normalisedData;

    }
  };

  /**
   * Convert a wav buffer
   *
   * @param {ArrayBuffer}   buffer    The buffer of the wav file
   * @param {String}        storage   A file path to a wav file, it will be overwritten after conversion
   * @returns
   */
  static toMp3 = async (buffer, storage) => {
    const encoder = new Lame({
      output: storage.replace(/\.wav$/, '.mp3'),
      bitrate: 192,
      'little-endian': true,
      mp3Input: false,
      quality: 9,
    }).setBuffer(Buffer.from(buffer));

    const resolved = await encoder.encode()
      .then(() => {
        return true;
      })
      .catch((e) => {
        console.log('Error while converting to mp3:', e);
        return false;
      });

    return resolved;
  };

  filter = {
    all: async (status) => {
      const filters = await FilterModel.findAll(!status ? undefined : { where: { status: status === 'true' ? '1' : '0' } });
      return {
        code: 200,
        message: 'Successfully retrieved the filters.',
        data: [...filters],
      };
    },
    duet: new Duet().make,
    exportVideo: new ExportVideo().make,
    pitchShift: new PitchShift().make,
  };
}

export default AudioEngine;
