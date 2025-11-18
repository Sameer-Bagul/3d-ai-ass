const axios = require('axios');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL_NAME = 'mistral';

async function checkOllamaAvailable() {
  try {
    await axios.get(`${OLLAMA_URL}/api/tags`);
    return true;
  } catch (error) {
    return false;
  }
}

async function generate(prompt, options = {}) {
  const available = await checkOllamaAvailable();
  
  if (!available) {
    console.warn('⚠️  Ollama not available, using mock response');
    return {
      text: `I understand you said: "${prompt}". (This is a mock response - Ollama is not running)`,
      structured: {
        intent: 'greeting',
        confidence: 0.95
      }
    };
  }
  
  try {
    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: MODEL_NAME,
      prompt: prompt,
      stream: false,
      options: {
        temperature: options.temperature || 0.7,
        top_p: options.top_p || 0.9
      }
    });
    
    return {
      text: response.data.response,
      structured: {}
    };
  } catch (error) {
    console.error('Ollama error:', error.message);
    return {
      text: `Echo: ${prompt}`,
      structured: {}
    };
  }
}

async function* generateStream(prompt, options = {}) {
  const available = await checkOllamaAvailable();
  
  if (!available) {
    yield { text: 'Ollama not available - mock streaming response', done: true };
    return;
  }
  
  try {
    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: MODEL_NAME,
      prompt: prompt,
      stream: true
    }, {
      responseType: 'stream'
    });
    
    for await (const chunk of response.data) {
      const data = JSON.parse(chunk.toString());
      yield {
        text: data.response,
        done: data.done
      };
    }
  } catch (error) {
    console.error('Ollama stream error:', error.message);
    yield { text: `Error: ${error.message}`, done: true };
  }
}

module.exports = {
  generate,
  generateStream,
  checkOllamaAvailable
};
