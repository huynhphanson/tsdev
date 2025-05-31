import * as THREE from 'three'
import { 
  EffectComposer,
  FXAAShader,
  OutlinePass,
  OutputPass,
  RenderPass,
  ShaderPass
 } from "three/examples/jsm/Addons.js";

// Outline
export let composer, effectFXAA, outlinePass;

export function outline(renderer, scene, camera) {
  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  outlinePass = new OutlinePass (new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
  outlinePass.edgeStrength = 3;
  outlinePass.edgeGlow = 0;
  outlinePass.edgeThickness = 1.0;
  outlinePass.visibleEdgeColor.set('#ffaa00'); // trắng
  outlinePass.hiddenEdgeColor.set('#ff9900');  // xuyên thấu màu cam
  outlinePass.pulsePeriod = 0;
  outlinePass.usePatternTexture = false;

  composer.addPass(outlinePass);
  
  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  effectFXAA = new ShaderPass(FXAAShader);
  effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
  composer.addPass(effectFXAA);

  return composer
}

