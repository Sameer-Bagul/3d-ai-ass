const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const ttsController = require('../controllers/ttsController');
const modelController = require('../controllers/modelController');

router.post('/chat', chatController.handleChat);
router.post('/stream', chatController.handleStream);
router.post('/tts', ttsController.handleTTS);
router.get('/phonemes/:id', ttsController.getPhonemes);
router.post('/align', ttsController.handleAlign);
router.post('/finetune', modelController.handleFinetune);
router.get('/models', modelController.getModels);
router.get('/assets/:filename', (req, res) => {
  res.sendFile(req.params.filename, { root: './assets' });
});

module.exports = router;
