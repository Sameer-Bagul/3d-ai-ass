const fs = require('fs');
const path = require('path');

function decodeAudio(audioBuffer) {
  return {
    sampleRate: 44100,
    channels: 1,
    duration: audioBuffer.length / 44100
  };
}

function analyzeAmplitude(audioBuffer, windowSize = 1024) {
  const amplitudes = [];
  
  for (let i = 0; i < audioBuffer.length; i += windowSize) {
    const window = audioBuffer.slice(i, i + windowSize);
    const rms = Math.sqrt(window.reduce((sum, val) => sum + val * val, 0) / window.length);
    amplitudes.push(rms);
  }
  
  return amplitudes;
}

function saveAudio(audioBuffer, filename) {
  const outputPath = path.join(__dirname, '../../media', filename);
  fs.writeFileSync(outputPath, audioBuffer);
  return outputPath;
}

module.exports = {
  decodeAudio,
  analyzeAmplitude,
  saveAudio
};
