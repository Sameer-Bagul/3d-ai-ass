import { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { AnimationManager } from '../lib/AnimationManager';
import { EmotionSystem, Emotion } from '../lib/emotionSystem';
import { ViewModeSystem, ViewMode } from '../lib/viewModeSystem';

interface Props {
  onLoad?: () => void;
}

function Avatar({ onLoad }: Props) {
  const vrmRef = useRef<VRM | null>(null);
  const animManagerRef = useRef<AnimationManager | null>(null);
  const emotionSystemRef = useRef<EmotionSystem | null>(null);
  const viewModeSystemRef = useRef<ViewModeSystem | null>(null);
  const { camera } = useThree();

  useEffect(() => {
    console.log('🎭 Loading avatar...');
    
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    loader.load(
      '/avatar.vrm',
      async (gltf) => {
        const vrm = gltf.userData.vrm as VRM;
        
        // Use VRMUtils to optimize the model
        VRMUtils.removeUnnecessaryVertices(gltf.scene);
        VRMUtils.removeUnnecessaryJoints(gltf.scene);
        
        // CRITICAL: Disable frustum culling on ALL objects
        vrm.scene.traverse((obj) => {
          obj.frustumCulled = false;
        });
        
        vrm.humanoid?.resetNormalizedPose();
        
        // Ensure avatar is at origin and visible
        vrm.scene.position.set(0, 0, 0);
        vrm.scene.rotation.set(0, 0, 0);
        vrm.scene.scale.set(1, 1, 1);
        vrm.scene.visible = true;
        
        // Add to scene immediately - RENDER FIRST
        vrmRef.current = vrm;
        
        console.log('✅ Avatar loaded!');
        
        if (onLoad) onLoad();
        
        // Initialize animation systems immediately (but don't auto-play)
        console.log('🎬 Initializing animation systems...');
        
        const animManager = new AnimationManager(vrm);
        const emotionSystem = new EmotionSystem(vrm);
        const viewModeSystem = new ViewModeSystem(camera);
        
        animManagerRef.current = animManager;
        emotionSystemRef.current = emotionSystem;
        viewModeSystemRef.current = viewModeSystem;
        
        // Start auto-blinking
        emotionSystem.startAutoBlinking();
        emotionSystem.setEmotion('neutral');
        
        console.log('✅ Animation system ready (use control panel to load animations)');
      },
      (progress) => {
        const percent = ((progress.loaded / progress.total) * 100).toFixed(0);
        console.log(`Loading: ${percent}%`);
      },
      (error) => {
        console.error('❌ Failed to load avatar:', error);
      }
    );
  }, [onLoad, camera]);

  // Update all systems in render loop
  useFrame((_, delta) => {
    if (vrmRef.current) {
      vrmRef.current.update(delta);
      
      // CRITICAL: Keep frustum culling disabled (fix for disappearing avatar)
      vrmRef.current.scene.traverse((obj) => {
        if (obj.frustumCulled) {
          obj.frustumCulled = false;
        }
      });
    }
    
    if (animManagerRef.current) {
      animManagerRef.current.update(delta);
    }
    
    if (emotionSystemRef.current) {
      emotionSystemRef.current.update(delta);
    }
  });

  // Expose global API for external control
  useEffect(() => {
    if (!animManagerRef.current || !emotionSystemRef.current || !viewModeSystemRef.current) {
      return;
    }

    (window as any).avatarAPI = {
      // Animation control
      playAnimation: (name: string, options?: { loop?: boolean; crossFadeDuration?: number; timeScale?: number }) => {
        return animManagerRef.current?.playAnimation(name, options);
      },
      loadAnimation: (name: string) => {
        return animManagerRef.current?.loadAnimation(name);
      },
      loadAllAnimations: (onProgress?: (loaded: number, total: number) => void) => {
        return animManagerRef.current?.loadAllAnimations(onProgress);
      },
      stopAnimation: (fadeDuration?: number) => {
        animManagerRef.current?.stop(fadeDuration);
      },
      
      // Emotion control
      setEmotion: (emotion: Emotion, intensity: number = 1.0) => {
        emotionSystemRef.current?.setEmotion(emotion, intensity);
      },
      setBlendShape: (name: string, value: number) => {
        emotionSystemRef.current?.setBlendShape(name as any, value);
      },
      blink: () => {
        emotionSystemRef.current?.blink();
      },
      
      // View mode control
      setViewMode: (mode: ViewMode, animate: boolean = true) => {
        viewModeSystemRef.current?.setViewMode(mode, animate);
      },
      cycleViewMode: () => {
        return viewModeSystemRef.current?.cycleMode();
      },
      
      // Status
      getStatus: () => ({
        currentAnimation: animManagerRef.current?.getCurrentAnimation(),
        currentEmotion: emotionSystemRef.current?.getCurrentEmotion(),
        currentViewMode: viewModeSystemRef.current?.getCurrentMode(),
        loadedAnimations: animManagerRef.current?.getLoadedAnimations() || [],
        availableAnimations: animManagerRef.current?.getAvailableAnimations() || [],
      }),
    };

    console.log('🎮 Avatar API exposed to window.avatarAPI');
    console.log('Example usage:');
    console.log('  avatarAPI.playAnimation("waving")');
    console.log('  avatarAPI.setEmotion("joy", 0.8)');
    console.log('  avatarAPI.setViewMode("head-only")');
    console.log('  avatarAPI.getStatus()');
  }, []);

  return vrmRef.current ? <primitive object={vrmRef.current.scene} /> : null;
}

export default function AvatarCanvas({ onLoad }: Props) {
  return (
    <Canvas
      camera={{ position: [0, 1, 3], fov: 50, near: 0.1, far: 1000 }}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Simple neutral background */}
      <color attach="background" args={['#2a2a3e']} />
      
      {/* Neutral white lighting - no color changes */}
      <ambientLight intensity={0.8} color="#ffffff" />
      <directionalLight position={[5, 5, 5]} intensity={0.5} color="#ffffff" />
      <directionalLight position={[-5, 5, -5]} intensity={0.3} color="#ffffff" />
      
      {/* Grid floor */}
      <gridHelper 
        args={[20, 20, '#4a5568', '#2d3748']} 
        position={[0, 0, 0]} 
      />
      
      {/* Platform under avatar */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[1.2, 32]} />
        <meshStandardMaterial 
          color="#1e293b" 
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>
      
      {/* Debug cube to verify rendering */}
      <mesh position={[2, 1, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="red" />
      </mesh>
      
      <Avatar onLoad={onLoad} />
      
      <OrbitControls 
        enableZoom={true}
        enableRotate={true}
        enablePan={true}
        minDistance={0.5}
        maxDistance={10}
        target={[0, 1, 0]}
      />
    </Canvas>
  );
}
