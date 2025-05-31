// three-registerClick.js
import * as THREE from 'three';
import { isClickOnUI } from '../utils/ui-main.js';
import { resetHighlight, applyHighlight } from '../utils/highlighUtils.js';
import { generateInfoHTML } from '../utils/generateInfoHTML.js';

let clickReady = false;

export function registerClickHandler(scene, camera, infoContent) {
  if (clickReady) return;
  clickReady = true;

  const ray = new THREE.Raycaster();
  ray.layers.set(0); // chỉ quét layer mặc định (các lớp đang bật)

  const mouse = new THREE.Vector2();
  let down = false, downTime = 0, lastClick = 0;
  let downPos = { x: 0, y: 0 }, timeout = null;

  window.addEventListener("mousedown", (e) => {
    down = true;
    downTime = performance.now();
    downPos = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener("mouseup", (e) => {
    if (!down) return;
    down = false;
    const t = performance.now() - downTime;
    const dist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
    if (t > 200 || dist > 5) return;

    const now = performance.now();
    if (now - lastClick < 180) {
      clearTimeout(timeout);
      return;
    }
    lastClick = now;
    timeout = setTimeout(() => onClick(e), 180);
  });

  window.addEventListener("dblclick", (e) => {
    if (isClickOnUI(e)) return;
    onClick(e);
  });

  function onClick(e) {
    if (isClickOnUI(e)) return;

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    ray.setFromCamera(mouse, camera);

    const hits = ray.intersectObjects(
      scene.children.filter(obj => obj.visible && obj.layers.test(ray.layers)),
      true
    );
    resetHighlight();
    if (!hits.length) return;

    const mesh = hits[0].object;
    const idAttr = mesh.geometry?.attributes?.objectId;
    const colAttr = mesh.geometry?.attributes?.color;
    const face = hits[0].face?.a;

    // Gọi highlight (tự xử lý theo objectId hoặc fallback)
    const objId = applyHighlight(mesh, idAttr, colAttr, face, scene);

    // Truy xuất metadata đúng cách
    const meta = (idAttr && objId !== null && objId !== undefined)
      ? mesh.userData.metadata?.find(obj => obj.id === objId)
      : mesh.userData.metadata?.[0];

    if (meta && infoContent) {
        infoContent.innerHTML = generateInfoHTML(meta);
    }
  }

}
