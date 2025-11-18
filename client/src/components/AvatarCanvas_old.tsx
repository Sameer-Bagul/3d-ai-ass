import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRM, VRMLoaderPlugin } from '@pixiv/three-vrm';
import * as THREE from 'three';

interface Props {
  onLoad?: () => void;
}

function Avatar({ onLoad }: Props) {
  const vrmRef = useRef<VRM | null>(null);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    console.log('Loading avatar...');
    
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    loader.load(
      '/avatar.vrm',
      (gltf) => {
        const vrm = gltf.userData.vrm as VRM;
        
        vrm.scene.traverse((obj) => {
          obj.frustumCulled = false;
        });
        
        // Set initial pose - VRM T-pose
        vrm.humanoid?.resetNormalizedPose();
        
        // Add bounding box helper for debugging
        const box = new THREE.Box3().setFromObject(vrm.scene);
        const size = new THREE.Vector3();
        box.getSize(size);
        console.log('Avatar bounding box size:', size);
        
        vrmRef.current = vrm;
        console.log('✅ Avatar loaded in idle pose!');
        console.log('Avatar position:', vrm.scene.position);
        console.log('Avatar has humanoid bones:', !!vrm.humanoid);
        
        if (onLoad) onLoad();
      },
      (progress) => {
        const percent = ((progress.loaded / progress.total) * 100).toFixed(0);
        console.log(`Loading: ${percent}%`);
      },
      (error) => {
        console.error('❌ Failed:', error);
      }
    );
  }, [onLoad]);

  // Simple idle animation using VRM humanoid bones
  useFrame((_, delta) => {
    if (vrmRef.current) {
      vrmRef.current.update(delta);
      
      // Create subtle breathing/idle motion
      timeRef.current += delta;
      const t = timeRef.current;
      
      const humanoid = vrmRef.current.humanoid;
      
      // Gentle breathing motion (chest)
      const spine = humanoid.getNormalizedBoneNode('spine');
      if (spine) {
        const breathAmount = Math.sin(t * 1.5) * 0.02;
        spine.rotation.x = breathAmount;
      }
      
      // Subtle head movement
      const head = humanoid.getNormalizedBoneNode('head');
      if (head) {
        const headSway = Math.sin(t * 0.8) * 0.03;
        head.rotation.y = headSway;
      }
    }
  });

  return vrmRef.current ? <primitive object={vrmRef.current.scene} /> : null;
}

export default function AvatarCanvas({ onLoad }: Props) {
  return (
    <Canvas
      camera={{ position: [0, 0.8, 3.5], fov: 35 }}
      style={{ width: '100%', height: '100%' }}
      shadows
    >
      {/* Better gradient background */}
      <color attach="background" args={['#0f0f1e']} />
      <fog attach="fog" args={['#0f0f1e', 5, 15]} />
      
      {/* Lighting setup */}
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={1.2} 
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-3, 3, -3]} intensity={0.5} />
      <hemisphereLight args={['#ffffff', '#444444', 0.6]} />
      
      {/* Grid floor */}
      <gridHelper 
        args={[20, 20, '#4a5568', '#2d3748']} 
        position={[0, 0, 0]} 
      />
      
      {/* Circular platform under avatar */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[1.2, 32]} />
        <meshStandardMaterial 
          color="#1e293b" 
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>
      
      <Avatar onLoad={onLoad} />
      
      <OrbitControls 
        enableZoom={true}
        enableRotate={true}
        enablePan={false}
        minDistance={1.5}
        maxDistance={8}
        target={[0, 0.8, 0]}
        maxPolarAngle={Math.PI / 2}
      />
    </Canvas>
  );
}
