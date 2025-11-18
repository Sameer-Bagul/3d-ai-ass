const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const ttsController = require('../controllers/ttsController');
const modelController = require('../controllers/modelController');
const ollamaService = require('../services/ollamaService');

// Ollama status endpoints
router.get('/ollama/status', async (req, res) => {
  try {
    const available = await ollamaService.checkOllamaAvailable();
    const models = available ? await ollamaService.listModels() : [];
    res.json({
      available,
      url: process.env.OLLAMA_URL || 'http://localhost:11434',
      configuredModel: process.env.OLLAMA_MODEL || 'llama2',
      availableModels: models.map(m => m.name)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/ollama/pull', async (req, res) => {
  try {
    const { model } = req.body;
    if (!model) {
      return res.status(400).json({ error: 'Model name is required' });
    }
    const success = await ollamaService.pullModel(model);
    res.json({ success, model });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Chat endpoints
router.post('/chat', chatController.handleChat);
router.post('/stream', chatController.handleStream);

// TTS endpoints
router.post('/tts', ttsController.handleTTS);
router.get('/phonemes/:id', ttsController.getPhonemes);
router.post('/align', ttsController.handleAlign);

// Model endpoints
router.post('/finetune', modelController.handleFinetune);
router.get('/models', modelController.getModels);

// Assets
router.get('/assets/:filename', (req, res) => {
  res.sendFile(req.params.filename, { root: './assets' });
});

module.exports = router;
