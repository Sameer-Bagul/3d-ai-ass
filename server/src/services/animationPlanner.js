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
  parseAnimationCommand
};
