import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { AvatarController } from './AvatarController';
import { Emotion, ActionType, ViewMode, AnimationCommand } from '../types/animation';

interface Props {
  onLoad?: () => void;
}

function Avatar({ onLoad }: Props) {
  const vrmRef = useRef<VRM | null>(null);
  const controllerRef = useRef<AvatarController | null>(null);
  const [isReady, setIsReady] = useState(false);
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
        
        // Initialize the new procedural animation controller
        console.log('🎬 Initializing procedural animation controller...');
        
        const controls = (window as any).orbitControlsRef;
        const controller = new AvatarController(vrm, camera, controls);
        controllerRef.current = controller;
        
        console.log('✅ Procedural animation system ready!');
        
        // Trigger API exposure and onLoad callback
        setIsReady(true);
        if (onLoad) onLoad();
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

  // Update animation controller in render loop
  useFrame((_, delta) => {
    if (vrmRef.current) {
      // CRITICAL: Keep frustum culling disabled (fix for disappearing avatar)
      vrmRef.current.scene.traverse((obj) => {
        if (obj.frustumCulled) {
          obj.frustumCulled = false;
        }
      });
    }
    
    if (controllerRef.current) {
      controllerRef.current.update(delta);
    }
  });

  // Expose global API with proper lifecycle management
  useEffect(() => {
    if (!isReady || !controllerRef.current || !vrmRef.current) {
      return;
    }

    console.log('🎮 Exposing Avatar API to window.avatarAPI');

    (window as any).avatarAPI = {
      executeCommand: (command: AnimationCommand) => {
        if (!controllerRef.current) {
          console.warn('⚠️ Avatar controller not ready');
          return;
        }
        controllerRef.current.executeAnimationCommand(command);
      },
      playAction: (action: ActionType) => {
        if (!controllerRef.current) {
          console.warn('⚠️ Avatar controller not ready');
          return;
        }
        controllerRef.current.playAction(action);
      },
      setEmotion: (emotion: Emotion, intensity?: number) => {
        if (!controllerRef.current) {
          console.warn('⚠️ Avatar controller not ready');
          return;
        }
        controllerRef.current.setEmotion(emotion, intensity);
      },
      setViewMode: (mode: ViewMode) => {
        if (!controllerRef.current) {
          console.warn('⚠️ Avatar controller not ready');
          return;
        }
        controllerRef.current.setViewMode(mode);
      },
      lookAtCamera: () => {
        if (!controllerRef.current) {
          console.warn('⚠️ Avatar controller not ready');
          return;
        }
        controllerRef.current.lookAtCamera();
      },
      reset: () => {
        if (!controllerRef.current) {
          console.warn('⚠️ Avatar controller not ready');
          return;
        }
        controllerRef.current.reset();
      },
      getStatus: () => {
        if (!controllerRef.current) {
          return {};
        }
        return controllerRef.current.getStatus();
      },
    };

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up Avatar API');
      delete (window as any).avatarAPI;
    };
  }, [isReady]);

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
      
      <Avatar onLoad={onLoad} />
      
      <OrbitControls
        ref={(ref) => {
          if (ref) (window as any).orbitControlsRef = ref;
        }}
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
