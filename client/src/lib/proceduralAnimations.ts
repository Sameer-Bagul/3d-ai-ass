import { VRM } from '@pixiv/three-vrm';
import * as THREE from 'three';
import { ProceduralAnimation } from '../types/animation';

export class ProceduralAnimations {
  private static blinkTimer = 0;
  private static nextBlinkTime = 0;
  private static gazeTimer = 0;
  private static nextGazeTime = 0;
  private static currentGazeTarget = new THREE.Vector3(0, 1.5, 5);

  static createIdleBreathing(): ProceduralAnimation {
    return {
      name: 'idle_breathing',
      layer: 'base',
      priority: 1,
      loop: true,
      duration: Infinity,
      update: (vrm: VRM, time: number, _deltaTime: number) => {
        const humanoid = vrm.humanoid;
        if (!humanoid) return;

        const breathFrequency = 0.3;
        const breathAmount = Math.sin(time * Math.PI * 2 * breathFrequency) * 0.02;

        const spine = humanoid.getNormalizedBoneNode('spine');
        if (spine) {
          spine.rotation.x = breathAmount;
        }

        const chest = humanoid.getNormalizedBoneNode('chest');
        if (chest) {
          chest.rotation.x = breathAmount * 0.5;
        }
      }
    };
  }

  static createIdleSway(): ProceduralAnimation {
    return {
      name: 'idle_sway',
      layer: 'base',
      priority: 2,
      loop: true,
      duration: Infinity,
      update: (vrm: VRM, time: number, _deltaTime: number) => {
        const humanoid = vrm.humanoid;
        if (!humanoid) return;

        const swayFrequency = 0.15;
        const swayAmount = Math.sin(time * Math.PI * 2 * swayFrequency) * 0.01;

        const hips = humanoid.getNormalizedBoneNode('hips');
        if (hips) {
          hips.rotation.z = swayAmount;
        }
      }
    };
  }

  static createHeadBob(): ProceduralAnimation {
    return {
      name: 'head_bob',
      layer: 'base',
      priority: 3,
      loop: true,
      duration: Infinity,
      update: (vrm: VRM, time: number, _deltaTime: number) => {
        const humanoid = vrm.humanoid;
        if (!humanoid) return;

        const bobFrequency = 0.2;
        const bobAmount = Math.sin(time * Math.PI * 2 * bobFrequency) * 0.015;

        const neck = humanoid.getNormalizedBoneNode('neck');
        if (neck) {
          neck.rotation.x = bobAmount;
        }

        const head = humanoid.getNormalizedBoneNode('head');
        if (head) {
          head.rotation.y = Math.sin(time * Math.PI * 2 * bobFrequency * 0.5) * 0.02;
        }
      }
    };
  }

  static createBlinking(
    minInterval: number = 2,
    maxInterval: number = 6
  ): ProceduralAnimation {
    return {
      name: 'auto_blink',
      layer: 'emotion',
      priority: 10,
      loop: true,
      duration: Infinity,
      update: (vrm: VRM, _time: number, deltaTime: number) => {
        const expressionManager = vrm.expressionManager;
        if (!expressionManager) return;

        this.blinkTimer += deltaTime;

        if (this.blinkTimer >= this.nextBlinkTime) {
          const blinkDuration = 0.15;
          const blinkProgress = (this.blinkTimer - this.nextBlinkTime) / blinkDuration;

          if (blinkProgress < 1) {
            const blinkWeight = Math.sin(blinkProgress * Math.PI);
            expressionManager.setValue('blink', blinkWeight);
          } else {
            expressionManager.setValue('blink', 0);
            this.nextBlinkTime = this.blinkTimer + minInterval + Math.random() * (maxInterval - minInterval);
          }
        }
      },
      onStart: () => {
        this.blinkTimer = 0;
        this.nextBlinkTime = 2 + Math.random() * 4;
      }
    };
  }

  static createGazeSystem(
    minInterval: number = 3,
    maxInterval: number = 8
  ): ProceduralAnimation {
    return {
      name: 'auto_gaze',
      layer: 'gesture',
      priority: 5,
      loop: true,
      duration: Infinity,
      update: (vrm: VRM, _time: number, deltaTime: number) => {
        const humanoid = vrm.humanoid;
        const expressionManager = vrm.expressionManager;
        if (!humanoid || !expressionManager) return;

        this.gazeTimer += deltaTime;

        if (this.gazeTimer >= this.nextGazeTime) {
          const gazeX = (Math.random() - 0.5) * 3;
          const gazeY = 1.3 + (Math.random() - 0.5) * 0.5;
          const gazeZ = 3 + Math.random() * 2;
          this.currentGazeTarget.set(gazeX, gazeY, gazeZ);
          this.nextGazeTime = this.gazeTimer + minInterval + Math.random() * (maxInterval - minInterval);
        }

        const head = humanoid.getNormalizedBoneNode('head');
        if (head) {
          const headPos = new THREE.Vector3();
          head.getWorldPosition(headPos);

          const lookDir = this.currentGazeTarget.clone().sub(headPos).normalize();
          const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            lookDir
          );

          head.quaternion.slerp(targetQuaternion, deltaTime * 2);
        }

        const horizontalGaze = Math.atan2(this.currentGazeTarget.x, this.currentGazeTarget.z);
        const maxLookAngle = Math.PI / 6;
        const clampedGaze = Math.max(-maxLookAngle, Math.min(maxLookAngle, horizontalGaze));
        const lookWeight = Math.abs(clampedGaze) / maxLookAngle;

        if (clampedGaze > 0) {
          expressionManager.setValue('lookRight', lookWeight * 0.5);
          expressionManager.setValue('lookLeft', 0);
        } else {
          expressionManager.setValue('lookLeft', lookWeight * 0.5);
          expressionManager.setValue('lookRight', 0);
        }
      },
      onStart: () => {
        this.gazeTimer = 0;
        this.nextGazeTime = 3 + Math.random() * 5;
      }
    };
  }

  static createLookAt(target: THREE.Vector3, smooth: boolean = true): ProceduralAnimation {
    let startTime = 0;
    const transitionDuration = 0.5;

    return {
      name: 'look_at_target',
      layer: 'gesture',
      priority: 15,
      loop: false,
      duration: 2.0,
      update: (vrm: VRM, time: number, deltaTime: number) => {
        const humanoid = vrm.humanoid;
        if (!humanoid) return;

        const elapsed = time - startTime;
        const alpha = smooth ? Math.min(elapsed / transitionDuration, 1) : 1;

        const head = humanoid.getNormalizedBoneNode('head');
        const neck = humanoid.getNormalizedBoneNode('neck');

        if (head) {
          const headPos = new THREE.Vector3();
          head.getWorldPosition(headPos);

          const lookDir = target.clone().sub(headPos).normalize();
          const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            lookDir
          );

          head.quaternion.slerp(targetQuaternion, alpha * deltaTime * 5);
        }

        if (neck) {
          const neckPos = new THREE.Vector3();
          neck.getWorldPosition(neckPos);

          const lookDir = target.clone().sub(neckPos).normalize();
          const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            lookDir
          );

          neck.quaternion.slerp(targetQuaternion, alpha * deltaTime * 3);
        }
      },
      onStart: (_vrm: VRM) => {
        startTime = performance.now() / 1000;
      }
    };
  }

  static createMicroMovements(): ProceduralAnimation {
    return {
      name: 'micro_movements',
      layer: 'base',
      priority: 1,
      loop: true,
      duration: Infinity,
      update: (vrm: VRM, time: number, _deltaTime: number) => {
        const humanoid = vrm.humanoid;
        if (!humanoid) return;

        const noise = (t: number, seed: number) => {
          return Math.sin(t * seed) * 0.5 + Math.sin(t * seed * 1.3) * 0.3 + Math.sin(t * seed * 0.7) * 0.2;
        };

        const leftShoulder = humanoid.getNormalizedBoneNode('leftShoulder');
        if (leftShoulder) {
          leftShoulder.rotation.z = noise(time, 0.4) * 0.01;
        }

        const rightShoulder = humanoid.getNormalizedBoneNode('rightShoulder');
        if (rightShoulder) {
          rightShoulder.rotation.z = noise(time, 0.5) * 0.01;
        }

        const leftHand = humanoid.getNormalizedBoneNode('leftHand');
        if (leftHand) {
          leftHand.rotation.x = noise(time, 0.6) * 0.02;
        }

        const rightHand = humanoid.getNormalizedBoneNode('rightHand');
        if (rightHand) {
          rightHand.rotation.x = noise(time, 0.7) * 0.02;
        }
      }
    };
  }

  static createHandPose(
    handedness: 'left' | 'right',
    openness: number = 0.5
  ): ProceduralAnimation {
    return {
      name: `hand_pose_${handedness}`,
      layer: 'gesture',
      priority: 8,
      loop: false,
      duration: 0.5,
      update: (vrm: VRM, _time: number, deltaTime: number) => {
        const humanoid = vrm.humanoid;
        if (!humanoid) return;

        const fingerBones = handedness === 'left' 
          ? ['leftThumbProximal', 'leftIndexProximal', 'leftMiddleProximal', 'leftRingProximal', 'leftLittleProximal']
          : ['rightThumbProximal', 'rightIndexProximal', 'rightMiddleProximal', 'rightRingProximal', 'rightLittleProximal'];

        const closedRotation = -Math.PI / 3;
        const targetRotation = closedRotation * (1 - openness);

        fingerBones.forEach(boneName => {
          const bone = humanoid.getNormalizedBoneNode(boneName as any);
          if (bone) {
            bone.rotation.z = THREE.MathUtils.lerp(bone.rotation.z, targetRotation, deltaTime * 10);
          }
        });
      }
    };
  }

  static easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  static easeOutElastic(t: number): number {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }

  static easeOutBounce(t: number): number {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  }
}
