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
            const clip = fbx.animations[0];
            clip.name = name;

            const action = this.mixer!.clipAction(clip);
            
            const loadedAnim: LoadedAnimation = {
              name,
              clip,
              action
            };

            this.animations.set(name, loadedAnim);
            console.log(`✅ Loaded animation: ${name}`);
            
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
    if (!this.mixer) return;

    const {
      fadeIn = 0.3,
      fadeOut = 0.3,
      loop = false,
      clampWhenFinished = true,
      interrupt = true
    } = options;

    let animation = this.animations.get(name);
    
    if (!animation) {
      const loaded = await this.loadAnimation(name);
      animation = loaded || undefined;
    }

    if (!animation || !animation.action) {
      console.warn(`Animation "${name}" not found`);
      return;
    }

    if (interrupt && this.currentAction && this.currentAction !== this.idleAction) {
      this.currentAction.fadeOut(fadeOut);
    }

    const action = animation.action;
    action.reset();
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    action.clampWhenFinished = clampWhenFinished;
    action.fadeIn(fadeIn);
    action.play();

    this.currentAction = action;

    if (!loop) {
      const duration = action.getClip().duration;
      setTimeout(() => {
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
