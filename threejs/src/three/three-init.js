import * as THREE from 'three';
import {
  createScene,
  createCamera,
  createRenderer,
  createControls,
  createLabelRenderer,
} from './three-config.js';
import { RoomEnvironment } from 'three/examples/jsm/Addons.js';
import { outline } from './three-outline.js';

export function threeInit () {

  const scene = createScene();
  const camera = createCamera();
  const renderer = createRenderer();
  const controls = createControls(camera, renderer);
  const composer = outline(renderer, scene, camera);

  // CSS2DRenderer
  const labelRenderer = createLabelRenderer();

  // Environment
  const environment = new RoomEnvironment();
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envMap = pmremGenerator.fromScene(environment).texture;

  scene.environment = envMap;

  return {scene, camera, renderer, controls, labelRenderer, composer}
}