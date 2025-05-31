import * as THREE from 'three';
import { convertToECEF } from './three-convertCoor';
import { addToModelGroup } from './three-modelGroups';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { zoomAt } from './three-controls';

export async function drawPolylineFromCSV(
  url,
  scene,
  camera,
  controls,
  name = 'Polyline',
  zOffset = 0,
  maxDistance = 700
) {
  // Thêm CSS label nếu chưa có
  if (!document.getElementById('three-label-style')) {
    const style = document.createElement('style');
    style.id = 'three-label-style';
    style.innerHTML = `
      .label {
        white-space: nowrap;
        pointer-events: none;
        padding: 2px 6px;
        background: rgba(0, 0, 0, 0.3);
        color: white;
        font-weight: bold;
        font-size: 12px;
        border-radius: 8px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }

      .label-start, .label-end {
        background: rgba(0, 128, 0, 0.85);
        border: 1px solid #0f0;
      }
    `;
    document.head.appendChild(style);
  }

  try {
    const response = await fetch(url);
    const csvText = await response.text();
    const lines = csvText.trim().split('\n');

    const pointsECEF = [];
    const pointsRaw = [];

    for (const line of lines) {
      const parts = line.split(',');
      if (parts.length < 5) continue;

      const x = parseFloat(parts[1]);
      const y = parseFloat(parts[2]);
      const z = parseFloat(parts[3]) + zOffset;
      const desc = parts[4]?.trim() || '';

      const ecef = convertToECEF(x, y, z);
      pointsECEF.push(ecef);
      pointsRaw.push({ X: x, Y: y, Z: z, Desc: desc });
    }

    if (pointsECEF.length < 2) return;

    const origin = pointsECEF[0].clone();
    const pointsLocal = pointsECEF.map(p => p.clone().sub(origin));

    const group = new THREE.Group();
    group.name = name;
    group.position.copy(origin);
    scene.add(group);

    // === Vẽ Tube theo spline ===
    const curve = new THREE.CatmullRomCurve3(pointsLocal);
    const tubeGeom = new THREE.TubeGeometry(curve, 1000, 0.2, 8, false);

    const mat = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      depthTest: false
    });

    const tube = new THREE.Mesh(tubeGeom, mat);
    tube.userData.highlightId = `tube_${name}`;
    tube.userData.metadata = [pointsRaw[0]];

    addToModelGroup(name, tube);
    group.add(tube);

    // === Vẽ nhãn + sphere cho từng điểm ===
    for (let i = 0; i < pointsLocal.length; i++) {
      const localPoint = pointsLocal[i];
      const raw = pointsRaw[i];

      // Label
      const div = document.createElement('div');
      div.className = 'label';
      div.textContent = raw.Desc;
      if (i === 0) div.classList.add('label-start');
      if (i === pointsLocal.length - 1) div.classList.add('label-end');

      // Cho phép tương tác
      div.style.pointerEvents = 'auto';
      div.style.cursor = 'pointer';

      // Gắn sự kiện double click để zoom
      div.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        const worldPos = localPoint.clone().add(origin);
        const direction = camera.position.clone().sub(worldPos).normalize();
        const newPos = worldPos.clone().add(direction.multiplyScalar(20));
        zoomAt(worldPos, newPos, camera, controls);
      });

      const label = new CSS2DObject(div);
      label.position.copy(localPoint);
      label.userData.isLabel = true;
      label.userData.originalParent = group;
      label.userData.metadata = [raw];

      addToModelGroup(name, label);
      group.add(label);


      // Sphere
      const sphereGeom = new THREE.SphereGeometry(0.5, 16, 16);
      const sphereMat = new THREE.MeshBasicMaterial({ color: 0xf5b042 });
      const sphere = new THREE.Mesh(sphereGeom, sphereMat);
      sphere.position.copy(localPoint);
      sphere.userData.highlightId = `sphere_${name}_${i}`;
      sphere.userData.metadata = [raw];

      addToModelGroup(name, sphere);
      group.add(sphere);
    }

    // Hàm cập nhật hiện/ẩn nhãn theo khoảng cách camera
    const updateLabelVisibility = () => {
      group.children.forEach(obj => {
        if (obj.isCSS2DObject) {
          const dist = camera.position.distanceTo(obj.getWorldPosition(new THREE.Vector3()));
          const visible = dist < maxDistance;
          obj.element.style.visibility = visible ? 'visible' : 'hidden';
          obj.element.style.pointerEvents = visible ? 'auto' : 'none';
        }
      });
    };

    group.userData.updateLabelVisibility = updateLabelVisibility;
  } catch (err) {
    console.error('Không thể load CSV:', err);
  }
}
