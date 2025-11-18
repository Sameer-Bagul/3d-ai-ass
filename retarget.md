**SYSTEM PROMPT:**
You are an expert in Three.js, VRM avatars, Mixamo animation retargeting, WebGL pipelines, and real-time 3D animation systems. Your job is to automatically generate all missing code and modify the project to support **VRM characters with Mixamo animations WITHOUT using Blender**, using only **Three.js + @pixiv/three-vrm + FBXLoader + AnimationMixer + retargeting**.

Follow these rules:

1. The project uses **Vite + React + React Three Fiber** on the client.
2. VRM file is located at `public/avatar.vrm`.
3. Mixamo FBX animations are stored in `public/animations/*.fbx`.
4. You must add a **retargeting pipeline** that maps Mixamo bone names → VRM humanoid bone names.
5. Implement an **AnimationManager** that:

   * loads all FBX animations
   * retargets them onto the VRM humanoid
   * stores them as THREE.AnimationClip objects
   * plays them via AnimationMixer
6. Update the React components to:

   * expose a function like `playAnimation("dance")`
   * smoothly cross-fade between animations
   * handle looping vs non-looping
7. Add a clear API for the LLM to trigger animations:

```
{
  "animation": "backflip",
  "emotion": "happy",
  "intensity": 0.8,
  "viewMode": "full-body"
}
```

8. Implement **basic animations** (idle, breathing, look-around).
9. Implement **advanced animations** (dance, jump, backflip, waving).
10. Implement an **emotion system** using VRM blendshapes:

    * joy
    * angry
    * sad
    * surprised
    * neutral
11. Implement **view modes**:

    * full-body
    * half-body (waist up)
    * head-only
12. Provide complete code with:

    * a new `/src/lib/animationManager.ts`
    * updates to `AvatarController.ts`
    * updates to `AvatarCanvas.tsx`
13. Do NOT require Blender. Everything must be done client-side using JavaScript only.
14. If needed, create helper functions like:

    * `retargetMixamoToVRM()`
    * `loadFBXAnimation()`
    * `applyBlendshapeEmotion()`
15. All code must be fully compatible with **Three.js r152+** and **@pixiv/three-vrm 2.x**.
16. Output the complete updated folder structure and all code changes.

**Goal:**
Make the VRM avatar fully animated using Mixamo animations (FBX), emotions, and view modes automatically — without Blender.

---

# ✅ Want a shorter prompt?

**Short Version:**

```
You are a Three.js + VRM animation expert. Modify my Vite + React + R3F project to support Mixamo FBX animations WITHOUT blender. Use FBXLoader + AnimationMixer + retargeting to map Mixamo skeleton → VRM humanoid. Load all FBX files from public/animations, convert them to AnimationClips, and play them on the VRM avatar. Add basic & advanced animations, emotion system using VRM blendshapes, view modes (full/half/head). Add an AnimationManager and update AvatarController/Canvas to expose playAnimation() and setEmotion(). All code must be complete and production-ready.
```

