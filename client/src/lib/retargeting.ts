/**
 * Mixamo to VRM Bone Retargeting
 * Maps Mixamo skeleton bone names to VRM humanoid bone names
 */

import * as THREE from 'three';
import { VRM, VRMHumanBoneName } from '@pixiv/three-vrm';

/**
 * Mixamo bone name to VRM humanoid bone name mapping
 */
export const MIXAMO_VRM_BONE_MAP: Record<string, VRMHumanBoneName> = {
  // Hips & Spine
  'mixamorigHips': 'hips',
  'mixamorigSpine': 'spine',
  'mixamorigSpine1': 'chest',
  'mixamorigSpine2': 'upperChest',
  'mixamorigNeck': 'neck',
  'mixamorigHead': 'head',
  
  // Left Leg
  'mixamorigLeftUpLeg': 'leftUpperLeg',
  'mixamorigLeftLeg': 'leftLowerLeg',
  'mixamorigLeftFoot': 'leftFoot',
  'mixamorigLeftToeBase': 'leftToes',
  
  // Right Leg
  'mixamorigRightUpLeg': 'rightUpperLeg',
  'mixamorigRightLeg': 'rightLowerLeg',
  'mixamorigRightFoot': 'rightFoot',
  'mixamorigRightToeBase': 'rightToes',
  
  // Left Arm
  'mixamorigLeftShoulder': 'leftShoulder',
  'mixamorigLeftArm': 'leftUpperArm',
  'mixamorigLeftForeArm': 'leftLowerArm',
  'mixamorigLeftHand': 'leftHand',
  
  // Right Arm
  'mixamorigRightShoulder': 'rightShoulder',
  'mixamorigRightArm': 'rightUpperArm',
  'mixamorigRightForeArm': 'rightLowerArm',
  'mixamorigRightHand': 'rightHand',
  
  // Left Hand Fingers
  'mixamorigLeftHandThumb1': 'leftThumbMetacarpal',
  'mixamorigLeftHandThumb2': 'leftThumbProximal',
  'mixamorigLeftHandThumb3': 'leftThumbDistal',
  'mixamorigLeftHandIndex1': 'leftIndexProximal',
  'mixamorigLeftHandIndex2': 'leftIndexIntermediate',
  'mixamorigLeftHandIndex3': 'leftIndexDistal',
  'mixamorigLeftHandMiddle1': 'leftMiddleProximal',
  'mixamorigLeftHandMiddle2': 'leftMiddleIntermediate',
  'mixamorigLeftHandMiddle3': 'leftMiddleDistal',
  'mixamorigLeftHandRing1': 'leftRingProximal',
  'mixamorigLeftHandRing2': 'leftRingIntermediate',
  'mixamorigLeftHandRing3': 'leftRingDistal',
  'mixamorigLeftHandPinky1': 'leftLittleProximal',
  'mixamorigLeftHandPinky2': 'leftLittleIntermediate',
  'mixamorigLeftHandPinky3': 'leftLittleDistal',
  
  // Right Hand Fingers
  'mixamorigRightHandThumb1': 'rightThumbMetacarpal',
  'mixamorigRightHandThumb2': 'rightThumbProximal',
  'mixamorigRightHandThumb3': 'rightThumbDistal',
  'mixamorigRightHandIndex1': 'rightIndexProximal',
  'mixamorigRightHandIndex2': 'rightIndexIntermediate',
  'mixamorigRightHandIndex3': 'rightIndexDistal',
  'mixamorigRightHandMiddle1': 'rightMiddleProximal',
  'mixamorigRightHandMiddle2': 'rightMiddleIntermediate',
  'mixamorigRightHandMiddle3': 'rightMiddleDistal',
  'mixamorigRightHandRing1': 'rightRingProximal',
  'mixamorigRightHandRing2': 'rightRingIntermediate',
  'mixamorigRightHandRing3': 'rightRingDistal',
  'mixamorigRightHandPinky1': 'rightLittleProximal',
  'mixamorigRightHandPinky2': 'rightLittleIntermediate',
  'mixamorigRightHandPinky3': 'rightLittleDistal',
};

/**
 * Retarget a Mixamo animation clip to work with VRM humanoid
 */
export function retargetMixamoToVRM(
  mixamoClip: THREE.AnimationClip,
  vrm: VRM
): THREE.AnimationClip {
  const retargetedTracks: THREE.KeyframeTrack[] = [];
  
  for (const track of mixamoClip.tracks) {
    // Extract bone name from track name (format: "boneName.property")
    const trackNameParts = track.name.split('.');
    const mixamoBoneName = trackNameParts[0];
    const property = trackNameParts[1];
    
    // Check if this bone should be retargeted
    const vrmBoneName = MIXAMO_VRM_BONE_MAP[mixamoBoneName];
    
    if (!vrmBoneName) {
      // Skip tracks that don't have a mapping
      continue;
    }
    
    // Get the VRM bone
    const vrmBone = vrm.humanoid.getNormalizedBoneNode(vrmBoneName);
    
    if (!vrmBone) {
      console.warn(`VRM bone not found: ${vrmBoneName}`);
      continue;
    }
    
    // Create new track name using VRM bone
    const newTrackName = `${vrmBone.name}.${property}`;
    
    // Clone the track with new name
    let newTrack: THREE.KeyframeTrack;
    
    if (track instanceof THREE.VectorKeyframeTrack) {
      newTrack = new THREE.VectorKeyframeTrack(
        newTrackName,
        track.times,
        track.values
      );
    } else if (track instanceof THREE.QuaternionKeyframeTrack) {
      newTrack = new THREE.QuaternionKeyframeTrack(
        newTrackName,
        track.times,
        track.values
      );
    } else if (track instanceof THREE.NumberKeyframeTrack) {
      newTrack = new THREE.NumberKeyframeTrack(
        newTrackName,
        track.times,
        track.values
      );
    } else {
      continue;
    }
    
    retargetedTracks.push(newTrack);
  }
  
  // Create new animation clip with retargeted tracks
  const retargetedClip = new THREE.AnimationClip(
    mixamoClip.name,
    mixamoClip.duration,
    retargetedTracks
  );
  
  return retargetedClip;
}

/**
 * Get VRM bone node by Mixamo bone name
 */
export function getVRMBoneFromMixamo(
  mixamoBoneName: string,
  vrm: VRM
): THREE.Object3D | null {
  const vrmBoneName = MIXAMO_VRM_BONE_MAP[mixamoBoneName];
  
  if (!vrmBoneName) {
    return null;
  }
  
  return vrm.humanoid.getNormalizedBoneNode(vrmBoneName);
}
