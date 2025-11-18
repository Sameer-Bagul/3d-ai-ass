function validateChatRequest(data) {
  if (!data.message || typeof data.message !== 'string') {
    return { valid: false, error: 'Message must be a non-empty string' };
  }
  
  if (data.message.length > 5000) {
    return { valid: false, error: 'Message too long (max 5000 characters)' };
  }
  
  return { valid: true };
}

function validateTTSRequest(data) {
  if (!data.text || typeof data.text !== 'string') {
    return { valid: false, error: 'Text must be a non-empty string' };
  }
  
  if (data.text.length > 1000) {
    return { valid: false, error: 'Text too long for TTS (max 1000 characters)' };
  }
  
  const validFormats = ['wav', 'mp3', 'ogg'];
  if (data.format && !validFormats.includes(data.format)) {
    return { valid: false, error: `Invalid format. Must be one of: ${validFormats.join(', ')}` };
  }
  
  return { valid: true };
}

function validateAnimationCommand(command) {
  if (!command.type) {
    return { valid: false, error: 'Animation command must have a type' };
  }
  
  const validTypes = ['blendshape', 'head', 'gesture', 'expression'];
  if (!validTypes.includes(command.type)) {
    return { valid: false, error: `Invalid command type. Must be one of: ${validTypes.join(', ')}` };
  }
  
  return { valid: true };
}

module.exports = {
  validateChatRequest,
  validateTTSRequest,
  validateAnimationCommand
};
