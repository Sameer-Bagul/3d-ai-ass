import * as THREE from 'three';
import { ViewMode, CameraConfig } from '../types/animation';

export const CAMERA_PRESETS: Record<ViewMode, CameraConfig> = {
  'full-body': {
    position: new THREE.Vector3(0, 0.8, 3.5),
    fov: 35,
    minDistance: 1.5,
    maxDistance: 8,
    lookAtOffset: new THREE.Vector3(0, 0.8, 0)
  },
  'half-body': {
    position: new THREE.Vector3(0, 1.2, 2.0),
    fov: 30,
    minDistance: 1.0,
    maxDistance: 4,
    lookAtOffset: new THREE.Vector3(0, 1.2, 0)
  },
  'head-only': {
    position: new THREE.Vector3(0, 1.5, 1.2),
    fov: 25,
    minDistance: 0.5,
    maxDistance: 2,
    lookAtOffset: new THREE.Vector3(0, 1.5, 0)
  },
  'cinematic': {
    position: new THREE.Vector3(2, 1.2, 3),
    fov: 40,
    minDistance: 2,
    maxDistance: 10,
    lookAtOffset: new THREE.Vector3(0, 1.0, 0)
  }
};

export class CameraController {
  private camera: THREE.Camera;
  private controls: any;
  private currentMode: ViewMode = 'full-body';

  constructor(camera: THREE.Camera, controls?: any) {
    this.camera = camera;
    this.controls = controls;
  }

  setViewMode(mode: ViewMode, animate: boolean = true): void {
    const config = CAMERA_PRESETS[mode];

    if (animate) {
      this.animateTransition(config);
    } else {
      this.applyConfig(config);
    }

    this.currentMode = mode;
    console.log(`📷 Camera view mode: ${mode}`);
  }

  private applyConfig(config: CameraConfig): void {
    this.camera.position.copy(config.position);

    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.fov = config.fov;
      this.camera.updateProjectionMatrix();
    }

    if (this.controls) {
      this.controls.minDistance = config.minDistance;
      this.controls.maxDistance = config.maxDistance;
      
      if (config.lookAtOffset) {
        this.controls.target.copy(config.lookAtOffset);
      }
      
      this.controls.update();
    }
  }

  private animateTransition(config: CameraConfig): void {
    const startPos = this.camera.position.clone();
    const endPos = config.position;
    const startFov = (this.camera as THREE.PerspectiveCamera).fov;
    const endFov = config.fov;
    const duration = 1000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);

      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      this.camera.position.lerpVectors(startPos, endPos, eased);

      if (this.camera instanceof THREE.PerspectiveCamera) {
        this.camera.fov = THREE.MathUtils.lerp(startFov, endFov, eased);
        this.camera.updateProjectionMatrix();
      }

      if (this.controls) {
        this.controls.minDistance = THREE.MathUtils.lerp(
          this.controls.minDistance,
          config.minDistance,
          eased
        );
        this.controls.maxDistance = THREE.MathUtils.lerp(
          this.controls.maxDistance,
          config.maxDistance,
          eased
        );
        
        if (config.lookAtOffset) {
          this.controls.target.lerp(config.lookAtOffset, eased);
        }
        
        this.controls.update();
      }

      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  getCurrentMode(): ViewMode {
    return this.currentMode;
  }

  cycleViewMode(): ViewMode {
    const modes: ViewMode[] = ['full-body', 'half-body', 'head-only', 'cinematic'];
    const currentIndex = modes.indexOf(this.currentMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const nextMode = modes[nextIndex];

    this.setViewMode(nextMode);
    return nextMode;
  }

  lookAt(target: THREE.Vector3): void {
    if (this.controls) {
      this.controls.target.copy(target);
      this.controls.update();
    } else {
      this.camera.lookAt(target);
    }
  }

  reset(): void {
    this.setViewMode('full-body', true);
  }
}
