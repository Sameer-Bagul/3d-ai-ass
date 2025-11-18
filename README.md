# 3D AI Avatar Platform

A complete end-to-end platform for creating interactive 3D AI avatars with real-time lip-sync animation, LLM integration, and TTS capabilities.

## 🚀 Features

- **3D Avatar Rendering**: VRM model support with Three.js and @react-three/fiber
- **Real-time Lip-Sync**: Phoneme-based facial animation with blendshape morphing
- **LLM Integration**: Ollama/Mistral support for intelligent conversation
- **TTS Support**: Text-to-speech with automatic phoneme alignment
- **WebSocket Communication**: Low-latency real-time animation streaming
- **Fine-tuning Ready**: Infrastructure for training custom animation models

## 📁 Project Structure

```
.
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/   # REST endpoint handlers
│   │   ├── services/      # Business logic (Ollama, TTS, Animation)
│   │   ├── routes/        # API routes
│   │   ├── utils/         # Utilities (phoneme mapping, validation)
│   │   └── data/          # Sample data and mappings
│   ├── scripts/           # Utility scripts (fine-tuning, etc.)
│   └── Dockerfile
│
├── client/                # React + TypeScript frontend
│   ├── src/
│   │   ├── components/    # React components (Avatar, Controls)
│   │   ├── lib/           # Core libraries (audio, WebSocket)
│   │   ├── hooks/         # Custom React hooks
│   │   └── types/         # TypeScript definitions
│   ├── public/            # Static assets (VRM model)
│   └── Dockerfile
│
├── docker-compose.yml     # Multi-service orchestration
└── plan.md               # Detailed project plan
```

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express
- **WebSocket** (ws) for real-time communication
- **Ollama** for LLM integration (Mistral)
- **Axios** for HTTP requests

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Three.js** and @react-three/fiber for 3D rendering
- **@pixiv/three-vrm** for VRM model support
- **WebAudio API** for audio playback and sync

## 🚦 Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn
- (Optional) Docker and Docker Compose
- (Optional) Ollama for local LLM

### Local Development

1. **Clone and navigate to the project:**
```bash
cd 3d-ai-avatar
```

2. **Install server dependencies:**
```bash
cd server
npm install
cp .env.example .env
```

3. **Install client dependencies:**
```bash
cd ../client
npm install
```

4. **Start the server (Terminal 1):**
```bash
cd server
npm run dev
```
Server will run on http://localhost:3000

5. **Start the client (Terminal 2):**
```bash
cd client
npm run dev
```
Client will run on http://localhost:5000

6. **Open your browser:**
Navigate to http://localhost:5000

### Using Docker

```bash
docker-compose up --build
```

This will start:
- Server on port 3000
- Client on port 5000  
- Ollama on port 11434

## 🎮 Usage

### Testing Lip-Sync Animation

1. Click "Test Lip-Sync" button to see the avatar animate with sample phonemes
2. The avatar's mouth will move according to the phoneme timeline

### Chat with LLM

1. Type a message in the text area
2. Click "Send Chat" to get a response from the LLM
3. The server will return a structured animation plan

### TTS & Animation

1. Type text in the text area
2. Click "Generate TTS & Animate"
3. The server generates phonemes and the avatar lip-syncs accordingly

## 🔧 API Endpoints

### REST API

- `POST /api/chat` - Send chat message, receive LLM response + animation plan
- `POST /api/tts` - Generate speech audio and phoneme timeline
- `GET /api/phonemes/:id` - Retrieve phoneme timeline by ID
- `POST /api/align` - Align phonemes with audio
- `POST /api/finetune` - Queue fine-tuning job
- `GET /api/models` - List available models and fine-tune jobs

### WebSocket

Connect to `ws://localhost:3000` for real-time communication:

**Message Types:**
- `chat_in` - Send chat message
- `llm_chunk` - Receive streaming LLM tokens
- `animation_cmd` - Receive animation commands
- `phoneme_event` - Receive phoneme events

## 🎨 Animation System

### Phoneme Timeline Format
```json
[
  { "phoneme": "AA", "start": 0.05, "end": 0.12 },
  { "phoneme": "M", "start": 0.12, "end": 0.22 }
]
```

### Animation Command Format
```json
{
  "type": "blendshape",
  "targets": [
    { "k": "jawOpen", "v": 0.86 },
    { "k": "mouthPucker", "v": 0.2 }
  ],
  "start": 0.05,
  "end": 0.20,
  "easing": "cubic-out"
}
```

## 🤖 Fine-Tuning with Ollama

### Setup Ollama

1. **Install Ollama:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

2. **Pull Mistral model:**
```bash
ollama pull mistral
```

3. **Create custom model with animation prompts:**
```bash
cd server
chmod +x scripts/fine_tune.sh
./scripts/fine_tune.sh
```

### Training Dataset Format

Create `server/data/training_dataset.jsonl`:

```jsonl
{"prompt": "Say hello cheerfully", "completion": "{\"reply\":\"Hello!\",\"animation\":[{\"type\":\"blendshape\",\"targets\":[{\"k\":\"jawOpen\",\"v\":0.8}],\"start\":0,\"end\":0.3}]}"}
{"prompt": "Look confused", "completion": "{\"reply\":\"Hmm...\",\"animation\":[{\"type\":\"head\",\"keyframes\":[{\"t\":0,\"pitch\":0.1,\"yaw\":0.15}]}]}"}
```

### Fine-Tuning Strategy

1. **Few-Shot Learning**: Use in-context examples (fastest, no training)
2. **LoRA Adapters**: Train lightweight adapters (recommended)
3. **Full Fine-Tuning**: Complete model retraining (expensive)

See `plan.md` section 5 for detailed fine-tuning instructions.

## 📊 Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Browser   │◄───────►│    Server    │◄───────►│   Ollama    │
│  (Client)   │         │   Express    │         │  (Mistral)  │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │
      │                        │
   Three.js              WebSocket/REST
   VRM Model              TTS Service
   AudioContext          Animation Planner
```

### Data Flow

1. **User Input** → Client captures text/voice
2. **LLM Processing** → Server sends to Ollama
3. **TTS Generation** → Server generates audio + phonemes
4. **Animation Planning** → Server maps phonemes to blendshapes
5. **Real-time Sync** → Client plays audio + animates avatar

## 🧪 Testing

### Server Tests
```bash
cd server
npm test
```

### Client Tests
```bash
cd client
npm run lint
npm run build
```

## 🚀 Deployment

### Environment Variables

**Server (.env):**
```
PORT=3000
OLLAMA_URL=http://localhost:11434
TTS_PROVIDER=local
NODE_ENV=production
```

**Client (.env):**
```
VITE_API_URL=http://your-server-url:3000
```

### Production Build

```bash
cd client && npm run build
cd ../server && npm run start
```

## 🛣️ Roadmap

### MVP ✅
- [x] VRM model loading and display
- [x] Phoneme-based lip-sync
- [x] REST API endpoints
- [x] Sample TTS integration
- [x] Basic animation controller

### Phase 2
- [ ] Real TTS integration (ElevenLabs, Azure, etc.)
- [ ] Streaming LLM responses
- [ ] Advanced head/body animations
- [ ] Gesture system

### Phase 3
- [ ] Fine-tuned Mistral for animation control
- [ ] Production-ready phoneme aligner
- [ ] Custom VRM editor
- [ ] Multi-avatar support

## 📖 Documentation

- See `plan.md` for complete technical specification
- API documentation available at `/api/docs` (coming soon)
- VRM specification: https://vrm.dev/en/

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is MIT licensed.

## 🙏 Acknowledgments

- [@pixiv/three-vrm](https://github.com/pixiv/three-vrm) for VRM support
- [Ollama](https://ollama.ai) for local LLM hosting
- [Three.js](https://threejs.org) and [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber)

## 📞 Support

For questions or issues, please open an issue on GitHub.

---

**Built with ❤️ for the future of interactive AI avatars**
