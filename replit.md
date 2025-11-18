# 3D AI Avatar Platform

## Overview

This is a complete end-to-end platform for creating interactive 3D AI avatars with real-time lip-sync animation, LLM integration, and text-to-speech capabilities. The system enables users to interact with a 3D VRM avatar that responds with intelligent conversation (via Ollama/Mistral) and realistic facial animations synchronized with generated speech.

The platform consists of a Node.js backend server providing REST APIs and WebSocket support, paired with a React + TypeScript frontend that renders the 3D avatar using Three.js and handles real-time animation playback.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**November 18, 2025 (Latest Update)**: Comprehensive Animation & Emotion System + Critical Bug Fix
- ✅ **Animation Loader**: FBX animation system for all 19 Mixamo animations with smooth blending
- ✅ **Skeleton Retargeting**: Automatic conversion of Mixamo bone names to VRM humanoid bones (critical fix for animation playback)
- ✅ **Emotion Engine**: 6 emotions (happy, sad, angry, surprised, confused, neutral) with facial blendshapes and micro-movements
- ✅ **View Modes**: 3 camera modes (full-body, half-body, head-only) with smooth transitions
- ✅ **LLM Animation Planning**: Ollama generates structured JSON for emotion, animation, and camera control
- ✅ **Interruption System**: Stop button to cancel speech/animations and return to idle
- ✅ **Enhanced UI**: Emotion selector, animation picker, view mode controls with real-time status
- ✅ **Integration**: All systems work together - body animations, facial emotions, lip-sync, and camera movements
- ✅ **Bug Fix**: Animations now properly retarget from Mixamo skeleton to VRM humanoid skeleton

**November 18, 2025 (Initial Build)**: Complete 3D AI Avatar Platform built from scratch based on plan.md
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
- `AvatarCanvas`: Main 3D scene container that initializes the Three.js renderer, camera, and view mode controller
- `AvatarController`: Core animation controller that orchestrates AnimationLoader, EmotionEngine, and phoneme lip-sync
- `Controls`: UI component with chat input, emotion selector, animation picker, view mode controls, and stop button
- `DebugPanel`: Real-time status display for development and monitoring

**New Library Modules**:
- `animationLoader.ts`: Manages loading and playback of 19 FBX animations from Mixamo with smooth blending
- `emotionEngine.ts`: Handles 6 emotions with facial blendshapes, head movements, and natural micro-movements
- `viewModes.ts`: Controls camera positioning with 3 modes (full-body, half-body, head-only) and smooth transitions

**Animation System**: Multi-layered animation system that blends:
1. **Body Animations**: FBX skeletal animations loaded via FBXLoader and played through Three.js AnimationMixer
2. **Facial Emotions**: VRM expression blendshapes controlled by EmotionEngine
3. **Lip-Sync**: Phoneme-to-viseme mapping for mouth movements synchronized with speech
4. **Camera Movement**: Smooth view transitions based on context

All layers blend together seamlessly - body can dance while face shows emotions and mouth syncs to speech.

**State Management**: Uses React hooks (useState, useCallback, useRef) for local component state. Custom hooks like `useAudioSync` encapsulate complex audio-animation synchronization logic.

**Audio Playback**: Web Audio API manages audio playback with precise timing. The `audioPlayer` module decodes audio buffers and returns exact start times for synchronization with animation timelines.

### Backend Architecture

**Server Framework**: Express.js providing RESTful API endpoints with CORS enabled for cross-origin requests from the frontend.

**Real-time Communication**: WebSocket server (ws library) runs alongside Express for low-latency bidirectional communication, intended for streaming LLM responses and real-time animation commands.

**Service Layer Pattern**: Business logic is separated into dedicated service modules:
- `ollamaService`: Communicates with Ollama API for LLM inference (Mistral model)
- `ttsService`: Generates text-to-speech audio and phoneme timelines
- `animationPlanner`: **NEW** - LLM-driven animation planning that generates structured JSON payloads with emotion, animation (from available 19 FBX files), viewMode, and intensity. Validates all outputs against available animations.
- `audioService`: Handles audio file operations and amplitude analysis

**Controller Layer**: Request handlers in dedicated controllers (`chatController`, `ttsController`, `modelController`) validate input, orchestrate service calls, and format responses.

**Data Mapping**: Phoneme-to-viseme-to-blendshape mapping is handled through JSON configuration files (`viseme_map.json`) and utility functions (`phonemeMapper.js`). This allows easy customization of lip-sync behavior without code changes.

**Graceful Degradation**: The Ollama service includes availability checking and falls back to mock responses when the LLM service is unavailable, ensuring the platform remains functional during development.

### API Design

**REST Endpoints**:
- `POST /api/chat`: **UPDATED** - Returns LLM response with animation plan AND animationPayload (emotion, animation, viewMode, intensity)
- `POST /api/tts`: Synthesizes speech from text, returns audio URL and phoneme timeline
- `GET /api/phonemes/:id`: Retrieves cached phoneme timeline by ID
- `POST /api/align`: Aligns phonemes to existing audio (for pre-recorded audio)
- `POST /api/finetune`: Queues model fine-tuning jobs
- `GET /api/models`: Lists available and fine-tuned models

**WebSocket Protocol**: JSON message format with `type` field for message routing. Supports `chat_in` messages from client and `llm_chunk` streaming responses from server.

**Response Formats**: All responses include timestamps for synchronization. Animation plans contain arrays of animation commands with type, targets, timing, and easing information structured for direct consumption by the avatar controller.

### Data Flow

**NEW Enhanced Flow**:
1. User inputs text in Controls component
2. Frontend sends POST request to `/api/chat`
3. Backend forwards to Ollama for LLM response text
4. **NEW** - Animation planner calls Ollama again to generate structured JSON animation payload
5. Backend validates animation against available 19 FBX files
6. Backend calls TTS service to generate phonemes
7. Complete response returns: `{ reply, animationPayload: {emotion, animation, viewMode, intensity}, tts: {phonemes} }`
8. Frontend applies animation payload:
   - EmotionEngine sets facial emotion
   - AnimationLoader plays body animation
   - ViewModeController adjusts camera
9. Frontend plays speech with phoneme lip-sync
10. All layers blend: body animation + facial emotion + lip-sync + camera movement

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
- **@react-three/drei**: Helper components for common 3D patterns (OrbitControls)
- **@pixiv/three-vrm**: VRM model loader and animation support
- **FBXLoader** (three/examples/jsm): Loads Mixamo FBX animations

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
- **FBX Animations**: 19 Mixamo animations in `client/public/animations/` directory
  - Basic: idle.fbx, breathing_idle.fbx, happy_idle.fbx
  - Actions: backflip.fbx, blow_a_kiss.fbx, catwalk_walk.fbx, cocky_head_turn.fbx
  - Dancing: dancing_twerk.fbx
  - Movements: jumping_down.fbx, pointing_gesture.fbx, praying.fbx, quick_formal_bow.fbx
  - Gestures: standing_thumbs_up.fbx, victory.fbx, waving.fbx
  - Poses: ass_bumb_female_standing_pose.fbx, female_crouch_pose.fbx, female_laying_pose.fbx, female_standing_pose_bold.fbx
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