import * as THREE from 'three';
import { convertToEPSG } from "./three-convertCoor";
import { getEPSGLabel } from './three-coordConfig';
const { label, epsg } = getEPSGLabel();


export function cursorCoor (raycaster, scene, camera, container) {
  const divCoor = document.createElement('div');
  container.appendChild(divCoor);

  window.addEventListener('mousemove', (event) => {
    const coords = new THREE.Vector3();
    coords.x = (event.clientX / window.innerWidth) * 2 - 1;
    coords.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(coords, camera);

    const visibleObjects = scene.children.filter(obj => obj.visible);
    const intersects = raycaster.intersectObjects(visibleObjects);
    if (intersects.length > 0) {
      const p = intersects[0].point;
      const pEPSG = convertToEPSG(p.x, p.y, p.z);

      const coordinate = {
        x: pEPSG.x.toFixed(3),
        y: pEPSG.y.toFixed(3),
        z: pEPSG.z.toFixed(3)
      };
      

      divCoor.innerHTML = `
        <span style="color: #aaa;">
          ${label}<span class="epsg-tag">- ${epsg}</span>
        </span>
        <span>X(E): ${coordinate.x}</span>
        <span>Y(N): ${coordinate.y}</span>
        <span>Z(H): ${coordinate.z}</span>
      `;
                

      container.style.display = 'block';
    } else {
      container.style.display = 'none';
    }
  });
}
