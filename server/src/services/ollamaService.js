const axios = require('axios');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL_NAME = process.env.OLLAMA_MODEL || 'dolphin-mistral:latest';

async function checkOllamaAvailable() {
  try {
    const response = await axios.get(`${OLLAMA_URL}/api/tags`);
    console.log('✅ Ollama is running. Available models:', response.data.models?.map(m => m.name).join(', ') || 'none');
    return true;
  } catch (error) {
    console.error('❌ Ollama connection failed:', error.message);
    return false;
  }
}

async function listModels() {
  try {
    const response = await axios.get(`${OLLAMA_URL}/api/tags`);
    return response.data.models || [];
  } catch (error) {
    console.error('Failed to list models:', error.message);
    return [];
  }
}

async function pullModel(modelName) {
  try {
    console.log(`📥 Pulling model: ${modelName}...`);
    const response = await axios.post(`${OLLAMA_URL}/api/pull`, {
      name: modelName,
      stream: false
    });
    console.log(`✅ Model ${modelName} pulled successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to pull model ${modelName}:`, error.message);
    return false;
  }
}

async function ensureModelExists(modelName) {
  const models = await listModels();
  const modelExists = models.some(m => m.name.includes(modelName));
  
  if (!modelExists) {
    console.warn(`⚠️  Model "${modelName}" not found. Available models:`, models.map(m => m.name));
    console.log(`📥 Attempting to pull ${modelName}...`);
    await pullModel(modelName);
  }
  
  return modelExists;
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
    // Ensure model exists before trying to use it
    await ensureModelExists(MODEL_NAME);
    
    console.log(`🤖 Generating response with model: ${MODEL_NAME}`);
    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: MODEL_NAME,
      prompt: prompt,
      stream: false,
      options: {
        temperature: options.temperature || 0.7,
        top_p: options.top_p || 0.9,
        num_predict: options.max_tokens || 150
      }
    }, {
      timeout: 30000 // 30 second timeout
    });
    
    console.log(`✅ Response generated successfully`);
    return {
      text: response.data.response,
      structured: {}
    };
  } catch (error) {
    console.error('❌ Ollama error:', error.response?.data || error.message);
    if (error.response?.status === 404) {
      console.error(`Model "${MODEL_NAME}" not found. Please run: ollama pull ${MODEL_NAME}`);
    }
    return {
      text: `I apologize, but I'm having trouble connecting to my language model. Error: ${error.message}`,
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
    // Ensure model exists before trying to use it
    await ensureModelExists(MODEL_NAME);
    
    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: MODEL_NAME,
      prompt: prompt,
      stream: true
    }, {
      responseType: 'stream',
      timeout: 30000
    });
    
    for await (const chunk of response.data) {
      const data = JSON.parse(chunk.toString());
      yield {
        text: data.response,
        done: data.done
      };
    }
  } catch (error) {
    console.error('❌ Ollama stream error:', error.response?.data || error.message);
    yield { text: `Error: ${error.message}`, done: true };
  }
}

module.exports = {
  generate,
  generateStream,
  checkOllamaAvailable,
  listModels,
  pullModel,
  ensureModelExists
};
