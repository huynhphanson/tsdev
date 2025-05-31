import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/Addons.js';


export function createScene () {
  const scene = new THREE.Scene();
  const ambientLight = new THREE.AmbientLight(0xffffff);
  scene.add(ambientLight);
  return scene
}

export function createCamera () {
  const fov = 75;
  const aspect = window.innerWidth / window.innerHeight;
  const near = 0.01;
  const far = 200000;

  const camera = new THREE.PerspectiveCamera( fov, aspect, near, far );

  camera.up = new THREE.Vector3(0, 1, 0);
  return camera
}

let renderer = null; // Biến toàn cục
export function createRenderer () {
  if (renderer) {
    renderer.dispose();
    renderer.forceContextLoss();
    renderer = null;
  }
  renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.physicallyCorrectLights = false; 

  return renderer;
}


export function createControls (camera, renderer) {
  const controls = new OrbitControls (camera, renderer.domElement)
  controls.target = new THREE.Vector3(6378137, 0, 0);
  // Limit the camera's vertical rotation to prevent gimbal lock
  controls.maxPolarAngle = Math.PI;
  controls.minPolarAngle = Math.PI * 0.15;
  controls.update();
  return controls
}

let labelRenderer = null;
export function createLabelRenderer() {
  if (labelRenderer) {
    labelRenderer.domElement.remove(); // Xóa khỏi DOM
    labelRenderer = null;
  }
  labelRenderer = new CSS2DRenderer()
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0px';
  labelRenderer.domElement.style.pointerEvents = 'none';
  return labelRenderer
}
