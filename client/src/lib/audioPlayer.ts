let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

export function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

export async function playAudio(audioUrl: string): Promise<number> {
  const ctx = getAudioContext();
  
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  try {
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    
    const startTime = ctx.currentTime;
    source.start(startTime);
    
    currentSource = source;
    
    console.log(`🔊 Audio playing at time: ${startTime}`);
    
    return startTime;
  } catch (error) {
    console.error('Audio playback error:', error);
    throw error;
  }
}

export function stopAudio() {
  if (currentSource) {
    try {
      currentSource.stop();
    } catch (error) {
      console.warn('Error stopping audio:', error);
    }
    currentSource = null;
  }
}

export function analyzeAmplitude(audioBuffer: AudioBuffer, windowSize: number = 1024): number[] {
  const channelData = audioBuffer.getChannelData(0);
  const amplitudes: number[] = [];
  
  for (let i = 0; i < channelData.length; i += windowSize) {
    let sum = 0;
    const end = Math.min(i + windowSize, channelData.length);
    
    for (let j = i; j < end; j++) {
      sum += channelData[j] * channelData[j];
    }
    
    const rms = Math.sqrt(sum / (end - i));
    amplitudes.push(rms);
  }
  
  return amplitudes;
}

export function getCurrentTime(): number {
  const ctx = getAudioContext();
  return ctx.currentTime;
}
