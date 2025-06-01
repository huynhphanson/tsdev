import * as THREE from 'three';
import { threeInit } from './three/three-init.js'
import { startLoop } from './three/three-animate.js';
import { effectFXAA } from './three/three-outline.js';
import { findProjectPosition, zoomTarget, resizeScreen } from './three/three-controls.js';
import { clearInfoTable, isClickOnUI } from '/src/utils/ui-main.js';
import { initCesium } from './cesium/cesium-init.js';
import { setViewer } from './cesium/cesium-viewer.js';
import { cursorCoor } from './three/three-cursor-coordinates.js';
import { initRuler, activateRuler, deactivateRuler } from './three/three-ruler.js';
import { initRulerArea, activateRulerArea, deactivateRulerArea } from './three/three-ruler-area.js';
import { renderLayerContent } from './utils/ui-renderLayer.js';
import { initProjectInfo } from './utils/projectInfo.js';
import { modelGroups } from './three/three-modelGroups.js';
import { registerClickHandler } from './three/three-registerClick.js';
import { findPosition } from './three/three-findPosition.js';
import { setEPSG } from './three/three-coordConfig.js';

import { loadConfig } from './config-loader.js';
import { loadModelsFromConfig } from './viewerTemplate.js';

let config = null;


/* Cesium Init */
export const cesiumViewer = initCesium();
setViewer(cesiumViewer);

/* THREE Init */
const { scene, camera, renderer, controls, labelRenderer, composer } = threeInit();
const raycaster = new THREE.Raycaster();
const threeContainer = document.querySelector('.three-container');
threeContainer.appendChild(renderer.domElement);
threeContainer.appendChild(labelRenderer.domElement);

labelRenderer.domElement.style.display = 'none';
renderer.domElement.style.visibility = 'hidden';
document.getElementById('loading-overlay').style.display = 'flex';

/* Load Config + Models */
const tilesModels = new Map();

(async () => {
  try {
    config = await loadConfig(); // gán vào biến toàn cục
    if (config?.title) {
      document.title = config.title;
    }

    // ✅ Gán EPSG từ projectInfo nếu tìm thấy
    const epsgItem = config.projectInfo?.find(item =>
      item.label.toUpperCase().includes('HỆ TỌA ĐỘ') &&
      item.value.toUpperCase().includes('EPSG:')
    );

    if (epsgItem) {
      const raw = epsgItem.value;
      const epsgCode = raw.match(/EPSG:\d{4}/i)?.[0]?.toUpperCase();
      const label = raw.replace(/[-–]?\s*EPSG:\d{4}/i, '').trim();
      if (epsgCode) setEPSG(epsgCode, label);
    }


    const loadedModels = await loadModelsFromConfig(config, scene, camera, renderer, controls);
    loadedModels.forEach((val, key) => tilesModels.set(key, val));

    renderLayerContent(modelGroups, camera, controls);
    renderer.domElement.style.visibility = 'visible';
    labelRenderer.domElement.style.display = 'block';

    startLoop(scene, camera, controls, renderer, labelRenderer, composer, tilesModels, cesiumViewer);
  } catch (err) {
    console.error('[Lỗi khởi tạo viewer]', err);
  }
})();


/* WINDOW EVENTS */
window.addEventListener('beforeunload', () => {
  tilesModels.forEach(model => model.dispose?.());
});

window.addEventListener('click', (event) => clearInfoTable(event, raycaster, scene, camera));
window.addEventListener('resize', () => resizeScreen(camera, renderer, labelRenderer, effectFXAA, composer));

/* SEARCH */
const searchInput = document.querySelector('.search-input');
const searchBtn = document.querySelector('.btn-search');
const triggerSearch = () => findPosition(scene, camera, controls);
searchBtn.addEventListener('click', triggerSearch);
searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') triggerSearch(); });

/* PROJECT LOCATION */
const oriBtn = document.querySelector('.btn-project-location');
oriBtn.addEventListener('click', () => findProjectPosition(camera, controls));

/* DOUBLE CLICK ZOOM */
window.addEventListener('dblclick', (event) => {
  if (isClickOnUI(event)) return;
  zoomTarget(event, raycaster, scene, camera, controls);
});

/* REGISTER CLICK EVENT */
const infoContent = document.getElementById('infoContent');
registerClickHandler(scene, camera, infoContent);

/* COORDINATES */
const sidenavRightBottom = document.querySelector('.sidenav-right-bottom');
cursorCoor(raycaster, scene, camera, sidenavRightBottom);

/* RULER */
const rulerBtn = document.querySelector('.fa-ruler');
let rulerInitialized = false;
let rulerActive = false;
rulerBtn.addEventListener('click', () => {
  rulerActive = !rulerActive;
  if (areaActive) {
    areaActive = false;
    deactivateRulerArea();
    areaBtn.classList.remove('i-active');
  }
  if (rulerActive) {
    if (!rulerInitialized) {
      initRuler(scene, camera, renderer, controls);
      rulerInitialized = true;
    }
    activateRuler();
    rulerBtn.classList.add('i-active');
  } else {
    deactivateRuler();
    rulerBtn.classList.remove('i-active');
  }
});

/* RULER AREA */
const areaBtn = document.querySelector('.fa-draw-polygon');
let areaInitialized = false;
let areaActive = false;
areaBtn.addEventListener('click', () => {
  areaActive = !areaActive;
  if (rulerActive) {
    rulerActive = false;
    deactivateRuler();
    rulerBtn.classList.remove('i-active');
  }
  if (areaActive) {
    if (!areaInitialized) {
      initRulerArea(scene, camera, renderer, controls);
      areaInitialized = true;
    }
    activateRulerArea();
    areaBtn.classList.add('i-active');
  } else {
    deactivateRulerArea();
    areaBtn.classList.remove('i-active');
  }
});

/* PROJECT INFO PANEL */
const infoBtn = document.querySelector('.info-project-btn');
let infoPanelActive = false;
infoBtn.addEventListener('click', () => {
  infoPanelActive = !infoPanelActive;
  initProjectInfo(config); // truyền config vào
  infoBtn.classList.toggle('i-active', infoPanelActive);
});
