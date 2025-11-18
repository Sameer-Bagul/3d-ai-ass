const ollamaService = require('../services/ollamaService');
const animationPlanner = require('../services/animationPlanner');
const ttsService = require('../services/ttsService');

exports.handleChat = async (req, res) => {
  try {
    const { userId, message, options = {} } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    console.log(`💬 Chat request from ${userId || 'anonymous'}: ${message}`);
    
    const llmResponse = await ollamaService.generate(message, options);
    
    let animationPayload;
    try {
      animationPayload = await animationPlanner.generateAnimationWithLLM(
        message,
        llmResponse.text,
        ollamaService
      );
    } catch (error) {
      console.error('Animation planning error:', error);
      animationPayload = animationPlanner.getDefaultAnimation();
    }
    
    const animationPlan = animationPlanner.createAnimationPlan({
      text: llmResponse.text,
      type: 'speech',
      style: options.style || 'casual'
    });
    
    const duration = llmResponse.text.length * 0.08 + 0.5;
    const phonemes = ttsService.generateDummyPhonemes(llmResponse.text, duration);
    
    res.json({
      reply: llmResponse.text,
      animationPlan: animationPlan,
      animationPayload: animationPayload,
      tts: {
        mode: 'web-speech',
        text: llmResponse.text,
        phonemes: phonemes,
        duration: duration,
        useClientTTS: true
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};

exports.handleStream = async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const { message } = req.body;
  
  try {
    const chunks = [`Hello! `, `I received: `, `"${message}"`];
    
    for (const chunk of chunks) {
      res.write(`data: ${JSON.stringify({ text: chunk, done: false })}\n\n`);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Stream error:', error);
    res.status(500).json({ error: 'Stream failed' });
  }
};
