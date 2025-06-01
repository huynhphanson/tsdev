import { load3dTilesModel } from './three/three-3dtilesModel.js';
import { loadGLTFModel } from './three/three-gltfModel.js';
import { drawPolylineFromCSV } from './three/three-drawPol.js';

/**
 * Load tất cả mô hình theo config đã parse
 * @param {Object} config - file JSON của mô hình
 * @param {Object} scene - scene chính
 * @param {THREE.Camera} camera 
 * @param {THREE.Renderer} renderer 
 * @param {Object} controls 
 * @returns {Promise<Map>} - trả về Map chứa các model đã load (tuỳ loại)
 */
export async function loadModelsFromConfig(config, scene, camera, renderer, controls) {
  const tilesModels = new Map();

  const basePath = `${config.objectStorage}/${config.client}/${config.slug}/assets/models/`;

  const tilePromises = (config.models['3dtiles'] || []).map(async (m, idx) => {
    const model = await load3dTilesModel(
      `${basePath}${m.path}`, camera, renderer, controls, scene, m.label, idx === 0
    );
    tilesModels.set(`tile-${idx}`, model);
  });

  const gltfPromises = (config.models['gltf'] || []).map((m, idx) =>
    loadGLTFModel(`./assets/models/${m.path}`, scene, camera, controls, m.label)
  );

  const linePromises = (config.models['csv'] || []).map((l, idx) =>
    drawPolylineFromCSV(`./assets/${l.path}`, scene, camera, controls, l.label, l.size, l.height)
  );

  await Promise.all([...tilePromises, ...gltfPromises, ...linePromises]);

  return tilesModels;
}
