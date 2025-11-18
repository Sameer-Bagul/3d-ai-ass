import * as THREE from 'three';

export type ViewMode = 'full-body' | 'half-body' | 'head-only';

export interface CameraConfig {
  position: THREE.Vector3;
  fov: number;
  minDistance: number;
  maxDistance: number;
}

/**
 * Camera configurations for each view mode
 */
const VIEW_MODE_CONFIGS: Record<ViewMode, CameraConfig> = {
  'full-body': {
    position: new THREE.Vector3(0, 0.8, 3.5),
    fov: 35,
    minDistance: 1.5,
    maxDistance: 8,
  },
  'half-body': {
    position: new THREE.Vector3(0, 1.0, 2.0),
    fov: 30,
    minDistance: 1.0,
    maxDistance: 4,
  },
  'head-only': {
    position: new THREE.Vector3(0, 1.4, 1.2),
    fov: 25,
    minDistance: 0.5,
    maxDistance: 2,
  },
};

export class ViewModeSystem {
  private currentMode: ViewMode = 'full-body';
  private camera: THREE.Camera;
  private controls: any; // OrbitControls type

  constructor(camera: THREE.Camera, controls?: any) {
    this.camera = camera;
    this.controls = controls;
  }

  /**
   * Set the view mode
   */
  setViewMode(mode: ViewMode, animate: boolean = true): void {
    const config = VIEW_MODE_CONFIGS[mode];
    
    if (animate) {
      this.animateTransition(config);
    } else {
      this.applyConfig(config);
    }

    this.currentMode = mode;
    console.log(`📷 View mode: ${mode}`);
  }

  /**
   * Apply camera configuration
   */
  private applyConfig(config: CameraConfig): void {
    // Update camera position
    this.camera.position.copy(config.position);

    // Update FOV (if perspective camera)
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.fov = config.fov;
      this.camera.updateProjectionMatrix();
    }

    // Update controls distance limits
    if (this.controls) {
      this.controls.minDistance = config.minDistance;
      this.controls.maxDistance = config.maxDistance;
      this.controls.update();
    }
  }

  /**
   * Smoothly animate camera transition
   */
  private animateTransition(config: CameraConfig): void {
    const startPos = this.camera.position.clone();
    const endPos = config.position;
    const startFov = (this.camera as THREE.PerspectiveCamera).fov;
    const endFov = config.fov;
    const duration = 1000; // ms
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-in-out)
      const eased = t < 0.5
        ? 2 * t * t
        : -1 + (4 - 2 * t) * t;

      // Lerp position
      this.camera.position.lerpVectors(startPos, endPos, eased);

      // Lerp FOV
      if (this.camera instanceof THREE.PerspectiveCamera) {
        this.camera.fov = startFov + (endFov - startFov) * eased;
        this.camera.updateProjectionMatrix();
      }

      // Update controls
      if (this.controls) {
        this.controls.minDistance = config.minDistance;
        this.controls.maxDistance = config.maxDistance;
        this.controls.update();
      }

      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  /**
   * Get current view mode
   */
  getCurrentMode(): ViewMode {
    return this.currentMode;
  }

  /**
   * Cycle through view modes
   */
  cycleMode(): ViewMode {
    const modes: ViewMode[] = ['full-body', 'half-body', 'head-only'];
    const currentIndex = modes.indexOf(this.currentMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const nextMode = modes[nextIndex];
    
    this.setViewMode(nextMode);
    return nextMode;
  }
}
