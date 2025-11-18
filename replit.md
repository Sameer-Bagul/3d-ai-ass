# 3D AI Avatar Platform

## Overview

This is a complete end-to-end platform for creating interactive 3D AI avatars with real-time lip-sync animation, LLM integration, and text-to-speech capabilities. The system enables users to interact with a 3D VRM avatar that responds with intelligent conversation (via Ollama/Mistral) and realistic facial animations synchronized with generated speech.

The platform consists of a Node.js backend server providing REST APIs and WebSocket support, paired with a React + TypeScript frontend that renders the 3D avatar using Three.js and handles real-time animation playback.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**November 18, 2025**: Complete 3D AI Avatar Platform built from scratch based on plan.md
- Created full-stack application with Node.js backend and React frontend
- Implemented VRM avatar rendering with Three.js
- Built phoneme-based lip-sync animation system
- Integrated Ollama/Mistral for LLM support
- Added WebSocket for real-time communication
- Fixed critical timing synchronization issues for proper lip-sync
- Server running on port 3000, Client on port 5000
- Both workflows configured and running successfully

## System Architecture

### Client Architecture

**Frontend Framework**: React 18 with TypeScript, built with Vite for fast development and optimized production builds.

**3D Rendering Engine**: Uses Three.js via @react-three/fiber (React renderer for Three.js) with @react-three/drei utilities for common 3D operations like camera controls. The VRM avatar model is loaded and animated using the @pixiv/three-vrm library, which provides comprehensive support for VRM format including blendshape morphing and bone manipulation.

**Component Structure**:
- `AvatarCanvas`: Main 3D scene container that initializes the Three.js renderer and camera
- `AvatarController`: Core animation controller class that manages blendshape values, phoneme timeline playback, and idle animations
- `Controls`: UI component for user input, handles chat messages and TTS requests
- `DebugPanel`: Real-time status display for development and monitoring

**Animation System**: The avatar controller applies phoneme-based lip-sync by mapping phonemes to visemes, then to VRM blendshapes. Animation playback is synchronized with Web Audio API timing for precise audio-visual alignment. The system supports layered animations (lip-sync, expressions, head movements, gestures) that can blend together.

**State Management**: Uses React hooks (useState, useCallback, useRef) for local component state. Custom hooks like `useAudioSync` encapsulate complex audio-animation synchronization logic.

**Audio Playback**: Web Audio API manages audio playback with precise timing. The `audioPlayer` module decodes audio buffers and returns exact start times for synchronization with animation timelines.

### Backend Architecture

**Server Framework**: Express.js providing RESTful API endpoints with CORS enabled for cross-origin requests from the frontend.

**Real-time Communication**: WebSocket server (ws library) runs alongside Express for low-latency bidirectional communication, intended for streaming LLM responses and real-time animation commands.

**Service Layer Pattern**: Business logic is separated into dedicated service modules:
- `ollamaService`: Communicates with Ollama API for LLM inference (Mistral model)
- `ttsService`: Generates text-to-speech audio and phoneme timelines
- `animationPlanner`: Creates high-level animation plans from text, detecting punctuation and sentiment to add appropriate gestures and expressions
- `audioService`: Handles audio file operations and amplitude analysis

**Controller Layer**: Request handlers in dedicated controllers (`chatController`, `ttsController`, `modelController`) validate input, orchestrate service calls, and format responses.

**Data Mapping**: Phoneme-to-viseme-to-blendshape mapping is handled through JSON configuration files (`viseme_map.json`) and utility functions (`phonemeMapper.js`). This allows easy customization of lip-sync behavior without code changes.

**Graceful Degradation**: The Ollama service includes availability checking and falls back to mock responses when the LLM service is unavailable, ensuring the platform remains functional during development.

### API Design

**REST Endpoints**:
- `POST /api/chat`: Accepts user messages, returns LLM response with animation plan
- `POST /api/tts`: Synthesizes speech from text, returns audio URL and phoneme timeline
- `GET /api/phonemes/:id`: Retrieves cached phoneme timeline by ID
- `POST /api/align`: Aligns phonemes to existing audio (for pre-recorded audio)
- `POST /api/finetune`: Queues model fine-tuning jobs
- `GET /api/models`: Lists available and fine-tuned models

**WebSocket Protocol**: JSON message format with `type` field for message routing. Supports `chat_in` messages from client and `llm_chunk` streaming responses from server.

**Response Formats**: All responses include timestamps for synchronization. Animation plans contain arrays of animation commands with type, targets, timing, and easing information structured for direct consumption by the avatar controller.

### Data Flow

1. User inputs text in Controls component
2. Frontend sends POST request to `/api/chat`
3. Backend forwards to Ollama for LLM response
4. Animation planner analyzes response text and generates animation commands
5. Backend optionally calls TTS service to generate audio and phoneme timeline
6. Complete response (text, animation plan, audio URL, phonemes) returns to frontend
7. Frontend plays audio via Web Audio API
8. Avatar controller synchronizes blendshape animations with audio using phoneme timeline
9. Layered animations (gestures, expressions, head movements) execute based on animation commands

### Fine-tuning Infrastructure

The system is designed to support fine-tuning Mistral for avatar-specific animation control. The architecture includes:
- `modelController` with fine-tuning job queue management
- Placeholder scripts (`fine_tune.sh`) for training workflows
- Structured animation command format that can be generated by fine-tuned models
- Sample data for training (phoneme timelines, animation sequences)

The fine-tuning approach would train the LLM to output structured JSON animation commands directly, allowing natural language control of avatar behavior ("wave excitedly", "nod slowly", etc.).

## External Dependencies

### Third-party Services

**Ollama**: Local LLM inference server running Mistral model. Expected to be available at `http://localhost:11434` (configurable via `OLLAMA_URL` environment variable). Used for conversational AI responses. The service includes fallback behavior when unavailable - returns mock responses when Ollama is not running.

**Text-to-Speech**: Currently using mock TTS service that generates realistic dummy phoneme timelines for testing. The phoneme generation algorithm creates vowel and consonant patterns that drive the avatar's lip-sync. Production deployment would integrate with actual TTS services like ElevenLabs, Azure Speech, or open-source alternatives like Coqui TTS.

**Forced Alignment**: Phoneme alignment service (currently mocked) for precise audio-phoneme synchronization. Would integrate with tools like Montreal Forced Aligner or gentle for production use.

**Animation Timing**: The system uses a lazy initialization pattern where the audioStartTime is set from the render loop clock on the first frame after phonemes are loaded. This ensures perfect synchronization between the Three.js render loop and the phoneme animation timeline.

### Frontend Libraries

- **Three.js**: 3D rendering engine
- **@react-three/fiber**: React renderer for Three.js
- **@react-three/drei**: Helper components for common 3D patterns
- **@pixiv/three-vrm**: VRM model loader and animation support

### Backend Libraries

- **Express**: Web server framework
- **ws**: WebSocket implementation
- **axios**: HTTP client for Ollama communication
- **cors**: Cross-origin resource sharing middleware
- **dotenv**: Environment variable management

### Development Tools

- **Vite**: Frontend build tool and development server
- **TypeScript**: Type-safe JavaScript for frontend
- **ESLint**: Code linting for both frontend and backend
- **Prettier**: Code formatting
- **nodemon**: Auto-reloading development server for backend

### Asset Requirements

- **VRM Model**: 3D avatar model in VRM format (stored in `client/public/avatar.vrm`)
- **Audio Files**: Generated or pre-recorded audio files served from `server/media/` directory

### Environment Configuration

Backend requires environment variables (server/.env):
- `PORT`: Server port (default: 3000)
- `OLLAMA_URL`: Ollama service endpoint (default: http://localhost:11434)
- `TTS_PROVIDER`: TTS provider (default: local)
- `CLIENT_URL`: Frontend URL (default: http://localhost:5000)

Frontend requires environment variables (client/.env):
- `VITE_API_URL`: Backend API endpoint (default: http://localhost:3000)

**Current Configuration:**
- Server running on port 3000
- Client running on port 5000
- Both workflows configured and running automatically
- VRM model located at client/public/avatar.vrm