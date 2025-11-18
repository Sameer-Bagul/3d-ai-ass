const ttsService = require('../services/ttsService');
const path = require('path');

const phonemeCache = new Map();

exports.handleTTS = async (req, res) => {
  try {
    const { text, voice = 'default', format = 'wav' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    console.log(`🔊 TTS request: "${text}" (voice: ${voice})`);
    
    const result = await ttsService.synthesize(text, voice, format);
    
    const phonemeId = `phoneme_${Date.now()}`;
    phonemeCache.set(phonemeId, result.phonemes);
    
    res.json({
      audioUrl: result.audioUrl,
      phonemes: result.phonemes,
      phonemeId: phonemeId,
      duration: result.duration
    });
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'TTS generation failed' });
  }
};

exports.getPhonemes = (req, res) => {
  const { id } = req.params;
  
  const phonemes = phonemeCache.get(id);
  
  if (!phonemes) {
    return res.status(404).json({ error: 'Phoneme timeline not found' });
  }
  
  res.json(phonemes);
};

exports.handleAlign = async (req, res) => {
  try {
    const { audioUrl, text } = req.body;
    
    console.log(`🎯 Alignment request for: "${text}"`);
    
    const alignment = await ttsService.alignPhonemes(audioUrl, text);
    
    res.json({
      phonemes: alignment,
      status: 'completed'
    });
  } catch (error) {
    console.error('Alignment error:', error);
    res.status(500).json({ error: 'Alignment failed' });
  }
};
