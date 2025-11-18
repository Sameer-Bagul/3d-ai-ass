const AVAILABLE_ANIMATIONS = [
  'idle',
  'breathing_idle',
  'happy_idle',
  'backflip',
  'blow_a_kiss',
  'catwalk_walk',
  'cocky_head_turn',
  'dancing_twerk',
  'jumping_down',
  'pointing_gesture',
  'praying',
  'quick_formal_bow',
  'standing_thumbs_up',
  'victory',
  'waving',
  'ass_bumb_female_standing_pose',
  'female_crouch_pose',
  'female_laying_pose',
  'female_standing_pose_bold'
];

const AVAILABLE_EMOTIONS = ['happy', 'sad', 'angry', 'surprised', 'confused', 'neutral'];
const VIEW_MODES = ['full-body', 'half-body', 'head-only'];

function buildAnimationPrompt(userMessage, agentResponse) {
  const availableAnimsStr = AVAILABLE_ANIMATIONS.map(a => `"${a}"`).join(', ');
  
  return `You are an AI animation director. Based on the conversation, you MUST output ONLY valid JSON with animation and emotion instructions.

STRICT RULES:
1. Output ONLY the JSON object, no other text
2. Use ONLY animations from this exact list: ${availableAnimsStr}
3. Use ONLY emotions from: happy, sad, angry, surprised, confused, neutral
4. Use ONLY viewMode from: full-body, half-body, head-only

User said: "${userMessage}"
Your response: "${agentResponse}"

Based on your response, choose:
- emotion: How should the avatar feel? (happy/sad/angry/surprised/confused/neutral)
- animation: What should the avatar do? Choose from available animations or use null for none
- intensity: Emotion strength (0.0-1.0)
- viewMode: Camera view (full-body for full actions, half-body for gestures, head-only for facial expressions)
- interrupt: Should this interrupt current animation? (true/false)

Output ONLY this JSON structure:
{
  "emotion": "happy",
  "animation": "waving",
  "intensity": 0.8,
  "viewMode": "half-body",
  "interrupt": true
}

Common mappings:
- Greeting → emotion: happy, animation: waving, viewMode: half-body
- Celebration → emotion: happy, animation: victory, viewMode: full-body
- Gratitude → emotion: happy, animation: quick_formal_bow, viewMode: half-body
- Flirty/Love → emotion: happy, animation: blow_a_kiss, viewMode: half-body
- Dancing → emotion: happy, animation: dancing_twerk, viewMode: full-body
- Excited → emotion: happy, animation: jumping_down, viewMode: full-body
- Pointing/Explaining → emotion: neutral, animation: pointing_gesture, viewMode: half-body
- Prayer/Hope → emotion: neutral, animation: praying, viewMode: half-body
- Confident → emotion: happy, animation: cocky_head_turn, viewMode: half-body
- Approval → emotion: happy, animation: standing_thumbs_up, viewMode: half-body
- Sad response → emotion: sad, animation: null, viewMode: head-only
- Confused → emotion: confused, animation: null, viewMode: head-only

Now generate the JSON for this conversation (JSON only, no other text):`;
}

async function generateAnimationWithLLM(userMessage, agentResponse, ollamaService) {
  try {
    const prompt = buildAnimationPrompt(userMessage, agentResponse);
    
    const response = await ollamaService.generate(prompt, {
      temperature: 0.3,
      max_tokens: 200
    });

    let jsonText = response.text.trim();
    
    jsonText = jsonText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    jsonText = jsonText.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    
    const parsed = JSON.parse(jsonText);
    
    const validated = validateAnimationPayload(parsed);
    
    console.log('🎬 LLM Generated Animation:', validated);
    return validated;
    
  } catch (error) {
    console.error('❌ Error generating animation with LLM:', error);
    console.error('LLM Response:', error.message);
    return getDefaultAnimation();
  }
}

function validateAnimationPayload(payload) {
  const validated = {
    emotion: 'neutral',
    animation: null,
    intensity: 0.7,
    viewMode: 'half-body',
    interrupt: true
  };

  if (payload.emotion && AVAILABLE_EMOTIONS.includes(payload.emotion)) {
    validated.emotion = payload.emotion;
  } else if (payload.emotion) {
    console.warn(`Invalid emotion "${payload.emotion}", using neutral`);
  }

  if (payload.animation) {
    if (AVAILABLE_ANIMATIONS.includes(payload.animation)) {
      validated.animation = payload.animation;
    } else {
      console.warn(`Invalid animation "${payload.animation}", setting to null`);
      validated.animation = null;
    }
  }

  if (typeof payload.intensity === 'number') {
    validated.intensity = Math.max(0, Math.min(1, payload.intensity));
  }

  if (payload.viewMode && VIEW_MODES.includes(payload.viewMode)) {
    validated.viewMode = payload.viewMode;
  }

  if (typeof payload.interrupt === 'boolean') {
    validated.interrupt = payload.interrupt;
  }

  return validated;
}

function getDefaultAnimation() {
  return {
    emotion: 'neutral',
    animation: null,
    intensity: 0.7,
    viewMode: 'half-body',
    interrupt: false
  };
}

function createAnimationPlan(config) {
  const { text, type = 'speech', style = 'casual' } = config;
  
  const plan = {
    type: type,
    text: text,
    commands: []
  };
  
  if (type === 'speech') {
    plan.ttsId = `tts_${Date.now()}`;
    plan.phonemeFile = `/api/phonemes/${plan.ttsId}`;
  }
  
  if (text.includes('?')) {
    plan.commands.push({
      type: 'head',
      keyframes: [
        { t: 0.0, pitch: 0.0, yaw: 0.0 },
        { t: 0.5, pitch: 0.15, yaw: 0.05 }
      ],
      description: 'Curious head tilt'
    });
  }
  
  if (text.includes('!')) {
    plan.commands.push({
      type: 'gesture',
      name: 'nod',
      intensity: 0.8,
      description: 'Emphatic nod'
    });
  }
  
  const intensity = style === 'excited' ? 1.0 : 0.6;
  plan.commands.push({
    type: 'expression',
    blendshapes: {
      'mouthSmile': intensity * 0.4,
      'eyeSquint': intensity * 0.2
    },
    duration: 1.0
  });
  
  return plan;
}

function parseAnimationCommand(llmOutput) {
  try {
    const parsed = JSON.parse(llmOutput);
    if (parsed.animation) {
      return parsed.animation;
    }
  } catch (error) {
    console.warn('Could not parse LLM output as structured animation');
  }
  
  return null;
}

module.exports = {
  createAnimationPlan,
  parseAnimationCommand,
  generateAnimationWithLLM,
  validateAnimationPayload,
  getDefaultAnimation,
  AVAILABLE_ANIMATIONS,
  AVAILABLE_EMOTIONS,
  VIEW_MODES
};
