const samplePhonemes = require('../data/sample_phonemes.json');

async function synthesize(text, voice, format) {
  console.log(`🎙️  Synthesizing TTS for: "${text}"`);
  
  const duration = text.length * 0.08 + 0.5;
  
  const phonemes = generateDummyPhonemes(text, duration);
  
  return {
    audioUrl: `/api/assets/sample_audio.wav`,
    phonemes: phonemes,
    duration: duration
  };
}

function generateDummyPhonemes(text, duration) {
  const words = text.split(' ');
  const phonemes = [];
  let currentTime = 0.1;
  
  const phonemeTypes = ['AA', 'E', 'I', 'O', 'U', 'M', 'B', 'P', 'F', 'S', 'T', 'K'];
  
  for (const word of words) {
    const syllables = Math.max(1, Math.floor(word.length / 2));
    
    for (let i = 0; i < syllables; i++) {
      const phoneme = phonemeTypes[Math.floor(Math.random() * phonemeTypes.length)];
      const start = currentTime;
      const end = currentTime + 0.08 + Math.random() * 0.06;
      
      phonemes.push({
        phoneme: phoneme,
        start: parseFloat(start.toFixed(3)),
        end: parseFloat(end.toFixed(3))
      });
      
      currentTime = end;
    }
    
    currentTime += 0.05;
  }
  
  return phonemes;
}

async function alignPhonemes(audioUrl, text) {
  console.log(`🎯 Aligning phonemes for: "${text}"`);
  
  return generateDummyPhonemes(text, 2.0);
}

module.exports = {
  synthesize,
  alignPhonemes,
  generateDummyPhonemes
};
