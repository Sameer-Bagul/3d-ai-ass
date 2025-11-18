# 3D AI Avatar - Animation System API

## ✨ Features Implemented

### 🎬 Animation System
- **Mixamo FBX Support**: Load and play any Mixamo animation
- **Automatic Retargeting**: Converts Mixamo bone names to VRM humanoid bones
- **Animation Manager**: Load, cache, and play animations with cross-fading
- **38 Animations Ready**: idle, breathing, waving, dancing, jumping, and more

### 😊 Emotion System
- **6 Base Emotions**: neutral, joy, sad, angry, surprised, relaxed
- **VRM Blendshapes**: Uses official VRM expression presets
- **Smooth Transitions**: Emotions blend smoothly over time
- **Auto-Blinking**: Realistic automatic blinking every 2-6 seconds
- **Lip Sync Ready**: Support for visemes (aa, ih, ou, ee, oh)

### 📷 View Mode System
- **3 View Modes**: full-body, half-body, head-only
- **Smooth Transitions**: Animated camera movements
- **Auto-Adjusting Controls**: Zoom limits adapt to view mode

---

## 🎮 JavaScript API

Access the avatar control API via the browser console:

```javascript
// The API is available globally as window.avatarAPI
```

### Animation Control

```javascript
// Play an animation (auto cross-fades)
avatarAPI.playAnimation('waving');
avatarAPI.playAnimation('dance', { loop: true, crossFadeDuration: 0.5 });

// Stop current animation
avatarAPI.stopAnimation(0.5);

// Load a single animation
await avatarAPI.loadAnimation('jumping');

// Load all 38 available animations
await avatarAPI.loadAllAnimations((loaded, total) => {
  console.log(`Loading: ${loaded}/${total}`);
});
```

### Emotion Control

```javascript
// Set emotion (intensity 0-1)
avatarAPI.setEmotion('joy', 1.0);
avatarAPI.setEmotion('sad', 0.5);
avatarAPI.setEmotion('angry', 0.8);

// Available emotions: neutral, joy, sad, angry, surprised, relaxed

// Manual blink
avatarAPI.blink();

// Set custom blendshape directly
avatarAPI.setBlendShape('happy', 0.7);
```

### View Mode Control

```javascript
// Set view mode (with smooth animation)
avatarAPI.setViewMode('full-body', true);
avatarAPI.setViewMode('half-body', true);
avatarAPI.setViewMode('head-only', true);

// Cycle through view modes
avatarAPI.cycleViewMode();

// Set instantly (no animation)
avatarAPI.setViewMode('head-only', false);
```

### Status & Info

```javascript
// Get current status
const status = avatarAPI.getStatus();
console.log(status);
// {
//   currentAnimation: 'idle',
//   currentEmotion: 'joy',
//   currentViewMode: 'full-body',
//   loadedAnimations: ['idle', 'breathing', 'waving', ...],
//   availableAnimations: ['idle', 'breathing', 'waving', 'talking', ...],
//   loadingAnimations: false
// }
```

---

## 🎭 Available Animations

All animations are located in `/public/animations/*.fbx`:

### Basic Animations
- `idle` - Standing idle pose
- `breathing` - Gentle breathing motion
- `look-around` - Looking around naturally

### Greetings & Gestures
- `waving` - Friendly wave
- `talking` - Conversation gestures
- `thinking` - Thoughtful pose

### Emotions (can combine with emotion system!)
- `happy` - Happy expression
- `sad` - Sad expression
- `surprised` - Surprised reaction
- `angry` - Angry stance

### Fun Animations
- `dance` - Dance moves
- `jump` - Jump animation
- `backflip` - Backflip stunt

### Sitting & Standing
- `sitting` - Sit down
- `standing-up` - Stand up from sitting

### Movement
- `walking` - Walk forward
- `running` - Run forward
- `sneaking` - Sneak movement
- `zombie-walk` - Zombie walk
- `crouch-walk` - Crouch walking
- `crawl` - Crawling
- `strafe-left` - Strafe left
- `strafe-right` - Strafe right

### Combat
- `punch` - Punch attack
- `kick` - Kick attack
- `block` - Defensive block
- `dodge` - Dodge movement
- `hit-reaction` - Taking a hit
- `death` - Death animation
- `falling` - Falling

### Weapons
- `rifle-walk` - Walk with rifle
- `rifle-aim` - Aim rifle
- `rifle-shoot` - Shoot rifle
- `pistol-shoot` - Shoot pistol
- `draw-sword` - Draw sword
- `sheathe-sword` - Sheathe sword
- `throw` - Throwing motion

### Actions
- `climb` - Climbing
- `push` - Pushing

---

## 📚 Example Usage Scenarios

### LLM Integration

```javascript
// Example: AI responds with emotion and animation
function handleAIResponse(text, emotion, animation) {
  // Set emotion
  avatarAPI.setEmotion(emotion, 0.9);
  
  // Play animation
  avatarAPI.playAnimation(animation, { loop: false });
  
  // Display text...
  console.log(text);
}

// AI says something happy
handleAIResponse(
  "That's amazing! I'm so glad to hear that!",
  'joy',
  'waving'
);

// AI explains something
handleAIResponse(
  "Let me think about that for a moment...",
  'neutral',
  'thinking'
);
```

### Interactive Demo

```javascript
// Create a sequence of actions
async function demo() {
  // Start with greeting
  avatarAPI.setViewMode('full-body');
  avatarAPI.setEmotion('joy', 1.0);
  avatarAPI.playAnimation('waving');
  
  await sleep(3000);
  
  // Show some moves
  avatarAPI.playAnimation('dance');
  
  await sleep(5000);
  
  // Close-up for talking
  avatarAPI.setViewMode('head-only', true);
  avatarAPI.setEmotion('relaxed', 0.8);
  avatarAPI.playAnimation('talking');
  
  await sleep(4000);
  
  // Back to idle
  avatarAPI.setViewMode('full-body', true);
  avatarAPI.setEmotion('neutral', 1.0);
  avatarAPI.playAnimation('idle');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

demo();
```

### Voice Chat Integration

```javascript
// When user speaks
function onUserSpeaking() {
  // Avatar listens attentively
  avatarAPI.setViewMode('head-only', true);
  avatarAPI.setEmotion('neutral', 1.0);
  avatarAPI.playAnimation('look-around');
}

// When AI responds
function onAIResponding(emotion = 'neutral') {
  // Avatar talks back
  avatarAPI.setEmotion(emotion, 0.9);
  avatarAPI.playAnimation('talking', { loop: true });
}

// When conversation ends
function onConversationEnd() {
  avatarAPI.setViewMode('full-body', true);
  avatarAPI.setEmotion('relaxed', 1.0);
  avatarAPI.playAnimation('idle');
}
```

---

## 🏗️ Architecture

### Modular Components

```
client/src/lib/
├── retargeting.ts         # Mixamo → VRM bone mapping
├── AnimationManager.ts    # FBX loading & playback
├── emotionSystem.ts       # VRM blendshape emotions
└── viewModeSystem.ts      # Camera view control
```

### How It Works

1. **Bone Retargeting** (`retargeting.ts`)
   - Maps Mixamo bone names (mixamorigHips) to VRM (hips)
   - Converts AnimationClip tracks to VRM-compatible format
   - No Blender needed - all client-side!

2. **Animation Manager** (`AnimationManager.ts`)
   - Loads FBX files using FBXLoader
   - Retargets animations using bone mapper
   - Caches animations for performance
   - Handles cross-fading between animations

3. **Emotion System** (`emotionSystem.ts`)
   - Uses VRM expression presets (happy, sad, etc.)
   - Smoothly interpolates between emotions
   - Auto-blink system for realism
   - Ready for lip-sync via visemes

4. **View Mode System** (`viewModeSystem.ts`)
   - Animates camera position and FOV
   - Adjusts zoom limits per mode
   - Smooth transitions with easing

---

## 🚀 Quick Start

### 1. Test in Browser

Open the dev tools console and try:

```javascript
// Check status
avatarAPI.getStatus();

// Play animation
avatarAPI.playAnimation('waving');

// Change emotion
avatarAPI.setEmotion('joy', 1.0);

// Change view
avatarAPI.setViewMode('head-only');
```

### 2. Load All Animations

```javascript
// This will take a few seconds
await avatarAPI.loadAllAnimations((loaded, total) => {
  console.log(`${loaded}/${total} animations loaded`);
});

// Now all 38 animations are ready!
```

### 3. Create Custom Sequences

```javascript
async function greetUser() {
  avatarAPI.setEmotion('joy', 1.0);
  avatarAPI.playAnimation('waving');
  await sleep(2000);
  avatarAPI.playAnimation('talking');
}

greetUser();
```

---

## 🎨 UI Control Panel

The app includes a visual control panel with:
- **Real-time status** display
- **Animation buttons** for all loaded animations
- **Emotion toggles** for all 6 emotions
- **View mode switcher**
- **Load all animations** button with progress

---

## 🔌 LLM/AI Integration Format

Recommended API response format:

```json
{
  "text": "Hello! How can I help you today?",
  "emotion": "joy",
  "emotionIntensity": 0.8,
  "animation": "waving",
  "viewMode": "full-body"
}
```

Process it like:

```javascript
function processAIResponse(response) {
  const { text, emotion, emotionIntensity, animation, viewMode } = response;
  
  if (viewMode) {
    avatarAPI.setViewMode(viewMode, true);
  }
  
  if (emotion) {
    avatarAPI.setEmotion(emotion, emotionIntensity || 1.0);
  }
  
  if (animation) {
    avatarAPI.playAnimation(animation);
  }
  
  // Display text...
  console.log(text);
}
```

---

## 📖 TypeScript Types

```typescript
// Animation options
interface AnimationOptions {
  loop?: boolean;              // Loop animation (default: true)
  crossFadeDuration?: number;  // Fade duration in seconds (default: 0.5)
  timeScale?: number;          // Speed multiplier (default: 1.0)
}

// Emotions
type Emotion = 'neutral' | 'joy' | 'angry' | 'sad' | 'surprised' | 'relaxed';

// View modes
type ViewMode = 'full-body' | 'half-body' | 'head-only';

// Status response
interface Status {
  currentAnimation: string | null;
  currentEmotion: Emotion;
  currentViewMode: ViewMode;
  loadedAnimations: string[];
  availableAnimations: string[];
  loadingAnimations: boolean;
}
```

---

## 🎯 Next Steps

1. **Add More Animations**: Place FBX files in `/public/animations/`
2. **Custom Emotions**: Extend EmotionSystem with blendshape combinations
3. **Voice Sync**: Integrate lip-sync with audio analysis
4. **AI Integration**: Connect to your LLM backend
5. **Custom Gestures**: Create animation sequences

---

## 💡 Tips

- **Performance**: Preload essential animations on startup
- **Smooth Transitions**: Use cross-fading (default 0.5s)
- **Emotion Intensity**: Use values 0.5-0.8 for subtle expressions
- **View Modes**: Use head-only for conversation, full-body for actions
- **Animation Loop**: Set loop=false for one-time gestures

---

## 🐛 Troubleshooting

**Animation not playing?**
```javascript
// Check if loaded
console.log(avatarAPI.getStatus().loadedAnimations);

// Load it first
await avatarAPI.loadAnimation('your-animation');
```

**Emotion not visible?**
```javascript
// Check if VRM supports expressions
console.log(vrm.expressionManager);

// Try higher intensity
avatarAPI.setEmotion('joy', 1.0);
```

**View mode not changing?**
```javascript
// Check current mode
console.log(avatarAPI.getStatus().currentViewMode);

// Force instant change
avatarAPI.setViewMode('head-only', false);
```

---

Built with ❤️ using React, Three.js, and @pixiv/three-vrm
