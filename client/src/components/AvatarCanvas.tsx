import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRM, VRMLoaderPlugin } from '@pixiv/three-vrm';
import AvatarController from './AvatarController';

interface AvatarCanvasProps {
  onAvatarReady?: (controller: AvatarController) => void;
  onDebugUpdate?: (info: any) => void;
}

function AvatarModel({ onReady }: { onReady?: (controller: AvatarController) => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const vrmRef = useRef<VRM | null>(null);
  const controllerRef = useRef<AvatarController | null>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    const vrmPath = '/avatar.vrm';
    
    console.log('🎭 Loading VRM model from:', vrmPath);

    loader.load(
      vrmPath,
      (gltf) => {
        const vrm = gltf.userData.vrm as VRM;
        
        if (vrm && groupRef.current) {
          console.log('✅ VRM loaded successfully');
          
          vrm.scene.traverse((obj) => {
            obj.frustumCulled = false;
          });
          
          groupRef.current.add(vrm.scene);
          vrmRef.current = vrm;
          
          const controller = new AvatarController(vrm);
          controllerRef.current = controller;
          
          if (onReady) {
            onReady(controller);
          }
        }
      },
      (progress) => {
        const percent = (progress.loaded / progress.total) * 100;
        console.log(`Loading: ${percent.toFixed(1)}%`);
      },
      (error) => {
        console.error('❌ Error loading VRM:', error);
      }
    );

    return () => {
      if (vrmRef.current) {
        vrmRef.current.scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry?.dispose();
            if (obj.material) {
              if (Array.isArray(obj.material)) {
                obj.material.forEach(mat => mat.dispose());
              } else {
                obj.material.dispose();
              }
            }
          }
        });
      }
    };
  }, [onReady]);

  useFrame((state, delta) => {
    if (controllerRef.current) {
      const clockTime = state.clock.elapsedTime;
      controllerRef.current.update(clockTime, delta);
    }
  });

  return <group ref={groupRef} />;
}

export default function AvatarCanvas({ onAvatarReady, onDebugUpdate }: AvatarCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 1.4, 2.5], fov: 30 }}
      gl={{ antialias: true }}
      shadows
    >
      <color attach="background" args={['#1a1a2e']} />
      
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[1, 2, 3]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-1, 1, -1]} intensity={0.5} color="#a78bfa" />
      
      <Suspense fallback={null}>
        <AvatarModel onReady={onAvatarReady} />
      </Suspense>
      
      <OrbitControls
        target={[0, 1.2, 0]}
        minDistance={1}
        maxDistance={5}
        maxPolarAngle={Math.PI / 1.5}
      />
      
      <gridHelper args={[10, 10, '#444', '#222']} position={[0, 0, 0]} />
    </Canvas>
  );
}
