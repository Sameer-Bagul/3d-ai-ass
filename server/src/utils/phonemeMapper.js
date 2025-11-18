const visemeMap = require('../data/viseme_map.json');

function phonemeToViseme(phoneme) {
  const upper = phoneme.toUpperCase();
  return visemeMap[upper] || visemeMap['X'];
}

function visemeToBlendshapes(viseme) {
  const blendshapeMap = {
    'sil': { jawOpen: 0.0, mouthPucker: 0.0 },
    'PP': { jawOpen: 0.0, mouthPucker: 0.8 },
    'FF': { jawOpen: 0.1, mouthPucker: 0.3, mouthFunnel: 0.4 },
    'TH': { jawOpen: 0.2, mouthPucker: 0.0 },
    'DD': { jawOpen: 0.3, mouthPucker: 0.0 },
    'kk': { jawOpen: 0.4, mouthPucker: 0.0 },
    'CH': { jawOpen: 0.3, mouthPucker: 0.3 },
    'SS': { jawOpen: 0.15, mouthPucker: 0.2 },
    'nn': { jawOpen: 0.25, mouthPucker: 0.0 },
    'RR': { jawOpen: 0.3, mouthPucker: 0.2 },
    'aa': { jawOpen: 0.8, mouthPucker: 0.0 },
    'E': { jawOpen: 0.5, mouthPucker: 0.0, mouthSmile: 0.3 },
    'I': { jawOpen: 0.3, mouthPucker: 0.0, mouthSmile: 0.5 },
    'O': { jawOpen: 0.6, mouthPucker: 0.6 },
    'U': { jawOpen: 0.3, mouthPucker: 0.8 }
  };
  
  return blendshapeMap[viseme] || { jawOpen: 0.2 };
}

function phonemeTimelineToBlendshapes(phonemeTimeline) {
  return phonemeTimeline.map(item => {
    const viseme = phonemeToViseme(item.phoneme);
    const blendshapes = visemeToBlendshapes(viseme);
    
    return {
      start: item.start,
      end: item.end,
      blendshapes: blendshapes
    };
  });
}

module.exports = {
  phonemeToViseme,
  visemeToBlendshapes,
  phonemeTimelineToBlendshapes
};
