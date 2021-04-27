function ParsedWave(buffer) {

  const RIFF_HEADER_OFFSET = 0;
  const FILE_SIZE_OFFSET = 4;
  const RIFF_FORMAT_OFFSET = 8;
  const SUBCHUNK1_ID_OFFSET = 12;
  const AUDIO_FORMAT_OFFSET = 20;
  const NUMBER_OF_CHANNELS_OFFSET = 22;
  const SAMPLE_RATE_OFFSET = 24;
  const BITS_PER_SAMPLE_OFFSET = 34;
  const SUBCHUNK2_ID_OFFSET = 36;
  const SUBCHUNK2_SIZE_OFFSET = 40;
  const DATA_OFFSET = 44;

  this.buffer = buffer;
  this.riff = buffer.slice(RIFF_HEADER_OFFSET, RIFF_HEADER_OFFSET + 4).toString('utf8');
  this.fileSize = buffer.readUInt32LE(FILE_SIZE_OFFSET);
  this.riffType = buffer.slice(RIFF_FORMAT_OFFSET, RIFF_FORMAT_OFFSET + 4).toString('utf8');
  this.subChunk1Id = buffer.slice(SUBCHUNK1_ID_OFFSET, SUBCHUNK1_ID_OFFSET + 4).toString('utf8');
  this.audioFormat = buffer.readUInt16LE(AUDIO_FORMAT_OFFSET);
  this.numberOfChannels = buffer.readUInt16LE(NUMBER_OF_CHANNELS_OFFSET);
  this.sampleRate = buffer.readUInt32LE(SAMPLE_RATE_OFFSET);
  this.bitsPerSample = buffer.readUInt16LE(BITS_PER_SAMPLE_OFFSET);
  this.subChunk2Id = buffer.slice(SUBCHUNK2_ID_OFFSET, SUBCHUNK2_ID_OFFSET + 4).toString('utf8');
  this.subChunk2Size = buffer.readUInt32LE(SUBCHUNK2_SIZE_OFFSET);
  this.data = buffer.slice(DATA_OFFSET, this.subChunk2Size + DATA_OFFSET);
}


module.exports = data => {

  const parsedWaveFile = new ParsedWave(data);

  if (parsedWaveFile.riff !== 'RIFF') {
    throw new TypeError('incorrect file type, must be RIFF format');
  }

  if (parsedWaveFile.fileSize > 10000000) {
    throw new TypeError('file too large, please limit file size to less than 10MB');
  }

  if (parsedWaveFile.riffType !== 'WAVE') {
    throw new TypeError('file must be a WAVE');
  }

  if (parsedWaveFile.subChunk1Id !== 'fmt ') {
    throw new TypeError('the first subchunk must be fmt');
  }

  if (parsedWaveFile.audioFormat !== 1) {
    throw new TypeError('wave file must be uncompressed linear PCM');
  }

  if (parsedWaveFile.numberOfChannels > 2) {
    throw new TypeError('wave file must have 2 or less channels');
  }

  if (parsedWaveFile.sampleRate > 48000) {
    throw new TypeError('wave file must have sample rate of less than 48k');
  }

  if (parsedWaveFile.bitsPerSample !== 16) {
    throw new TypeError('file\'s bit depth must be 16');
  }

  if (parsedWaveFile.subChunk2Id !== 'data') {
    throw new TypeError('subchunk 2 must be data');
  }

  return parsedWaveFile;
};
