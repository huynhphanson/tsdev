import Stats from 'three/examples/jsm/libs/stats.module.js';
import * as THREE from 'three';
import { syncThreeToCesium } from '../cesium/cesium-syncThree';

// Stats FPS
const statsFPS = new Stats();
statsFPS.showPanel(0);
document.body.appendChild(statsFPS.dom);
statsFPS.dom.style.position = 'absolute';
statsFPS.dom.style.left = '10px';
statsFPS.dom.style.top = '100px';

// Stats MS
const statsMS = new Stats();
statsMS.showPanel(1);
document.body.appendChild(statsMS.dom);
// Thay đổi vị trí xuống góc phải dưới màn hình
statsMS.dom.style.position = 'absolute';
statsMS.dom.style.left = '10px';
statsMS.dom.style.top = '150px';

// Stats MB
const statsMB = new Stats();
statsMB.showPanel(2);
document.body.appendChild(statsMB.dom);
// Thay đổi vị trí xuống góc phải dưới màn hình
statsMB.dom.style.position = 'absolute';
statsMB.dom.style.left = '10px';
statsMB.dom.style.top = '200px';

export function startLoop(scene, camera, controls, renderer, labelRenderer, composer, tilesModels, cesiumViewer) {
  
  function loop () {
    // Start stats
    statsFPS.begin();
    statsMS.begin();
    statsMB.begin();

    // Loop
    requestAnimationFrame(loop);
    
    controls.update();
    composer.render();
    labelRenderer.render(scene, camera);

    tilesModels.forEach(model => {
      model.tilesRenderer.update();
    });

    scene.traverse(obj => {
      if (obj.userData.updateLabelVisibility) {
        obj.userData.updateLabelVisibility();
      }
    });

    try {
      syncThreeToCesium(camera, controls, cesiumViewer);
      cesiumViewer.render();
    } catch (error) {
      console.error("Error syncing cameras:", error);
    }
    
    // End stats
    statsFPS.end();
    statsMS.end();
    statsMB.end();
  }

  loop();
}