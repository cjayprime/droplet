import fs from 'fs';
import path from 'path';

import AudioEngine from '../..';

import { Notify } from '../../../../shared';

class PitchShift {
  script = path.join(__dirname, 'pitch_shift.py');

  /**
   * Always make filters from the original audio (even if a duet), then
   * trimming can occur via a frontend call to /trim
   *
   * @param {String}    tag
   * @param {String}    type
   * @param {Boolean}   isDuet
   * @returns
   */
  make = async (tag, type, isDuet) => {
    const slug = 'pitch-shift-' + type;
    const input = AudioEngine.directory(tag, false, isDuet ? 'duet' : undefined);
    const output = AudioEngine.directory(tag, false, slug, 'wav');
    const result = await AudioEngine.pythonExec(this.script, [type, input, output], (res) => {
      return res;
    }, (e) => {
      Notify.error(e);
      return false;
    });

    console.log('RESULT:', result);
    if (!result || result[0] !== 'success') {
      return {
        code: 400,
        message: 'Sorry we were unable to create the filter ' + type + '.',
        data: { tag },
      };
    }

    const buffer = await AudioEngine.getFile(tag, false, slug, 'wav');
    if (!buffer) {
      return {
        code: 400,
        message: 'Sorry we were unable to create the ' + type + ' filter. Couldn\'t find the file.',
        data: { tag },
      };
    }

    const stored = await AudioEngine.toMp3(buffer, output);
    // Delete .wav file
    await fs.promises.unlink(output);
    if (!stored) {
      return {
        code: 400,
        message: 'File handling error for the pitch shifted ' + type + ' filter.',
        data: { tag },
      };
    }

    await AudioEngine.recordFilterUsage(tag, slug);

    return {
      code: 200,
      message: 'Successfully created a pitch shifted ' + type + ' filter.',
      data: { tag },
    };
  }
}

export default PitchShift;
