const AVAILABLE_ACTIONS = [
  'wave',
  'point',
  'nod',
  'shake_head',
  'bow',
  'thumbs_up',
  'dance',
  'jump',
  'celebrate',
  'think',
  'shrug'
];

const AVAILABLE_EMOTIONS = ['neutral', 'happy', 'sad', 'angry', 'cute', 'excited', 'nervous', 'surprised', 'confused'];
const VIEW_MODES = ['full-body', 'half-body', 'head-only', 'cinematic'];

function buildAnimationPrompt(userMessage, agentResponse) {
  const availableActionsStr = AVAILABLE_ACTIONS.map(a => `"${a}"`).join(', ');
  const availableEmotionsStr = AVAILABLE_EMOTIONS.map(e => `"${e}"`).join(', ');
  
  return `You are an AI animation director. Based on the conversation, you MUST output ONLY valid JSON with procedural animation commands.

STRICT RULES:
1. Output ONLY the JSON object, no other text
2. Use ONLY actions from this exact list: ${availableActionsStr} or null
3. Use ONLY emotions from: ${availableEmotionsStr}
4. Use ONLY viewMode from: full-body, half-body, head-only, cinematic

User said: "${userMessage}"
Your response: "${agentResponse}"

Based on your response, choose:
- emotion: Avatar's emotional state (neutral/happy/sad/angry/cute/excited/nervous/surprised/confused)
- action: Procedural gesture/action or null for emotion-only (wave/point/nod/shake_head/bow/thumbs_up/dance/jump/celebrate/think/shrug)
- intensity: Emotion strength 0.0-1.0
- duration: Action duration in seconds (optional, 1.0-5.0)
- lookAtUser: Should avatar look at camera? (true/false)
- viewMode: Camera view (full-body/half-body/head-only/cinematic)
- interrupt: Interrupt current animation? (true/false)

Output ONLY this JSON structure:
{
  "emotion": "happy",
  "action": "wave",
  "intensity": 0.8,
  "duration": 2.0,
  "lookAtUser": true,
  "viewMode": "half-body",
  "interrupt": true
}

Common mappings:
- Greeting → emotion: happy, action: wave, viewMode: half-body, lookAtUser: true
- Celebration → emotion: excited, action: celebrate, viewMode: full-body
- Gratitude → emotion: happy, action: bow, viewMode: half-body
- Agreement → emotion: happy, action: nod, viewMode: head-only
- Disagreement → emotion: neutral, action: shake_head, viewMode: head-only
- Approval → emotion: happy, action: thumbs_up, viewMode: half-body
- Dancing/Fun → emotion: excited, action: dance, viewMode: full-body
- Excited jump → emotion: excited, action: jump, viewMode: full-body
- Pointing/Explaining → emotion: neutral, action: point, viewMode: half-body
- Thinking/Pondering → emotion: neutral, action: think, viewMode: half-body
- Confused/Uncertain → emotion: confused, action: shrug, viewMode: half-body
- Sad response → emotion: sad, action: null, viewMode: head-only
- Nervous → emotion: nervous, action: null, viewMode: head-only, lookAtUser: false
- Cute response → emotion: cute, action: wave, viewMode: half-body

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
    action: null,
    intensity: 0.7,
    duration: undefined,
    lookAtUser: false,
    viewMode: 'half-body',
    interrupt: true
  };

  if (payload.emotion && AVAILABLE_EMOTIONS.includes(payload.emotion)) {
    validated.emotion = payload.emotion;
  } else if (payload.emotion) {
    console.warn(`Invalid emotion "${payload.emotion}", using neutral`);
  }

  if (payload.action !== undefined) {
    if (payload.action === null || AVAILABLE_ACTIONS.includes(payload.action)) {
      validated.action = payload.action;
    } else {
      console.warn(`Invalid action "${payload.action}", setting to null`);
      validated.action = null;
    }
  }

  if (payload.animation && AVAILABLE_ACTIONS.includes(payload.animation)) {
    validated.action = payload.animation;
  }

  if (typeof payload.intensity === 'number') {
    validated.intensity = Math.max(0, Math.min(1, payload.intensity));
  }

  if (typeof payload.duration === 'number') {
    validated.duration = Math.max(0.1, Math.min(10, payload.duration));
  }

  if (typeof payload.lookAtUser === 'boolean') {
    validated.lookAtUser = payload.lookAtUser;
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
    action: null,
    intensity: 0.7,
    duration: undefined,
    lookAtUser: false,
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
  AVAILABLE_ACTIONS,
  AVAILABLE_EMOTIONS,
  VIEW_MODES
};
