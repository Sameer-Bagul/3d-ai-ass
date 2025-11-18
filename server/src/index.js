require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const WebSocket = require('ws');
const apiRoutes = require('./routes/api');
const ollamaService = require('./services/ollamaService');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/media', express.static(path.join(__dirname, '../media')));

app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Startup check for Ollama
async function checkServices() {
  console.log('\n🔍 Checking services...');
  
  const ollamaAvailable = await ollamaService.checkOllamaAvailable();
  
  if (ollamaAvailable) {
    const models = await ollamaService.listModels();
    const configuredModel = process.env.OLLAMA_MODEL || 'llama2';
    const modelExists = models.some(m => m.name.includes(configuredModel));
    
    if (!modelExists) {
      console.log(`\n⚠️  WARNING: Configured model "${configuredModel}" not found!`);
      console.log(`📋 Available models: ${models.map(m => m.name).join(', ') || 'none'}`);
      console.log(`\n💡 To install the model, run:`);
      console.log(`   ollama pull ${configuredModel}`);
      console.log(`\n   Or use the API: POST http://localhost:${PORT}/api/ollama/pull`);
      console.log(`   Body: { "model": "${configuredModel}" }\n`);
    } else {
      console.log(`✅ Model "${configuredModel}" is ready\n`);
    }
  } else {
    console.log('⚠️  WARNING: Ollama is not running or not accessible');
    console.log(`   Expected at: ${process.env.OLLAMA_URL || 'http://localhost:11434'}`);
    console.log('   The server will use mock responses until Ollama is available\n');
  }
}

const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`✅ Ollama status: http://localhost:${PORT}/api/ollama/status`);
  
  await checkServices();
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('📡 WebSocket client connected');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('📨 Received:', data.type);
      
      if (data.type === 'chat_in') {
        ws.send(JSON.stringify({
          type: 'llm_chunk',
          text: `Echo: ${data.text}`,
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.error('WebSocket error:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('📡 WebSocket client disconnected');
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
