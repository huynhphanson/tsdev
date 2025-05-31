import * as THREE from 'three';
import { DRACOLoader, GLTFLoader } from 'three/examples/jsm/Addons.js';
import { TilesRenderer } from '3d-tiles-renderer';
import { convertToEPSG, convertToECEF } from './three-convertCoor';
import { addToModelGroup } from './three-modelGroups';


export let centerECEFTiles, centerCameraTiles;

// Loader3DTiles
export async function load3dTilesModel (path, camera, renderer, controls, scene, category = 'MÔ HÌNH 3D', setCamera = false) {
  // 1. Kiểm tra tileset.json tồn tại
  try {
    const res = await fetch(path, { method: 'HEAD' });
    if (!res.ok) throw new Error(`Tileset HTTP error: ${res.status}`);
  } catch {
    throw new Error(`Tileset fetch failed: ${path}`);
  }

  const sphere = new THREE.Sphere();
  const tilesRenderer = new TilesRenderer(path);
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
  dracoLoader.setDecoderConfig({ type: 'js' });

  const loader = new GLTFLoader(tilesRenderer.manager);
  loader.setDRACOLoader(dracoLoader);

  tilesRenderer.manager.addHandler(/\.(gltf|glb)$/g, loader);
  tilesRenderer.maxDepth = 100;

  tilesRenderer.setCamera(camera);
  tilesRenderer.setResolutionFromRenderer(camera, renderer);

  const model = tilesRenderer.group;
  addToModelGroup(category, model);

  tilesRenderer.addEventListener('load-tile-set', () => {

    if (setCamera) {
      const bbox = new THREE.Box3();
      tilesRenderer.getBoundingBox(bbox);
      tilesRenderer.getBoundingSphere(sphere);
      centerECEFTiles = new THREE.Vector3(sphere.center.x, sphere.center.y, sphere.center.z);

      const centerEPSG = convertToEPSG(centerECEFTiles.x, centerECEFTiles.y, centerECEFTiles.z);
      const size = new THREE.Vector3();
      const maxLength = bbox.getSize(size).length();

      const cameraEPSG = {
        x: centerEPSG.x - maxLength * 0.1,
        y: centerEPSG.y - maxLength * 0.4,
        z: centerEPSG.z + maxLength * 0.25
      };

      centerCameraTiles = convertToECEF(cameraEPSG.x, cameraEPSG.y, cameraEPSG.z);
      camera.position.set(centerCameraTiles.x, centerCameraTiles.y, centerCameraTiles.z);
      controls.target.copy(sphere.center);
      camera.up.copy(centerCameraTiles.clone().normalize());
      controls.update();
    }

    scene.add(model);
  });

  const disposeTilesRenderer = () => {
    tilesRenderer.dispose();
    model.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        object.material.dispose();
      }
    });
    scene.remove(model);
  };

  return {
    tilesRenderer,
    dispose: disposeTilesRenderer,
    model
  };
}
