import fs from 'fs';
import path from 'path';
import audioDecode from 'audio-decode';
import { AudioContext } from 'web-audio-api';
import audioBufferToWav from 'audiobuffer-to-wav';

import { Duet } from './Filters';

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

  static directory = (filename, isTrimmed, filter, extension) => path.join(
    __dirname,
    '../../storage/' + (
      filter ?
        'filters/' + filter + '/'
        : (isTrimmed ? 'trimmed/' : '')
    ) + filename + '.' + (extension || 'mp3')
  );

  static getFile = async (tag, filter, extension) => {
    const drop = AudioEngine.directory(tag, null, filter, extension);
    if (!fs.existsSync(drop)){
      return false;
    }

    const recording = await fs.promises.readFile(drop);
    return recording;
  };

  storeFile = async (tag, filter, extension) => {
    const url = await new Promise((resolve, reject) => {
      const file = AudioEngine.directory(tag, null, filter, extension);
      // const newFile = extension ? file.replace('mp3', extension) : file;
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
   * Processes an audio buffer (pcm, mp3 etc) and returns a .wav file
   *
   * @param {Buffer}      buffer      An audio buffer
   * @returns {AudioBuffer}
   */
  getProcessedData = async (buffer) => {
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
      });
    }).catch(e => {
      console.log('Promise error while processing data', e);
      return false;
    });
    return result;
  };

  getDuration = async () => {
    const data = await this.getProcessedData();
    if (!data) {
      return 0;
    }
    this.duration = Math.round((data._data.length / data.numberOfChannels) / data.sampleRate);
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

  filter = {
    duet: new Duet().init,
  };
}

export default AudioEngine;
