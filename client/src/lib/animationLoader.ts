import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { VRM } from '@pixiv/three-vrm';

export interface LoadedAnimation {
  name: string;
  clip: THREE.AnimationClip;
  action?: THREE.AnimationAction;
}

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

export class AnimationLoader {
  private mixer: THREE.AnimationMixer | null = null;
  private animations: Map<string, LoadedAnimation> = new Map();
  private vrm: VRM | null = null;
  private currentAction: THREE.AnimationAction | null = null;
  private idleAction: THREE.AnimationAction | null = null;
  private loader: FBXLoader;
  private loadingPromises: Map<string, Promise<LoadedAnimation>> = new Map();

  constructor() {
    this.loader = new FBXLoader();
  }

  initialize(vrm: VRM): void {
    this.vrm = vrm;
    this.mixer = new THREE.AnimationMixer(vrm.scene);
    console.log('🎬 AnimationLoader initialized');
  }

  async loadAnimation(name: string): Promise<LoadedAnimation | null> {
    if (!this.vrm || !this.mixer) {
      console.error('AnimationLoader not initialized');
      return null;
    }

    if (this.animations.has(name)) {
      return this.animations.get(name)!;
    }

    if (this.loadingPromises.has(name)) {
      return this.loadingPromises.get(name)!;
    }

    const loadPromise = new Promise<LoadedAnimation>((resolve, reject) => {
      const path = `/animations/${name}.fbx`;
      
      this.loader.load(
        path,
        (fbx) => {
          if (fbx.animations && fbx.animations.length > 0) {
            let clip = fbx.animations[0];
            clip.name = name;

            const retargetedClip = this.retargetAnimationToVRM(clip);
            
            const action = this.mixer!.clipAction(retargetedClip);
            
            const loadedAnim: LoadedAnimation = {
              name,
              clip: retargetedClip,
              action
            };

            this.animations.set(name, loadedAnim);
            console.log(`✅ Loaded & retargeted animation: ${name}`);
            
            resolve(loadedAnim);
          } else {
            reject(new Error(`No animations found in ${name}.fbx`));
          }
        },
        undefined,
        (error) => {
          console.error(`❌ Error loading animation ${name}:`, error);
          reject(error);
        }
      );
    });

    this.loadingPromises.set(name, loadPromise);
    
    try {
      const result = await loadPromise;
      this.loadingPromises.delete(name);
      return result;
    } catch (error) {
      this.loadingPromises.delete(name);
      return null;
    }
  }

  private retargetAnimationToVRM(clip: THREE.AnimationClip): THREE.AnimationClip {
    if (!this.vrm) return clip;

    const mixamoToVRM: Record<string, string> = {
      'mixamorigHips': 'hips',
      'mixamorigSpine': 'spine',
      'mixamorigSpine1': 'chest',
      'mixamorigSpine2': 'upperChest',
      'mixamorigNeck': 'neck',
      'mixamorigHead': 'head',
      'mixamorigLeftShoulder': 'leftShoulder',
      'mixamorigLeftArm': 'leftUpperArm',
      'mixamorigLeftForeArm': 'leftLowerArm',
      'mixamorigLeftHand': 'leftHand',
      'mixamorigRightShoulder': 'rightShoulder',
      'mixamorigRightArm': 'rightUpperArm',
      'mixamorigRightForeArm': 'rightLowerArm',
      'mixamorigRightHand': 'rightHand',
      'mixamorigLeftUpLeg': 'leftUpperLeg',
      'mixamorigLeftLeg': 'leftLowerLeg',
      'mixamorigLeftFoot': 'leftFoot',
      'mixamorigLeftToeBase': 'leftToes',
      'mixamorigRightUpLeg': 'rightUpperLeg',
      'mixamorigRightLeg': 'rightLowerLeg',
      'mixamorigRightFoot': 'rightFoot',
      'mixamorigRightToeBase': 'rightToes'
    };

    const retargetedTracks: THREE.KeyframeTrack[] = [];

    for (const track of clip.tracks) {
      const trackPath = track.name.split('.');
      const boneName = trackPath[0];
      const property = trackPath[1];

      const vrmBoneName = mixamoToVRM[boneName];
      
      if (vrmBoneName && this.vrm.humanoid) {
        const vrmBone = this.vrm.humanoid.getNormalizedBoneNode(vrmBoneName as any);
        
        if (vrmBone) {
          const newTrackName = `${vrmBone.name}.${property}`;
          
          const TrackConstructor = track.constructor as any;
          const newTrack = new TrackConstructor(
            newTrackName,
            track.times,
            track.values,
            track.getInterpolation()
          );
          
          retargetedTracks.push(newTrack);
        }
      }
    }

    if (retargetedTracks.length === 0) {
      console.warn(`⚠️ No tracks were retargeted for ${clip.name}, using original clip`);
      return clip;
    }

    const retargetedClip = new THREE.AnimationClip(
      clip.name,
      clip.duration,
      retargetedTracks
    );

    console.log(`🎯 Retargeted ${retargetedTracks.length} tracks for ${clip.name}`);
    return retargetedClip;
  }

  async loadBasicAnimations(): Promise<void> {
    const basicAnims = ['idle', 'happy_idle', 'breathing_idle'];
    
    await Promise.all(
      basicAnims.map(name => this.loadAnimation(name))
    );

    const idleAnim = this.animations.get('idle');
    if (idleAnim && idleAnim.action) {
      this.idleAction = idleAnim.action;
      this.idleAction.play();
      console.log('🎭 Idle animation started');
    }
  }

  async playAnimation(
    name: string,
    options: {
      fadeIn?: number;
      fadeOut?: number;
      loop?: boolean;
      clampWhenFinished?: boolean;
      interrupt?: boolean;
    } = {}
  ): Promise<void> {
    console.log(`🎬 playAnimation called: ${name}`);
    
    if (!this.mixer) {
      console.error('❌ Animation mixer not initialized');
      return;
    }

    const {
      fadeIn = 0.3,
      fadeOut = 0.3,
      loop = false,
      clampWhenFinished = true,
      interrupt = true
    } = options;

    let animation = this.animations.get(name);
    
    if (!animation) {
      console.log(`📥 Loading animation: ${name}`);
      const loaded = await this.loadAnimation(name);
      animation = loaded || undefined;
    }

    if (!animation || !animation.action) {
      console.warn(`❌ Animation "${name}" not found or failed to load`);
      return;
    }

    if (interrupt && this.currentAction && this.currentAction !== this.idleAction) {
      console.log(`⏸️ Interrupting current animation`);
      this.currentAction.fadeOut(fadeOut);
    }

    const action = animation.action;
    action.reset();
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    action.clampWhenFinished = clampWhenFinished;
    action.fadeIn(fadeIn);
    action.play();

    this.currentAction = action;
    
    console.log(`▶️ Playing animation: ${name} (duration: ${action.getClip().duration.toFixed(2)}s, loop: ${loop})`);

    if (!loop) {
      const duration = action.getClip().duration;
      setTimeout(() => {
        console.log(`🔄 Animation ${name} completed, returning to idle`);
        this.returnToIdle(fadeOut);
      }, duration * 1000);
    }
  }

  returnToIdle(fadeTime: number = 0.5): void {
    if (!this.idleAction || !this.mixer) return;

    if (this.currentAction && this.currentAction !== this.idleAction) {
      this.currentAction.fadeOut(fadeTime);
    }

    if (!this.idleAction.isRunning()) {
      this.idleAction.reset();
      this.idleAction.fadeIn(fadeTime);
      this.idleAction.play();
    }

    this.currentAction = this.idleAction;
  }

  stopCurrentAnimation(fadeTime: number = 0.3): void {
    if (this.currentAction && this.currentAction !== this.idleAction) {
      this.currentAction.fadeOut(fadeTime);
      this.returnToIdle(fadeTime);
    }
  }

  update(deltaTime: number): void {
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
  }

  getAvailableAnimations(): string[] {
    return AVAILABLE_ANIMATIONS;
  }

  isAnimationLoaded(name: string): boolean {
    return this.animations.has(name);
  }

  getCurrentAnimation(): string | null {
    if (!this.currentAction) return null;
    return this.currentAction.getClip().name;
  }
}

export default AnimationLoader;
