import { VRM } from '@pixiv/three-vrm';
import { ProceduralAnimation } from '../types/animation';

export class ActionAnimations {
  static createWaveGesture(hand: 'left' | 'right' = 'right'): ProceduralAnimation {
    let startTime = 0;
    const waveDuration = 2.0;

    return {
      name: `wave_${hand}`,
      layer: 'gesture',
      priority: 20,
      loop: false,
      duration: waveDuration,
      update: (vrm: VRM, time: number, _deltaTime: number) => {
        const humanoid = vrm.humanoid;
        if (!humanoid) return;

        const elapsed = time - startTime;
        const progress = Math.min(elapsed / waveDuration, 1);

        const upperArm = humanoid.getNormalizedBoneNode(hand === 'right' ? 'rightUpperArm' : 'leftUpperArm');
        const lowerArm = humanoid.getNormalizedBoneNode(hand === 'right' ? 'rightLowerArm' : 'leftLowerArm');
        const handNode = humanoid.getNormalizedBoneNode(hand === 'right' ? 'rightHand' : 'leftHand');

        if (upperArm) {
          const raiseAmount = this.easeInOutCubic(Math.min(progress * 2, 1)) * (Math.PI / 2);
          upperArm.rotation.x = raiseAmount;
          upperArm.rotation.z = hand === 'right' ? Math.PI / 6 : -Math.PI / 6;
        }

        if (lowerArm) {
          lowerArm.rotation.y = hand === 'right' ? -Math.PI / 4 : Math.PI / 4;
        }

        if (handNode && progress > 0.3) {
          const wavePhase = (progress - 0.3) / 0.7;
          const waveAmount = Math.sin(wavePhase * Math.PI * 6) * 0.4;
          handNode.rotation.z = hand === 'right' ? waveAmount : -waveAmount;
        }
      },
      onStart: (_vrm: VRM) => {
        startTime = performance.now() / 1000;
        console.log(`👋 Starting wave animation (${hand} hand)`);
      }
    };
  }

  static createPointGesture(hand: 'left' | 'right' = 'right'): ProceduralAnimation {
    let startTime = 0;
    const duration = 1.5;

    return {
      name: `point_${hand}`,
      layer: 'gesture',
      priority: 20,
      loop: false,
      duration: duration,
      update: (vrm: VRM, time: number, _deltaTime: number) => {
        const humanoid = vrm.humanoid;
        if (!humanoid) return;

        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = this.easeOutElastic(progress);

        const upperArm = humanoid.getNormalizedBoneNode(hand === 'right' ? 'rightUpperArm' : 'leftUpperArm');
        const lowerArm = humanoid.getNormalizedBoneNode(hand === 'right' ? 'rightLowerArm' : 'leftLowerArm');
        const handNode = humanoid.getNormalizedBoneNode(hand === 'right' ? 'rightHand' : 'leftHand');

        if (upperArm) {
          upperArm.rotation.x = eased * Math.PI / 3;
          upperArm.rotation.z = hand === 'right' ? eased * Math.PI / 4 : -eased * Math.PI / 4;
        }

        if (lowerArm) {
          lowerArm.rotation.y = 0;
        }

        if (handNode) {
          const fingers = hand === 'right'
            ? ['rightIndexProximal', 'rightMiddleProximal', 'rightRingProximal', 'rightLittleProximal']
            : ['leftIndexProximal', 'leftMiddleProximal', 'leftRingProximal', 'leftLittleProximal'];

          fingers.slice(1).forEach(boneName => {
            const bone = humanoid.getNormalizedBoneNode(boneName as any);
            if (bone) {
              bone.rotation.z = -Math.PI / 4;
            }
          });
        }
      },
      onStart: (_vrm: VRM) => {
        startTime = performance.now() / 1000;
      }
    };
  }

  static createNodGesture(intensity: number = 1.0): ProceduralAnimation {
    let startTime = 0;
    const duration = 1.0;

    return {
      name: 'nod',
      layer: 'gesture',
      priority: 15,
      loop: false,
      duration: duration,
      update: (vrm: VRM, time: number, _deltaTime: number) => {
        const humanoid = vrm.humanoid;
        if (!humanoid) return;

        const elapsed = time - startTime;
        const progress = elapsed / duration;

        const head = humanoid.getNormalizedBoneNode('head');
        const neck = humanoid.getNormalizedBoneNode('neck');

        if (head || neck) {
          const nodAmount = Math.sin(progress * Math.PI * 4) * 0.2 * intensity;
          const dampening = 1 - progress;

          if (head) {
            head.rotation.x = nodAmount * dampening;
          }
          if (neck) {
            neck.rotation.x = nodAmount * 0.5 * dampening;
          }
        }
      },
      onStart: (_vrm: VRM) => {
        startTime = performance.now() / 1000;
      }
    };
  }

  static createShakeHeadGesture(): ProceduralAnimation {
    let startTime = 0;
    const duration = 1.2;

    return {
      name: 'shake_head',
      layer: 'gesture',
      priority: 15,
      loop: false,
      duration: duration,
      update: (vrm: VRM, time: number, _deltaTime: number) => {
        const humanoid = vrm.humanoid;
        if (!humanoid) return;

        const elapsed = time - startTime;
        const progress = elapsed / duration;

        const head = humanoid.getNormalizedBoneNode('head');
        const neck = humanoid.getNormalizedBoneNode('neck');

        if (head || neck) {
          const shakeAmount = Math.sin(progress * Math.PI * 5) * 0.3;
          const dampening = 1 - progress;

          if (head) {
            head.rotation.y = shakeAmount * dampening;
          }
          if (neck) {
            neck.rotation.y = shakeAmount * 0.5 * dampening;
          }
        }
      },
      onStart: (_vrm: VRM) => {
        startTime = performance.now() / 1000;
      }
    };
  }

  static createBowGesture(depth: number = 0.5): ProceduralAnimation {
    let startTime = 0;
    const duration = 2.0;

    return {
      name: 'bow',
      layer: 'gesture',
      priority: 25,
      loop: false,
      duration: duration,
      update: (vrm: VRM, time: number, _deltaTime: number) => {
        const humanoid = vrm.humanoid;
        if (!humanoid) return;

        const elapsed = time - startTime;
        const progress = elapsed / duration;

        const spine = humanoid.getNormalizedBoneNode('spine');
        const chest = humanoid.getNormalizedBoneNode('chest');
        const neck = humanoid.getNormalizedBoneNode('neck');

        const bowCurve = progress < 0.5
          ? this.easeInOutCubic(progress * 2)
          : this.easeInOutCubic(2 - progress * 2);

        const bowAmount = bowCurve * depth * Math.PI / 4;

        if (spine) {
          spine.rotation.x = bowAmount * 0.6;
        }
        if (chest) {
          chest.rotation.x = bowAmount * 0.3;
        }
        if (neck) {
          neck.rotation.x = bowAmount * 0.1;
        }
      },
      onStart: (_vrm: VRM) => {
        startTime = performance.now() / 1000;
      }
    };
  }

  static createThumbsUpGesture(hand: 'left' | 'right' = 'right'): ProceduralAnimation {
    let startTime = 0;
    const duration = 1.5;

    return {
      name: `thumbs_up_${hand}`,
      layer: 'gesture',
      priority: 20,
      loop: false,
      duration: duration,
      update: (vrm: VRM, time: number, _deltaTime: number) => {
        const humanoid = vrm.humanoid;
        if (!humanoid) return;

        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = this.easeOutBack(progress);

        const upperArm = humanoid.getNormalizedBoneNode(hand === 'right' ? 'rightUpperArm' : 'leftUpperArm');
        const lowerArm = humanoid.getNormalizedBoneNode(hand === 'right' ? 'rightLowerArm' : 'leftLowerArm');

        if (upperArm) {
          upperArm.rotation.x = eased * Math.PI / 4;
          upperArm.rotation.z = hand === 'right' ? eased * Math.PI / 6 : -eased * Math.PI / 6;
        }

        if (lowerArm) {
          lowerArm.rotation.y = hand === 'right' ? -eased * Math.PI / 3 : eased * Math.PI / 3;
        }
      },
      onStart: (_vrm: VRM) => {
        startTime = performance.now() / 1000;
      }
    };
  }

  static createDanceAnimation(style: 'groove' | 'energetic' = 'groove'): ProceduralAnimation {
    let startTime = 0;
    const duration = style === 'energetic' ? 4.0 : 6.0;

    return {
      name: `dance_${style}`,
      layer: 'locomotion',
      priority: 30,
      loop: true,
      duration: duration,
      update: (vrm: VRM, time: number, _deltaTime: number) => {
        const humanoid = vrm.humanoid;
        if (!humanoid) return;

        const elapsed = time - startTime;
        const phase = (elapsed / duration) * Math.PI * 2;

        const hips = humanoid.getNormalizedBoneNode('hips');
        const spine = humanoid.getNormalizedBoneNode('spine');
        const chest = humanoid.getNormalizedBoneNode('chest');
        const leftUpperArm = humanoid.getNormalizedBoneNode('leftUpperArm');
        const rightUpperArm = humanoid.getNormalizedBoneNode('rightUpperArm');

        if (hips) {
          hips.rotation.y = Math.sin(phase) * 0.15;
          hips.rotation.z = Math.sin(phase * 2) * 0.1;
        }

        if (spine) {
          spine.rotation.y = Math.sin(phase + Math.PI / 4) * 0.1;
          spine.rotation.z = Math.sin(phase * 1.5) * 0.08;
        }

        if (chest) {
          chest.rotation.y = Math.sin(phase + Math.PI / 2) * 0.12;
        }

        if (leftUpperArm) {
          leftUpperArm.rotation.z = -Math.PI / 4 + Math.sin(phase) * 0.5;
          leftUpperArm.rotation.x = Math.sin(phase * 2) * 0.3;
        }

        if (rightUpperArm) {
          rightUpperArm.rotation.z = Math.PI / 4 + Math.sin(phase + Math.PI) * 0.5;
          rightUpperArm.rotation.x = Math.sin(phase * 2 + Math.PI) * 0.3;
        }
      },
      onStart: (_vrm: VRM) => {
        startTime = performance.now() / 1000;
      }
    };
  }

  static createJumpAnimation(): ProceduralAnimation {
    let startTime = 0;
    const duration = 1.2;

    return {
      name: 'jump',
      layer: 'locomotion',
      priority: 35,
      loop: false,
      duration: duration,
      update: (vrm: VRM, time: number, _deltaTime: number) => {
        const humanoid = vrm.humanoid;
        if (!humanoid) return;

        const elapsed = time - startTime;
        const progress = elapsed / duration;

        const hips = humanoid.getNormalizedBoneNode('hips');
        const leftUpperLeg = humanoid.getNormalizedBoneNode('leftUpperLeg');
        const rightUpperLeg = humanoid.getNormalizedBoneNode('rightUpperLeg');
        const leftLowerLeg = humanoid.getNormalizedBoneNode('leftLowerLeg');
        const rightLowerLeg = humanoid.getNormalizedBoneNode('rightLowerLeg');

        const jumpHeight = Math.sin(progress * Math.PI) * 0.5;

        if (hips && vrm.scene) {
          vrm.scene.position.y = jumpHeight;
        }

        if (progress < 0.3) {
          const squatAmount = (0.3 - progress) / 0.3;
          if (leftUpperLeg) leftUpperLeg.rotation.x = squatAmount * Math.PI / 4;
          if (rightUpperLeg) rightUpperLeg.rotation.x = squatAmount * Math.PI / 4;
          if (leftLowerLeg) leftLowerLeg.rotation.x = -squatAmount * Math.PI / 3;
          if (rightLowerLeg) rightLowerLeg.rotation.x = -squatAmount * Math.PI / 3;
        } else if (progress > 0.7) {
          const landAmount = (progress - 0.7) / 0.3;
          if (leftUpperLeg) leftUpperLeg.rotation.x = landAmount * Math.PI / 6;
          if (rightUpperLeg) rightUpperLeg.rotation.x = landAmount * Math.PI / 6;
          if (leftLowerLeg) leftLowerLeg.rotation.x = -landAmount * Math.PI / 4;
          if (rightLowerLeg) rightLowerLeg.rotation.x = -landAmount * Math.PI / 4;
        }
      },
      onStart: (_vrm: VRM) => {
        startTime = performance.now() / 1000;
      },
      onEnd: (vrm: VRM) => {
        if (vrm.scene) {
          vrm.scene.position.y = 0;
        }
      }
    };
  }

  static createCelebrationAnimation(): ProceduralAnimation {
    let startTime = 0;
    const duration = 2.5;

    return {
      name: 'celebrate',
      layer: 'gesture',
      priority: 30,
      loop: false,
      duration: duration,
      update: (vrm: VRM, time: number, _deltaTime: number) => {
        const humanoid = vrm.humanoid;
        if (!humanoid) return;

        const elapsed = time - startTime;
        const progress = elapsed / duration;

        const leftUpperArm = humanoid.getNormalizedBoneNode('leftUpperArm');
        const rightUpperArm = humanoid.getNormalizedBoneNode('rightUpperArm');
        const spine = humanoid.getNormalizedBoneNode('spine');

        const raiseProgress = this.easeOutBack(Math.min(progress * 2, 1));
        const pumpPhase = progress * Math.PI * 8;

        if (leftUpperArm) {
          leftUpperArm.rotation.x = raiseProgress * Math.PI / 2;
          leftUpperArm.rotation.z = -raiseProgress * Math.PI / 4;
          leftUpperArm.rotation.y = Math.sin(pumpPhase) * 0.2;
        }

        if (rightUpperArm) {
          rightUpperArm.rotation.x = raiseProgress * Math.PI / 2;
          rightUpperArm.rotation.z = raiseProgress * Math.PI / 4;
          rightUpperArm.rotation.y = -Math.sin(pumpPhase) * 0.2;
        }

        if (spine) {
          spine.rotation.z = Math.sin(pumpPhase) * 0.1;
        }
      },
      onStart: (_vrm: VRM) => {
        startTime = performance.now() / 1000;
      }
    };
  }

  static createThinkAnimation(): ProceduralAnimation {
    let startTime = 0;
    const duration = 3.0;

    return {
      name: 'think',
      layer: 'gesture',
      priority: 18,
      loop: false,
      duration: duration,
      update: (vrm: VRM, time: number, _deltaTime: number) => {
        const humanoid = vrm.humanoid;
        if (!humanoid) return;

        const elapsed = time - startTime;
        const progress = elapsed / duration;

        const head = humanoid.getNormalizedBoneNode('head');
        const rightUpperArm = humanoid.getNormalizedBoneNode('rightUpperArm');
        const rightLowerArm = humanoid.getNormalizedBoneNode('rightLowerArm');
        const rightHand = humanoid.getNormalizedBoneNode('rightHand');

        const raiseProgress = this.easeInOutCubic(Math.min(progress * 2, 1));
        const thinkPhase = progress * Math.PI * 2;

        if (head) {
          head.rotation.x = -0.1 + Math.sin(thinkPhase) * 0.05;
          head.rotation.y = 0.2 + Math.sin(thinkPhase * 0.5) * 0.1;
        }

        if (rightUpperArm) {
          rightUpperArm.rotation.x = raiseProgress * Math.PI / 3;
          rightUpperArm.rotation.z = raiseProgress * Math.PI / 6;
        }

        if (rightLowerArm) {
          rightLowerArm.rotation.y = -raiseProgress * Math.PI / 2.5;
        }

        if (rightHand) {
          rightHand.rotation.x = raiseProgress * 0.3;
        }
      },
      onStart: (_vrm: VRM) => {
        startTime = performance.now() / 1000;
      }
    };
  }

  static createShrugGesture(): ProceduralAnimation {
    let startTime = 0;
    const duration = 1.5;

    return {
      name: 'shrug',
      layer: 'gesture',
      priority: 20,
      loop: false,
      duration: duration,
      update: (vrm: VRM, time: number, _deltaTime: number) => {
        const humanoid = vrm.humanoid;
        if (!humanoid) return;

        const elapsed = time - startTime;
        const progress = elapsed / duration;

        const shrugCurve = progress < 0.5
          ? this.easeOutCubic(progress * 2)
          : this.easeInCubic(2 - progress * 2);

        const leftShoulder = humanoid.getNormalizedBoneNode('leftShoulder');
        const rightShoulder = humanoid.getNormalizedBoneNode('rightShoulder');
        const leftUpperArm = humanoid.getNormalizedBoneNode('leftUpperArm');
        const rightUpperArm = humanoid.getNormalizedBoneNode('rightUpperArm');
        const head = humanoid.getNormalizedBoneNode('head');

        if (leftShoulder) {
          leftShoulder.rotation.z = -shrugCurve * 0.3;
        }
        if (rightShoulder) {
          rightShoulder.rotation.z = shrugCurve * 0.3;
        }
        if (leftUpperArm) {
          leftUpperArm.rotation.z = -shrugCurve * 0.4;
        }
        if (rightUpperArm) {
          rightUpperArm.rotation.z = shrugCurve * 0.4;
        }
        if (head) {
          head.rotation.x = shrugCurve * 0.1;
        }
      },
      onStart: (_vrm: VRM) => {
        startTime = performance.now() / 1000;
      }
    };
  }

  private static easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private static easeOutElastic(t: number): number {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }

  private static easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  private static easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private static easeInCubic(t: number): number {
    return t * t * t;
  }
}
