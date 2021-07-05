import fs from 'fs';
import path from 'path';

import AudioEngine from '../..';

import { Audio as AudioModel, Filter as FilterModel, FilterUsage as FilterUsageModel } from '../../../../models';
import { Notify } from '../../../../shared';

class PitchShift {
  script = path.join(__dirname, 'pitch_shift.py');

  make = async (tag, type, isTrimmed) => {
    const slug = 'pitch-shift-' + type;
    const input = AudioEngine.directory(tag, isTrimmed);
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

    // Save to filter_usage table
    const audio = await AudioModel.findOne({
      attributes: ['audio_id', 'user_id'],
      where: { tag },
    });
    const filter = await FilterModel.findOne({
      attributes: ['filter_id'],
      where: { slug },
    });
    const filterUsage = await FilterUsageModel.findOne({ where: { user_id: audio.user_id, audio_id: audio.audio_id } });
    if (!filterUsage) {
      await FilterUsageModel.create({
        user_id: audio.user_id,
        audio_id: audio.audio_id,
        owner_audio_id: null,
        owner_user_id: null,
        filter_id: filter.filter_id,
        date: new Date(),
      });
    } else {
      await FilterUsageModel.update({
        filter_id: filter.filter_id,
      }, {
        where: { filter_id: filterUsage.filter_id, }
      });
    }

    return {
      code: 200,
      message: 'Successfully created a pitch shifted ' + type + ' filter.',
      data: { tag },
    };
  }
}

export default PitchShift;
