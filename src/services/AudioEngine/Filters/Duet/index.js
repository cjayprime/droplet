import { PythonShell } from 'python-shell';

import AudioEngine from '../..';
import DropService from '../../../Drop';
import UserService from '../../../User';

import { User as UserModel, Audio as AudioModel, Filter as FilterModel, FilterUsage as FilterUsageModel } from '../../../../models';

class Duet {
  /**
   * Retrieves the wav format of a file stored in Droplet's bucket
   * If 1 file is invalid the entire process fails
   *
   * @param {String} tag          The tag to generate a wav for duetting
   * @param {String} isTrimmed    If the duet is attempting to use the trimmed version of the audio (if undefined will check bucket storage)
   * @returns
   */
  getWav = async (tag, isTrimmed, i) => {
    let buffer;
    if (isTrimmed === true || isTrimmed === false) {
      // Check for the file in the trim OR root storage directory
      buffer = await AudioEngine.getFile(tag, isTrimmed);
    } else {
      // Download the file to appropriate directory
      const fileName = await AudioEngine.directory(tag);
      await DropService.bucket('download', fileName, tag);
      // Get the downloaded file
      buffer = await AudioEngine.getFile(tag);
    }

    if (!buffer) {
      return {
        error: `Unable to find the drop ${i} with tag: ${tag}${isTrimmed === true ? ', did you really trim it?' : ''}`,
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

    // Create a new file with .wav format from the buffer
    audioEngine.buffer = Buffer.from(audioData.wav);
    const file = await audioEngine.storeFile(tag, isTrimmed, null, 'wav');
    if (!file) {
      return {
        error: `Unable to handle file for drop: ${tag}.`,
        tag,
      };
    }
    return { /*wav: audioData.wav,*/ file };
  }

  /**
   * Makes a duet
   *
   * @param {Object} current    Has a shape of {user_id, tag, isTrimmed}, NOTE: The tag references a local audio file ALWAYS
   * @param {Object} owner      Has a shape of {user_id, tag}, NOTE: The tag references a remote audio file ALWAYS
   * @returns
   */
  make = async (current, owner) => {
    if (current.tag === owner.tag) {
      return {
        code: 400,
        message: 'You must provide unique tags.',
        data: {},
      };
    }

    if (!current.user_id || !owner.user_id || !current.tag || !owner.tag) {
      return {
        code: 400,
        message: 'You must provide an object with a shape of'+
                  '{current: {tag: UUID, user_id: ID}, owner: {tag: UUID, user_id: ID}}.',
        data: {},
      };
    }

    const tag = current.tag;
    // Ensure that the pairings are accurate i.e. the onwer of a
    // drop (`user_id`) is the same as the onwer of a tag (`tag`)
    UserService.generateAssociation(UserModel, AudioModel);
    const ownerAudio = await AudioModel.findOne({
      attributes: ['audio_id', 'user_id'],
      where: {
        ...UserService.searchForUser(owner.user_id),
        tag: owner.tag,
      },
      include: [{ model: UserModel, required: true }],
    });
    const currentAudio = await AudioModel.findOne({
      attributes: ['audio_id', 'user_id'],
      where: {
        ...UserService.searchForUser(current.user_id),
        tag: current.tag,
      },
      include: [{ model: UserModel, required: true }],
    });
    if (!currentAudio || !ownerAudio) {
      return {
        code: 422,
        message: 'Couldn\'t ascertain ownership of this drop.',
        data: { tag },
      };
    }

    // Loop through `tags` and load their filePaths (as wav)
    // because the duet feature only supports wav (including format)
    const filePaths = [];
    const tagsResult = await Promise.all(
      [{ ...current }, { ...owner }].map(async (audio, i) => {
        const wavData = await this.getWav(audio.tag, audio.isTrimmed, i + 1);
        if (wavData.error){
          return {
            code: 400,
            message: wavData.error,
            data: { tag: wavData.tag },
          };
        }
        filePaths[i] = wavData.file;
      })
    );
    // If there are no errors tagResult will resolve to a falsy value
    const errIndex = tagsResult.findIndex(tagRes => !!tagRes);
    if (errIndex !== -1) {
      return tagsResult[errIndex];
    }

    // Create the new duet file path
    const duetFilePath = await AudioEngine.directory(tag, false, 'duet', 'wav');

    // Generate the duet
    const result = await new Promise((resolve, reject) => {
      let options = {
        mode: 'text',
        scriptPath: __dirname,
        args: [filePaths[0], filePaths[1], duetFilePath],
      };
      PythonShell.run('duet_feature.py', options, function (err, results) {
        if (err) {
          return reject(err);
        }
        resolve(results);
      });
    });

    console.log('RESULT:', result);
    if (result[0] !== 'success') {
      return {
        code: 400,
        message: 'An error occurred while trying to create a duet.',
        data: { tag },
      };
    }

    const buffer = await AudioEngine.getFile(tag, false, 'duet', 'wav');
    // const buffer = await fs.promises.readFile(duetFilePath)
    const stored = await AudioEngine.toMp3(buffer, duetFilePath);
    if (!stored) {
      return {
        code: 400,
        message: 'File handling error.',
        data: { tag },
      };
    }

    // Save the duet
    const filter = await FilterModel.findOne({
      attributes: ['filter_id'],
      where: { name: 'duet' },
    });
    await FilterUsageModel.create({
      user_id: currentAudio.user_id,
      owner_audio_id: ownerAudio.audio_id,
      owner_user_id: ownerAudio.user_id,
      audio_id: currentAudio.audio_id,
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
