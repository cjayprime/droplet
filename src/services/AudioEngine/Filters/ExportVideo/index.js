import fs from 'fs';
import path from 'path';
import FFMpegCli from 'ffmpeg-cli';

import AudioEngine from '../..';
import DropService from '../../../Drop';
import UserService from '../../../User';
import Authenticate from '../../../Authenticate';

import { Notify } from '../../../../shared';
import { Drop as DropModel } from '../../../../models';

class ExportVideo {
  files = {
    input: path.join(__dirname, 'input.mp4'),
    mask: path.join(__dirname, 'mask.png'),
    defaultProfilePicture: path.join(__dirname, 'defaultProfilePicture.jpg'),
    font: (type) => path.join(__dirname, `Montserrat-${type}.ttf`).replace(/\\/g, '\\\\').replace(/:/g, '\\:'),
    
    output: (directory) => (directory + '.mp4'),
    intermediaryOutput: (directory) => (directory + '-intermediary-output.mp4'),
    profilePicture: (directory) => (directory + '.jpg'),
    audio: (directory) => (directory + '.mp3'),
    remove: async  (directory, removeProfilePicture) => {
      // Remove intermediaryOutput
      await fs.promises.unlink(this.files.intermediaryOutput(directory));
      // Remove profilePicture
      if (!removeProfilePicture) {
        await fs.promises.unlink(this.files.profilePicture(directory));
      }
      // Remove audio
      await fs.promises.unlink(this.files.audio(directory));
    },
  };
  
  wordWrap = (str, maxWidth) => {
    var newLineStr = '\f';
    let res = '';
    while (str.length > maxWidth) {                 
      let found = false;

      // Inserts new line at first whitespace of the line
      for (let i = maxWidth - 1; i >= 0; i--) {
        if (this.testWhite(str.charAt(i))) {
          res = res + [str.slice(0, i), newLineStr].join('');
          str = str.slice(i + 1);
          found = true;
          break;
        }
      }

      // Inserts new line at maxWidth position, the word is too long to wrap
      if (!found) {
        res += [str.slice(0, maxWidth), newLineStr].join('');
        str = str.slice(maxWidth);
      }

    }

    return res + str;
  }

  testWhite = (x) => {
    var white = new RegExp(/^\s$/);
    return white.test(x.charAt(0));
  };

  /**
   * Create a video that is later exportable
   * 
   * @param {BigInt} drop_id    A drop_id to create an export video from
   */
  make = async (drop_id) => {
    UserService.associateForUser();
    const drop = await DropModel.findOne({
      where: { drop_id }, 
      include: UserService.includeForUser,
    });
    if (!drop || drop.drop_id !== drop_id) {
      return {
        code: 400,
        message: 'We couldn\'t find the drop',
        data: {},
      };
    }

    const tag = drop.audio.tag;
    const directory = await AudioEngine.directory(tag, false, 'export-video', null);
    const downloaded = await DropService.bucket('download', this.files.audio(directory), tag);
    if (!downloaded) {
      return {
        code: 400,
        message: 'Unable to find the drop\'s audio',
        data: {},
      };
    }

    // Load the profile picture of the owner of the drop
    const authService = new Authenticate();
    const pp = this.files.profilePicture(directory);
    const profilePicture = await authService.getProfilePicture(drop.user.uid, pp)
            || this.files.defaultProfilePicture;
    if (!profilePicture) {
      return {
        code: 400,
        message: 'Unable to find the profile picture',
        data: {},
      };
    }

    const username = drop.user.username;
    const caption = this.wordWrap(drop.caption.toLowerCase(), 40);

    const command1 = `-y -nostats -i "${this.files.input}" -i "${profilePicture}" -i "${this.files.mask}" -filter_complex [0]drawtext="fontfile='${this.files.font('Bold')}':text='${username}': fontcolor=white: fontsize=44: line_spacing=20: box=1: boxcolor=black@0.0: boxborderw=5:x=(w-text_w)/2: y=580"[drawusername],[drawusername]drawtext="fontfile='${this.files.font('Regular')}':text='${caption}':fontcolor=white: fontsize=34: line_spacing=20: x=(w-text_w)/2: y=650"[drawcaption],[1]scale=185:185[dp],[2]alphaextract[alfa],[dp][alfa]alphamerge[makecircular],[drawcaption][makecircular]overlay=444:306[applyprofilepicture] -map "[applyprofilepicture]" -hide_banner -pix_fmt yuv420p -codec:a copy "${this.files.intermediaryOutput(directory)}"`;
    const command2 = `-y -nostats -i "${this.files.intermediaryOutput(directory)}" -i "${this.files.audio(directory)}" -map 0:v -map 1:a -c:v copy -shortest -strict -2 "${this.files.output(directory)}"`;

    const success1 = await FFMpegCli.run(command1).then(() => {
      return true;
    }).catch(e => {
      console.log('\nFFMpeg Error Occured 1', e);
      Notify.error(e);
      return null;
    });

    console.log('LOG 1:', success1);
    if (!success1) {
      return {
        code: 400,
        message: 'Unable to create the video. Failed while starting up.',
        data: {},
      };
    }

    const success2 = await FFMpegCli.run(command2).then(() => {
      return true;
    }).catch(e => {
      console.log('\nFFMpeg Error Occured 2', e);
      Notify.error(e);
      return null;
    });

    console.log('LOG 2:', success2);
    if (!success2) {
      return {
        code: 400,
        message: 'Unable to create the video. Failed while concluding.',
        data: {},
      };
    }

    await this.files.remove(directory, profilePicture === this.files.defaultProfilePicture);
    return {
      code: 200,
      message: 'The video has successfully been created. To download it call /download?tag=' + tag + '&filter=export-video&extension=mp4',
      data: { file: process.env.NODE_ENV !== 'production' ? this.files.output(directory) : '' },
    };
  }
}

export default ExportVideo;
