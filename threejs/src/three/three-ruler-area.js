// === THREE RULER AREA ===

import * as THREE from 'three';
import {
  computeCentroid,
  createLabel,
  updateLabel,
  collectVisibleMeshes,
  updateLineTransform,
  drawMeasureLine,
  updateLineThickness,
  createSphere,
  handleHover,
  hoverableSpheres,
  createAreaPolygon,
  updatePolygonMesh,
  compute3DArea,
  drawDropLines,
  updateDropLines
} from './three-ruler-utils.js';

let cameraRef, rendererRef, controlsRef;
let areaGroup = new THREE.Group();
let originPoint = null;
let areaEnabled = false;
let clickHandlersRegistered = false;

let isMouseDown = false;
let mouseDownTime = 0;
let mouseDownPosition = { x: 0, y: 0 };
let lastClickTime = 0;
let clickTimeout = null;
let isRightMouseDown = false;
let rightMouseDownTime = 0;
let rightMouseDownPosition = { x: 0, y: 0 };
let clearAreaButton = null;

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let highlightedSphere = null;
let draggingSphere = null;
let previewLine = null;
let previewLabel = null;
let isAnimating = false;
let hasDragged = false;
let originalDragPosition = null;
let dragCanceled = false;
let skipNextClick = false;
let skipClickAfterDrag = false;

let pointGroups = [];
let sphereGroups = [];
let lineGroups = [];
let labelGroups = [];
let areaLabels = [];
let allSpheres = [];
let finalized = false;
let polygonMeshes = [];
let dropLineGroups = []; // Mỗi group lưu mảng các line

export function initRulerArea(scene, camera, renderer, controls) {
  camera.userData.renderer = renderer;
  cameraRef = camera;
  rendererRef = renderer;
  controlsRef = controls;
  scene.add(areaGroup);

  if (!isAnimating) {
    requestAnimationFrame(animateLabels);
    isAnimating = true;
  }

  if (!clickHandlersRegistered) {
    const dom = rendererRef.domElement;
    dom.addEventListener('mousedown', handleMouseDown);
    dom.addEventListener('mousemove', handleMouseMove);
    dom.addEventListener('mouseup', handleMouseUp);
    dom.addEventListener('contextmenu', handleRightClick);
    clickHandlersRegistered = true;
  }
}

function handleMouseDown(event) {
  isMouseDown = true;
  mouseDownTime = performance.now();
  mouseDownPosition = { x: event.clientX, y: event.clientY };

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, cameraRef);

  const intersects = raycaster.intersectObjects(allSpheres, false);
  if (intersects.length > 0) {
    draggingSphere = intersects[0].object;
    originalDragPosition = draggingSphere.position.clone();
    if (controlsRef) controlsRef.enabled = false;
  }

  if (event.button === 2) {
    isRightMouseDown = true;
    rightMouseDownTime = performance.now();
    rightMouseDownPosition = { x: event.clientX, y: event.clientY };
  }
}

function handleMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, cameraRef);

  // === 1. Highlight point luôn bật ===
  handleHover(mouse, cameraRef, raycaster, hoverableSpheres, rendererRef, true);

  // === 2. Nếu không kéo và không bật đo thì bỏ qua
  if (!areaEnabled && !draggingSphere) return;

  // === 3. Drag point
  if (draggingSphere) {
    const intersects = raycaster.intersectObjects(collectVisibleMeshes(areaGroup.parent, areaGroup), true);
    if (intersects.length > 0) {
      const hit = intersects[0].point.clone();
      const localPos = hit.sub(originPoint);
      draggingSphere.position.copy(localPos);
      hasDragged = true;

      const groupIndex = sphereGroups.findIndex(g => g.includes(draggingSphere));
      if (groupIndex !== -1) {
        const index = sphereGroups[groupIndex].indexOf(draggingSphere);
        pointGroups[groupIndex][index].copy(localPos);

        if (pointGroups[groupIndex].length >= 3) {
          regeneratePolygon(groupIndex);
          // Cập nhật lại vùng polygon
          updatePolygonMesh({
            groupIndex,
            pointGroups,
            originPoint,
            areaGroup,
            polygonMeshes,
            createAreaPolygon
          });
          // Cập nhật droplines
          updateDropLines(
            sphereGroups[groupIndex],
            dropLineGroups[groupIndex],
            originPoint,
            pointGroups[groupIndex]
          );
        }
      }
    }
    return;
  }

  // === 4. Hiển thị preview line khi đang đo
  if (!finalized) {
    const currentPoints = pointGroups.at(-1);
    if (!currentPoints || currentPoints.length === 0) return;

    const intersects = raycaster.intersectObjects(collectVisibleMeshes(areaGroup.parent, areaGroup), true);
    if (intersects.length === 0) return;

    const hit = intersects[0].point.clone();
    const localStart = currentPoints.at(-1).clone();
    const localEnd = hit.clone().sub(originPoint);

    if (!previewLine) {
      previewLine = drawMeasureLine(localStart, localEnd, 0.05, areaGroup);
    } else {
      updateLineTransform(previewLine.mesh, localStart, localEnd);
    }

    const mid = localStart.clone().lerp(localEnd, 0.5);
    const distance = localStart.clone().add(originPoint).distanceTo(hit);
    if (!previewLabel) {
      previewLabel = createLabel(`${distance.toFixed(2)} m`, mid, pointGroups.length - 1, areaGroup);
    } else {
      updateLabel(previewLabel, `${distance.toFixed(2)} m`, mid);
    }
  }
}

function handleMouseUp(event) {
  isMouseDown = false;

  const timeDiff = performance.now() - mouseDownTime;
  const moveDistance = Math.hypot(
    event.clientX - mouseDownPosition.x,
    event.clientY - mouseDownPosition.y
  );

  if (controlsRef) controlsRef.enabled = true;

  if (hasDragged) {
    hasDragged = false;
    draggingSphere = null;
    return; // ✅ Nếu drag thì không phải click
  }

  // ✅ Chỉ click nếu không di chuyển và không drag
  if (timeDiff < 200 && moveDistance < 5 && event.button === 0) {
    onMouseClick(event, areaGroup.parent);
  }

  draggingSphere = null;
}

function handleRightClick(event) {
  if (!areaEnabled) return;

  const timeDiff = performance.now() - rightMouseDownTime;
  const moveDistance = Math.hypot(event.clientX - rightMouseDownPosition.x, event.clientY - rightMouseDownPosition.y);
  isRightMouseDown = false;

  if (timeDiff > 200 || moveDistance > 5) return;
  event.preventDefault();

  if (draggingSphere) {
    draggingSphere.position.copy(originalDragPosition);

    const groupIndex = sphereGroups.findIndex(g => g.includes(draggingSphere));
    if (groupIndex !== -1) {
      const idx = sphereGroups[groupIndex].indexOf(draggingSphere);
      pointGroups[groupIndex][idx].copy(originalDragPosition);
      regeneratePolygon(groupIndex);
    }

    draggingSphere = null;
    originalDragPosition = null;
    hasDragged = false;
    dragCanceled = true;
    if (controlsRef) controlsRef.enabled = true;
    return;
  }

  const currentPoints = pointGroups.at(-1);
  if (!currentPoints || currentPoints.length < 3) {
    cancelCurrentMeasurement();
    return;
  }

  finalizePolygon(pointGroups.length - 1);

  if (previewLine?.mesh) {
    areaGroup.remove(previewLine.mesh);
    previewLine.mesh.geometry.dispose();
    previewLine.mesh.material.dispose();
    previewLine = null;
  }
  if (previewLabel) {
    areaGroup.remove(previewLabel);
    previewLabel = null;
  }

  const groupIndex = pointGroups.length - 1;
  const first = pointGroups[groupIndex][0];
  const last = pointGroups[groupIndex].at(-1);
  if (first && last && !first.equals(last)) {
    
    const { mesh } = drawMeasureLine(last, first, 0.05, areaGroup);
    lineGroups[groupIndex].push(mesh);

    const mid = last.clone().lerp(first, 0.5);
    const dist = last.clone().add(originPoint).distanceTo(first.clone().add(originPoint));
    const label = createLabel(`${dist.toFixed(2)} m`, mid, groupIndex, areaGroup);
    labelGroups[groupIndex].push(label);
    areaGroup.add(label);
  }

  previewLine = null;
  previewLabel = null;
  finalized = true;
}

function onMouseClick(event, scene) {
  if (!areaEnabled || event.button !== 0) return;
  if (draggingSphere) return; // ⛔ đang drag thì không được tính click


  if (skipClickAfterDrag) {
    skipClickAfterDrag = false; // ⬅️ reset sau 1 lần
    return;
  }
  if (finalized || pointGroups.length === 0) {
    pointGroups.push([]);
    sphereGroups.push([]);
    lineGroups.push([]);
    labelGroups.push([]);
    areaLabels.push(null);
    finalized = false;
  }

  const groupIndex = pointGroups.length - 1;
  const currentPoints = pointGroups.at(-1);
  const currentSpheres = sphereGroups.at(-1);
  const currentLines = lineGroups.at(-1);

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, cameraRef);

  const intersects = raycaster.intersectObjects(collectVisibleMeshes(scene, areaGroup), true);
  if (intersects.length === 0) return;

  const worldPoint = intersects[0].point.clone();
  if (!originPoint) {
    originPoint = worldPoint.clone();
    areaGroup.position.copy(originPoint);
  }

  const local = worldPoint.clone().sub(originPoint);
  const sphere = createSphere(local, originPoint, cameraRef);
  sphere.position.copy(local);
  areaGroup.add(sphere);
  allSpheres.push(sphere);
  hoverableSpheres.push(sphere);
  currentPoints.push(local);
  currentSpheres.push(sphere);

  // Tạo line cố định từ điểm trước đến điểm này
  if (currentPoints.length >= 2) {
    const groupIndex = pointGroups.length - 1;
    const start = currentPoints[currentPoints.length - 2];
    const end = currentPoints[currentPoints.length - 1];
  
    const { mesh } = drawMeasureLine(start, end, 0.05, areaGroup);
    lineGroups[groupIndex].push(mesh);
  
    const mid = start.clone().lerp(end, 0.5);
    const dist = start.clone().add(originPoint).distanceTo(end.clone().add(originPoint));
    const label = createLabel(`${dist.toFixed(2)} m`, mid, groupIndex, areaGroup);
    labelGroups[groupIndex].push(label);
    areaGroup.add(label);
  }
  
  
  if (previewLine?.mesh) {
    areaGroup.remove(previewLine.mesh);
    previewLine.mesh.geometry.dispose();
    previewLine.mesh.material.dispose();
    previewLine = null;
  }

  if (previewLabel) {
    areaGroup.remove(previewLabel);
    previewLabel = null;
  }
}


function regeneratePolygon(groupIndex) {
  const points = pointGroups[groupIndex];
  if (points.length < 3) return;

  // Xoá line + label cũ
  lineGroups[groupIndex]?.forEach(l => {
    areaGroup.remove(l);
    l.geometry?.dispose?.();
    l.material?.dispose?.();
  });
  labelGroups[groupIndex]?.forEach(lbl => areaGroup.remove(lbl));
  if (areaLabels[groupIndex]) areaGroup.remove(areaLabels[groupIndex]);

  lineGroups[groupIndex] = [];
  labelGroups[groupIndex] = [];

  const worldPoints = points.map(p => p.clone().add(originPoint));
  let totalLength = 0;

  // 🔁 Vẽ các đoạn liên tiếp
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const group = drawMeasureLine(a, b, 0.05, areaGroup);
    updateLineThickness(group.mesh, cameraRef);
    lineGroups[groupIndex].push(group.mesh);

    const mid = a.clone().lerp(b, 0.5);
    const dist = a.clone().add(originPoint).distanceTo(b.clone().add(originPoint));
    const label = createLabel(`${dist.toFixed(2)} m`, mid, groupIndex, areaGroup);
    labelGroups[groupIndex].push(label);
    totalLength += dist;
  }

  // ✅ Vẽ đoạn khép: point cuối → point đầu
  const a = points[points.length - 1];
  const b = points[0];
  const group = drawMeasureLine(a, b, 0.05, areaGroup);
  updateLineThickness(group.mesh, cameraRef);
  lineGroups[groupIndex].push(group.mesh);

  const mid = a.clone().lerp(b, 0.5);
  const dist = a.clone().add(originPoint).distanceTo(b.clone().add(originPoint));
  const label = createLabel(`${dist.toFixed(2)} m`, mid, groupIndex, areaGroup);
  labelGroups[groupIndex].push(label);
  totalLength += dist;

  // 📐 Nhãn diện tích
  const area = compute3DArea(worldPoints);
  const center = computeCentroid(worldPoints).sub(originPoint);
  const closingLabel = createLabel(`Diện tích: ${area.toFixed(2)} m²`, center, groupIndex, areaGroup);
  areaLabels[groupIndex] = closingLabel;
  areaGroup.add(closingLabel);
}

function finalizePolygon(groupIndex) {
  const points = pointGroups[groupIndex];
  const worldPoints = points.map(p => p.clone().add(originPoint));

  const polygonMesh = createAreaPolygon(worldPoints, originPoint);
  if (polygonMesh) {
    areaGroup.add(polygonMesh);
    polygonMeshes[groupIndex] = polygonMesh;
  }

  const dropLines = drawDropLines(sphereGroups[groupIndex], originPoint, areaGroup);
  dropLineGroups[groupIndex] = dropLines;

  const geometry = new THREE.BufferGeometry();
  const center = computeCentroid(worldPoints);

  const vertices = [];
  for (let i = 0; i < worldPoints.length; i++) {
    vertices.push(...worldPoints[i].toArray());
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

  const area = compute3DArea(worldPoints);
  
  const label = createLabel(`Diện tích: ${Math.abs(area).toFixed(2)} m²`, center.clone().sub(originPoint), groupIndex, areaGroup);
  areaLabels[groupIndex] = label;
  areaGroup.add(label);
  createClearAreaButton();
}

function cancelCurrentMeasurement() {
  const groupIndex = pointGroups.length - 1;
  const points = pointGroups[groupIndex];
  if (!points || points.length >= 3) return;

  sphereGroups[groupIndex]?.forEach(s => {
    areaGroup.remove(s);
    s.geometry?.dispose?.();
    s.material?.dispose?.();
    allSpheres = allSpheres.filter(item => item !== s);
    const idx = hoverableSpheres.indexOf(s);
    if (idx !== -1) hoverableSpheres.splice(idx, 1); // ✅ dùng đúng biến
  });

  lineGroups[groupIndex]?.forEach(l => {
    areaGroup.remove(l);
    l.geometry?.dispose?.();
    l.material?.dispose?.();
  });

  labelGroups[groupIndex]?.forEach(lbl => areaGroup.remove(lbl));

  // Preview
  if (previewLine?.mesh) {
    areaGroup.remove(previewLine.mesh);
    previewLine.mesh.geometry.dispose();
    previewLine.mesh.material.dispose();
    previewLine = null;
  }
  if (previewLabel) {
    areaGroup.remove(previewLabel);
    previewLabel = null;
  }

  // Xóa group khỏi danh sách
  pointGroups.pop();
  sphereGroups.pop();
  lineGroups.pop();
  labelGroups.pop();
  areaLabels.pop();
  finalized = true;

}

function animateLabels() {
  requestAnimationFrame(animateLabels);
  updateSphereScales(allSpheres, cameraRef);
  updateAllLineScales(cameraRef);
}

function updateAllLineScales(camera) {
  for (const group of lineGroups) {
    for (const line of group) {
      if (line?.geometry?.parameters?.height) {
        updateLineThickness(line, camera);
      }
    }
  }

  if (previewLine?.mesh?.geometry?.parameters?.height) {
    updateLineThickness(previewLine.mesh, camera);
  }
}
function updateSphereScales(spheres, camera) {
  const cameraPos = camera.position;
  const tempVec = new THREE.Vector3();
  const lerpFactor = 0.2;

  for (const sphere of spheres) {
    const worldPos = sphere.getWorldPosition(tempVec);
    const distance = cameraPos.distanceTo(worldPos);
    const autoScale = THREE.MathUtils.clamp(distance * 0.02, 1.0, 6.0);
    const target = autoScale * sphere.userData.targetScale;

    sphere.userData.currentScale = THREE.MathUtils.lerp(
      sphere.userData.currentScale,
      target,
      lerpFactor
    );
    sphere.scale.setScalar(sphere.userData.currentScale);


    // Màu tween
    if (sphere.userData.currentColor && sphere.userData.targetColor) {
      sphere.userData.currentColor.lerp(sphere.userData.targetColor, lerpFactor);
      sphere.material.color.copy(sphere.userData.currentColor);
    }
  }
}

export function activateRulerArea() {
  areaEnabled = true;
}

export function deactivateRulerArea() {
  areaEnabled = false;  // ❌ tắt chế độ vẽ thêm điểm

  draggingSphere = null;
  highlightedSphere = null;

}

function createClearAreaButton() {
  if (document.getElementById('area-clear-button')) return;

  const btn = document.createElement('div');
  btn.id = 'area-clear-button';
  btn.classList.add('circle-button');
  btn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
  btn.addEventListener('click', () => {
    clearAllAreaMeasurements();
    btn.remove();
  });

  document.body.appendChild(btn);
}

function clearAllAreaMeasurements() {
  for (const arr of [sphereGroups, lineGroups, labelGroups]) {
    arr.flat().forEach(obj => {
      areaGroup.remove(obj);
      obj.geometry?.dispose?.();
      obj.material?.dispose?.();
    });
  }

  areaLabels.forEach(lbl => {
    if (lbl && lbl.parent) areaGroup.remove(lbl);
  });

  polygonMeshes.forEach(p => {
    if (p) {
      areaGroup.remove(p);
      p.geometry?.dispose?.();
      p.material?.dispose?.();
    }
  });

  dropLineGroups.forEach(lines => {
    lines?.forEach(line => {
      if (!line) return;
      areaGroup.remove(line);
      line.geometry?.dispose?.();
      line.material?.dispose?.();
    });
  });

  // ✅ Reset sạch toàn bộ
  polygonMeshes.length = 0;
  dropLineGroups.length = 0;
  allSpheres.length = 0;
  pointGroups.length = 0;
  sphereGroups.length = 0;
  lineGroups.length = 0;
  labelGroups.length = 0;
  areaLabels.length = 0;
  hoverableSpheres.length = 0;
  finalized = false;
}
