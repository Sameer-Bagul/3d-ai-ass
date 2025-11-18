You are an expert full-stack, Three.js, R3F, VRM, and animation pipeline engineer.
You will update an existing MERN + Vite + React Three Fiber project for a 3D AI Agent.
The project already contains:

/client/public/avatar.vrm (VRoid model with full facial & body rig)

/client/public/animations/*.fbx (renamed Mixamo animations)

/client/src/components (AvatarCanvas, AvatarController)

/client/src/lib (audio, phoneme sync, socket IO client)

/server/src (controllers, animation planner, TTS, Ollama service)

/plan.md (project plan)

Your tasks:

1. Add Basic Animations

Implement an animation loader system that loads:

idle

happy_idle

breathing_idle

Blend them seamlessly using Three.js AnimationMixer.
Automatically play idle when nothing else is playing.

2. Add Advanced Mixamo Animations

Use all FBX animations from /client/public/animations/*.
Convert them to AnimationAction sequences.
Create a reusable “playAnimation(name)” API exposed by AvatarController.
Allow interrupting animations (stop current and start new).
Blend between animations smoothly.

Animations include:

backflip

blow_a_kiss

catwalk_walk

dancing_twerk

jumping_down

pointing_gesture

praying

quick_formal_bow

waving

victory

etc.

3. Emotion System

Implement a full emotion engine:

emotions: happy, sad, angry, surprised, confused, neutral

each emotion affects:

facial blendshapes (smile, frown, brow, eyes)

head movement

idle posture

small micro-movements

add setEmotion(emotionName) in AvatarController.

integrate emotional overrides into animation blending.

4. LLM-Driven Animation Planning

Update /server/src/services/animationPlanner.js to do:

Take LLM output

Convert it into a structured JSON payload:

{
  "emotion": "happy",
  "animation": "waving",
  "intensity": 0.7,
  "viewMode": "half-body",
  "speech": "Generated speech to read",
  "interrupt": true
}


Add schema validation

Improve prompt template so the LLM always outputs perfect JSON

Ensure the payload is stable and predictable

Integrate with /server/src/controllers/chatController.js
so Ollama Mistral decides animations, emotions, and camera mode based on conversation.

5. View Modes (Camera System)

Add 3 R3F camera modes:

full-body → full avatar visible

half-body → torso up

head-only → face closeup for detailed lip-sync

Add setViewMode() function and update camera controls smoothly.

6. Interruptible TTS + Animation

Keep current browser TTS for now.
Add the ability to interrupt speaking/animation at any time by user action.
Stopping should:

stop audio

fade current animation

return to idle

7. Clean Architecture

Ensure all new code respects and enhances:

/client folder layout

/server REST API

existing VRM + Mixamo integration

no breaking changes

typed interfaces for JSON return

comments + clean structure

8. Deliverables

You MUST output updated or new files for:

/client/src/components/AvatarController.ts

/client/src/components/AvatarCanvas.tsx

/client/src/lib/animationLoader.ts (new)

/client/src/lib/emotionEngine.ts (new)

/client/src/lib/viewModes.ts (new)

/server/src/services/animationPlanner.js (updated)

/server/src/controllers/chatController.js (updated)

any required helper files

README snippets for how to use the new features

Maintain compatibility with:

VRM model in /client/public/avatar.vrm

Mixamo FBX animations in /client/public/animations

Ollama Mistral running locally