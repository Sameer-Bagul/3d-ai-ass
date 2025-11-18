# Project plan + folder trees + everything an AI agent needs to create the project

Nice — below is a complete, **machine-actionable** plan so an AI agent (or you) can create the whole project (server + client) and understand the architecture, endpoints, data formats, and implementation notes. I include:

* Server & client folder trees (final)
* Short description of every important file
* API endpoints (request/response shapes) and realtime design
* Fine-tuning plan (how to control movements with Mistral via Ollama)
* One-shot bash script you can run locally to create the folders and placeholder files for both server and client (the script creates files with minimal scaffolding so you can start implementing)

---

# 1 — Final folder structure (recommended)

```
/3d-ai-ass
├── server
│   ├── package.json
│   ├── .env.example
│   ├── README.md
│   ├── Dockerfile
│   ├── src
│   │   ├── index.js                   // server bootstrap (express)
│   │   ├── routes
│   │   │   ├── api.js                 // main REST endpoints
│   │   │   └── ws.js                  // websocket upgrade / ws routes (if any)
│   │   ├── controllers
│   │   │   ├── chatController.js      // handle chat -> LLM orchestration
│   │   │   ├── ttsController.js       // request/serve audio + phonemes
│   │   │   └── modelController.js     // fine-tune, status
│   │   ├── services
│   │   │   ├── ollamaService.js       // wrapper for Ollama calls (mistral)
│   │   │   ├── ttsService.js          // glue to TTS / aligner / phoneme generator
│   │   │   ├── audioService.js        // audio decode/stream helpers
│   │   │   └── animationPlanner.js    // high-level mapping requests -> animation plan
│   │   ├── utils
│   │   │   ├── phonemeMapper.js       // phoneme -> viseme -> blendshape table
│   │   │   ├── logger.js
│   │   │   └── validate.js
│   │   └── data
│   │       ├── sample_phonemes.json
│   │       └── viseme_map.json
│   └── scripts
│       ├── start.sh
│       └── fine_tune.sh
└── client
    ├── package.json
    ├── README.md
    ├── public
    │   ├── avatar.vrm
    │   └── favicon.ico
    ├── vite.config.ts
    ├── tsconfig.json
    └── src
        ├── main.tsx
        ├── index.css
        ├── App.tsx
        ├── /components
        │   ├── AvatarCanvas.tsx          // R3F canvas + loader
        │   ├── AvatarController.ts       // JS class to accept phoneme timeline + control VRM
        │   ├── Controls.tsx              // UI for testing (tts, chat, triggers)
        │   └── DebugPanel.tsx
        ├── /lib
        │   ├── audioPlayer.ts            // audio context helpers, scheduling
        │   ├── phonemePlayer.ts          // schedule phonemes -> controller
        │   └── socketClient.ts
        ├── /hooks
        │   └── useAudioSync.ts
        ├── /types
        │   └── animation.ts
        └── assets
            ├── textures
            └── shaders
```

---

# 2 — What each major file/folder does (concise)

* **server/src/index.js** — starts Express, registers routes, starts WS server if using sockets.
* **server/src/routes/api.js** — REST endpoints for `/api/chat`, `/api/tts`, `/api/phonemes`, `/api/fine-tune`, `/api/models`.
* **server/src/controllers/chatController.js** — accepts user chat, builds prompt templates (instructions for controlling avatar), calls `ollamaService`, returns text + structured action plan.
* **server/src/controllers/ttsController.js** — requests TTS generation (local or cloud) and either returns audio file and phoneme timeline or triggers async job.
* **server/src/services/ollamaService.js** — wrapper to communicate with local Ollama instance (mistral). Will provide function to send instruction and get response; also to start streaming responses if needed.
* **server/src/services/animationPlanner.js** — converts LLM output (intent + modifiers) into animation commands (blendshape targets over time, head rotations, gesture triggers).
* **server/src/services/phonemeService.js** — run aligner (Rhubarb/Gentle) on audio if TTS doesn't supply phonemes; produce `[{phoneme, start, end}]`.
* **server/src/data/viseme_map.json** — canonical mapping: phoneme → viseme → blendshape weights.
* **client/src/components/AvatarCanvas.tsx** — R3F scene, loads VRM via `@pixiv/three-vrm` or GLTFLoader then hands model to `AvatarController`.
* **client/src/components/AvatarController.ts** — receives `phonemeTimeline`, `animationCommands` (head, body, gestures), applies per-frame smoothing and interpolation.
* **client/src/lib/audioPlayer.ts** — manages AudioContext, playing buffers, returning exact `audioStartTime` for sync.
* **client/src/lib/phonemePlayer.ts** — scheduler that, given phoneme timeline & audioStartTime, triggers `AvatarController` with targets at the right moment.
* **client/src/socketClient.ts** — websocket client for low-latency control (streaming LLM events or live animation commands).

---

# 3 — API endpoints (design + payloads)

Use REST for pre-recorded TTS and WebSocket for low-latency/real-time streaming control. Example endpoints:

### REST

1. **POST /api/chat**

   * Purpose: send user message; server runs LLM to produce text and *structured animation plan* (optional).
   * Request:

     ```json
     { "userId":"sam", "message":"Hello, what's up?", "options": {"voice":"male1","style":"casual"} }
     ```
   * Response:

     ```json
     {
       "reply":"Hi Sameer! I'm your 3D avatar.",
       "animationPlan": { "type":"speech", "text":"Hi Sameer!", "ttsId":"abc123", "phonemeFile":"/api/phonemes/abc123" }
     }
     ```

2. **POST /api/tts**

   * Purpose: generate speech audio + phoneme timeline for given text.
   * Request:

     ```json
     { "text":"Hello Sameer", "voice":"mistral-tts-male", "format":"wav" }
     ```
   * Response:

     ```json
     { "audioUrl":"/media/abc123.wav", "phonemes": [ {"phoneme":"AA","start":0.05,"end":0.12}, ... ], "duration":1.8 }
     ```

3. **GET /api/phonemes/:id**

   * Returns phoneme timeline JSON.

4. **POST /api/fine-tune**

   * Accept training artifacts (instructions + examples) to fine-tune the LLM or create a policy adapter.
   * Request:

     ```json
     { "datasetId":"moveset1", "type":"lora", "params": {...} }
     ```
   * Response:

     ```json
     { "status":"queued", "jobId":"jt-123" }
     ```

5. **GET /api/models**

   * List available models & statuses.

### WebSocket (recommended for real-time)

* **WS** connected at `wss://server/ws`
* Message types:

  * `chat_in` → `{id, text}`
  * `llm_chunk` → streaming tokens and optional `action` events
  * `animation_cmd` → `{type:'blendshape', targets:[{name, value}], start, end}`
  * `phoneme_event` → server may stream phoneme events when TTS streaming supports it
* This enables progressive lip-sync & head movement before full audio is available.

---

# 4 — Data contracts (important)

**Phoneme timeline**

```json
[
  {"phoneme":"AA","start":0.05,"end":0.12},
  {"phoneme":"M","start":0.12,"end":0.22}
]
```

**Animation command**

```json
{
  "type":"blendshape",
  "targets":[{"k":"jawOpen","v":0.86},{"k":"mouthPucker","v":0.2}],
  "start": 0.05,
  "end": 0.20,
  "easing":"cubic-out"
}
```

**Head/gesture command**

```json
{
  "type":"head",
  "keyframes":[
    {"t":0.00,"pitch":0.01,"yaw":0.00},
    {"t":0.45,"pitch":0.12,"yaw":-0.06}
  ]
}
```

---

# 5 — Fine-tuning & using Ollama Mistral to control movements

Goal: have the LLM (Mistral via Ollama) generate **structured** outputs that are directly convertible into animation commands.

### Approach:

1. **Instruction Tuning / Adapter**

   * Create a dataset of dialogues paired with desired animation outputs:

     ```text
     Input: "Say 'Hello' in friendly tone"
     Output: 
     {
       "reply":"Hello!",
       "animation":[
         {"type":"blendshape","targets":[{"k":"jawOpen","v":0.9}], "start":0,"end":0.5 },
         {"type":"head","keyframes":[...]}
       ]
     }
     ```
   * Train or adapt Mistral to produce JSON-structured replies. Use LoRA or adapter if full-fine-tuning is heavy.

2. **Ollama usage (local)**

   * If Ollama supports fine-tuning/adapters, run the fine-tune script (server/scripts/fine_tune.sh).
   * If not, implement a local wrapper: provide prompt templates and in-context examples (few-shot) to bias behavior.

3. **Parsing & Safety**

   * Server must validate structured JSON output (schema) from LLM before forwarding to client.
   * If LLM returns only text, use a "planner" microservice to convert natural language into animation commands (NLP -> action planner).

4. **Training dataset**

   * Create CSV/JSONL pairs: user prompt → desired animation JSON.
   * Include many examples: nods on question marks, head tilt on empathy, expressive smiles on compliments, full-body gestures for emphatic phrases.

5. **Runtime**

   * For low-latency interactive control: stream tokens from Ollama; whenever LLM emits an `action` or special token, server translates to animation and pushes via WS to clients immediately.

---

# 6 — Sync & real-time considerations

* **Audio sync:** always rely on `AudioContext.currentTime` to compute audio playback offset and schedule animations relative to the actual audio start time returned from the AudioContext.
* **Drift / network lag:** play audio on client and use phoneme timeline to animate locally; server only sends timeline (or streams phoneme events). For streaming TTS, server streams phonemes in near real-time.
* **Deterministic scheduling:** include `audioStartAt` (absolute `audioContext.currentTime` if you control client), or use relative timestamps and have client compute its own start time.
* **Fallback:** if phonemes missing, approximate with RMS-derived mouth openness and map amplitude -> `jawOpen`.

---

# 7 — Security & deployment notes

* Keep API keys and model access on the server / main process (in Electron) — never in client bundle.
* Use TLS for WS and REST.
* Rate-limit TTS/LLM calls and queue fine-tuning jobs.
* For production, recommend Dockerizing server; the repo includes `server/Dockerfile`.

---

# 8 — Sample one-shot bash script

Run this from `/path/to/3d-ai-ass` to create the skeleton (server + client) with placeholder files. **It only creates files with minimal content — you still need to implement logic.**

Copy-paste & run:

```bash
#!/usr/bin/env bash
set -e
ROOT="$(pwd)"
echo "Creating project skeleton at $ROOT"

# create server skeleton
mkdir -p server/src/{controllers,services,routes,utils,data} server/scripts
cat > server/package.json <<'JSON'
{
  "name": "3d-ai-ass-server",
  "version": "0.1.0",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "fine-tune": "bash scripts/fine_tune.sh"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.5.0",
    "ws": "^8.13.0",
    "multer": "^1.4.5"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
JSON

cat > server/.env.example <<'ENV'
PORT=4000
OLLAMA_URL=http://localhost:11434
TTS_PROVIDER=local
TTS_API_KEY=
ENV

cat > server/src/index.js <<'JS'
const express = require('express');
const api = require('./routes/api');
const app = express();
app.use(express.json());
app.use('/api', api);
const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=>console.log('Server listening on', PORT));
JS

cat > server/src/routes/api.js <<'JS'
const express = require('express');
const router = express.Router();
const chat = require('../controllers/chatController');
const tts = require('../controllers/ttsController');

router.post('/chat', chat.handleChat);
router.post('/tts', tts.handleTTS);
router.get('/phonemes/:id', tts.getPhonemes);

module.exports = router;
JS

cat > server/src/controllers/chatController.js <<'JS'
exports.handleChat = async (req, res) => {
  // TODO: call ollamaService to generate structured reply and animation plan
  res.json({ reply: "ok", animationPlan: {} });
};
JS

cat > server/src/controllers/ttsController.js <<'JS'
exports.handleTTS = async (req,res)=> {
  // TODO: generate audio + phonemes and return urls/json
  res.json({ audioUrl:null, phonemes:[] });
}
exports.getPhonemes = (req,res) => { res.json([]); }
JS

cat > server/src/services/ollamaService.js <<'JS'
/**
 * Minimal wrapper to call local Ollama instance (mistral).
 * Implement the HTTP calls / streaming as needed.
 */
const axios = require('axios');
module.exports = {
  async generate(prompt){ 
    // TODO: call Ollama
    return { text: 'hello', structured: {} };
  }
}
JS

cat > server/scripts/fine_tune.sh <<'SH'
#!/usr/bin/env bash
echo "TODO: fine-tune script for Ollama (or produce LoRA). Configure this for your environment."
SH
chmod +x server/scripts/fine_tune.sh

# create client skeleton
mkdir -p client/public client/src/{components,lib,hooks,types,assets}
cat > client/package.json <<'JSON'
{
  "name": "3d-ai-ass-client",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "three": "^0.161.0",
    "@react-three/fiber": "^8.9.0",
    "@pixiv/three-vrm": "^1.0.4",
    "howler": "^2.2.3"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "typescript": "^5.5.2"
  }
}
JSON

cat > client/src/main.tsx <<'TSX'
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
const root = createRoot(document.getElementById("root")!);
root.render(<App/>);
TSX

cat > client/src/App.tsx <<'TSX'
import React from "react";
import AvatarCanvas from "./components/AvatarCanvas";
export default function App(){ return <div style={{height:'100vh'}}><AvatarCanvas/></div> }
TSX

cat > client/src/components/AvatarCanvas.tsx <<'TSX'
import React, {useRef, useEffect} from "react";
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRM, VRMUtils } from '@pixiv/three-vrm';

export default function AvatarCanvas(){
  const url = '/public/avatar.vrm';
  return (
    <Canvas camera={{position:[0,1.4,2.2]}}>
      <ambientLight intensity={0.7} />
      <Suspense fallback={null}>
        <Avatar url={url} />
      </Suspense>
    </Canvas>
  );
}

function Avatar({url}:{url:string}){
  const ref = useRef();
  useEffect(()=>{
    const loader = new GLTFLoader();
    loader.load(url, (g)=> {
      VRM.from(g).then(vrm=>{
        vrm.scene.scale.setScalar(1.0);
        // attach to scene
        // TODO: store vrm reference globally
      })
    })
  }, [url]);
  return <group ref={ref} />
}
TSX

cat > client/src/components/AvatarController.ts <<'JS'
/**
 * AvatarController: receives phoneme timelines and animation commands
 * and applies them to the loaded VRM instance per frame.
 *
 * Implement interpolation and smoothing here.
 */
export default class AvatarController {
  constructor(vrm){
    this.vrm = vrm;
    this.targets = [];
  }
  update(clockTime, delta){}
  applyPhonemeTimeline(timeline){}
}
JS

echo "Created skeleton: server + client"

```

Save as `bootstrap_skeleton.sh`, `chmod +x bootstrap_skeleton.sh` and run it.

> After running, `npm install` in server and client to install dependencies and then implement the TODOs.

---

# 9 — Implementation checklist (MVP -> advanced)

**MVP**

1. Load VRM in client AvatarCanvas and display it.
2. Implement `audioPlayer` to play a sample TTS audio locally.
3. Implement `phonemePlayer` with a small sample phoneme JSON and check jawOpen morphs work.
4. Implement `/api/tts` to return audio + phoneme JSON (server stub).
5. Implement `AvatarController` to accept phonemes and animate blendshapes for lips.

**Intermediate**

1. Add head idle logic + amplitude-driven head pitch.
2. Add websocket streaming from server -> client with live animation commands.
3. Add LLM planner: server uses Ollama to return structured JSON actions.

**Advanced**

1. Fine-tune Mistral (LoRA/adapter) with dataset of prompt→animation pairs.
2. Add full-body gestures (mapped to avatar humanoid bones).
3. Add fallback pipelines: if TTS lacks phonemes, run local Rhubarb/Gentle aligner.
4. Optimize performance, LOD, texture compression, and production Docker/K8s deployment.

---

# 10 — Quick developer notes / tips

* **Use VRM if you want standardized viseme group names** — if you have a GLB only, you can still use morphTarget names; VRM gives nicer compatibility with `@pixiv/three-vrm`.
* **Test quickly**: make a tiny `sample_phonemes.json` and wire it into `AvatarController` so you can iterate fast without waiting for LLM/TTS.
* **Dev flow**: do local development with mocked endpoints for LLM/TTS first, then integrate Ollama once client logic is stable.
* **Fine-tuning caution**: if you attempt to fine-tune, start with instruction tuning (few-shot) before full dataset training; LoRA-style adapters are cheaper.

---

If you want I can now:

* generate the **complete `AvatarController.ts`** implementation (with phoneme scheduling + interpolation + head motion equations), or
* create a **sample phoneme JSON** and a minimal client example you can run to see lip-sync working locally (no server), or
* produce a **detailed fine-tune dataset template (JSONL) and a `fine_tune.sh` for Ollama/LoRA**.

Pick one and I’ll produce it right away.
