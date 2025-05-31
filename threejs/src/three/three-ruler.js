// === THREE RULER HOÀN CHỈNH ===

import * as THREE from 'three';
import { convertToECEF, convertToEPSG } from './three-convertCoor';
import { CSS2DObject } from 'three/examples/jsm/Addons.js';
import {
  computeCentroid,
  createLabel,
  updateLabel,
  offsetLabelAwayFromThirdPoint,
  createLeaderLine,
  updateLeaderLine,
  updateLineTransform,
  collectVisibleMeshes,
  drawMeasureLine,
  updateLineThickness,
  createSphere,
  handleHover,
  hoverableSpheres
} from './three-ruler-utils.js';

// === Biến toàn cục ===
let cameraRef, rendererRef, controlsRef;
let rulerGroup = new THREE.Group();
let originPoint = null;
let rulerEnabled = false;
let rulerInteractionEnabled = true;
let clickHandlersRegistered = false;
let isAnimating = false;

let allSpheres = [];
let measurements = [];
let highlightedSphere = null;

let draggingSphere = null;

let previewLine = null;
let previewLabel = null;
let previewLine1 = null;
let previewLabel1 = null;
let polygonAreaLabel = null;
let polygonMesh = null;

let finalized = false;

let pointGroups = [];
let sphereGroups = [];
let lineGroups = [];
let labelGroups = [];
let totalLabels = [];

let isMouseDown = false;
let mouseDownTime = 0;
let mouseDownPosition = { x: 0, y: 0 };
let lastClickTime = 0;
let clickTimeout = null;

let isRightMouseDown = false;
let rightMouseDownTime = 0;
let rightMouseDownPosition = { x: 0, y: 0 };

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const lastMousePosition = new THREE.Vector2();
let totalLengthLabel = null;

// === Khởi tạo ===
export function initRuler(scene, camera, renderer, controls) {
  camera.userData.renderer = renderer;
  cameraRef = camera;
  rendererRef = renderer;
  controlsRef = controls;
  scene.add(rulerGroup);

  if (!isAnimating) {
    animateLabels();
    isAnimating = true;
  }

  if (!clickHandlersRegistered) {
    const dom = rendererRef.domElement;
    dom.addEventListener("mousedown", handleMouseDown);
    dom.addEventListener("mousemove", handleMouseMove);
    dom.addEventListener("mouseup", handleMouseUp);
    dom.addEventListener("contextmenu", handleRightClick);
    clickHandlersRegistered = true;
  }
}

function handleMouseDown(event) {
  isMouseDown = true;
  mouseDownTime = performance.now();
  mouseDownPosition = { x: event.clientX, y: event.clientY };

  if (event.button === 2) {
    isRightMouseDown = true;
    rightMouseDownTime = performance.now();
    rightMouseDownPosition = { x: event.clientX, y: event.clientY };
  }

  if (!rulerInteractionEnabled) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, cameraRef);

  const intersects = raycaster.intersectObjects(allSpheres, false);
  if (intersects.length > 0) {
    draggingSphere = intersects[0].object;
    if (controlsRef) controlsRef.enabled = false;
  }
}



function handleMouseMove(event) {
  if (!rulerInteractionEnabled) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, cameraRef);

  // ✅ xử lý kéo point kể cả khi không bật rulerEnabled
  if (draggingSphere) {
    const intersects = raycaster.intersectObjects(collectVisibleMeshes(rulerGroup.parent, rulerGroup), true);
    if (intersects.length > 0) {
      const hit = intersects[0].point.clone();
      const localPos = hit.sub(originPoint);
      draggingSphere.position.copy(localPos);

      const groupIndex = sphereGroups.findIndex(group => group.includes(draggingSphere));
      if (groupIndex !== -1) {
        const idx = sphereGroups[groupIndex].indexOf(draggingSphere);
        pointGroups[groupIndex][idx].copy(localPos);
        regenerateLinesAndLabels(groupIndex);
      }

      updateAllMeasurements();
    }
    return;
  }

  // ✅ xử lý hover point
  handleHover(mouse, cameraRef, raycaster, hoverableSpheres, rendererRef, true);

  // ⛔ phần này chỉ chạy khi đang bật chức năng đo
  if (!rulerEnabled) return;

  const currentPoints = pointGroups.at(-1);
  const currentSpheres = sphereGroups.at(-1);
  const currentLines = lineGroups.at(-1);
  if (!currentPoints || !currentPoints.length || !currentSpheres || !currentLines) return;

  const intersects = raycaster.intersectObjects(collectVisibleMeshes(rulerGroup.parent, rulerGroup), true);
  if (intersects.length === 0) return;

  const hit = intersects[0].point.clone();
  const localStart = currentPoints[currentPoints.length - 1].clone();
  const localEnd = hit.clone().sub(originPoint);

  if (!previewLine) {
    const groupIndex = pointGroups.length - 1;
    previewLine = drawMeasureLine(localStart, localEnd, 0.05, rulerGroup, 'polyline', groupIndex);
  } else {
    updateLineTransform(previewLine.mesh, localStart, localEnd);
  }

  const mid = localStart.clone().lerp(localEnd, 0.5);
  const distance = localStart.clone().add(originPoint).distanceTo(hit);

  if (!previewLabel) {
    const groupIndex = pointGroups.length - 1;
    previewLabel = createLabel(`${distance.toFixed(2)} m`, mid, groupIndex, rulerGroup);
  } else {
    updateLabel(previewLabel, `${distance.toFixed(2)} m`, mid);
  }
}


function handleMouseUp(event) {
  isMouseDown = false;
  if (controlsRef) controlsRef.enabled = true;
  draggingSphere = null;

  const timeDiff = performance.now() - mouseDownTime;
  const moveDistance = Math.hypot(
    event.clientX - mouseDownPosition.x,
    event.clientY - mouseDownPosition.y
  );

  if (timeDiff > 200 || moveDistance > 5) return;

  // ✅ Chỉ click nếu không di chuyển và không drag
  if (timeDiff < 200 && moveDistance < 5 && event.button === 0) {
    onMouseClick(event, rulerGroup.parent);
  }

}

function handleRightClick(event) {
  const currentPoints = pointGroups.at(-1);
  const currentSpheres = sphereGroups.at(-1);
  if (!currentPoints || currentPoints.length === 0) return;

  const timeDiff = performance.now() - rightMouseDownTime;
  const moveDistance = Math.hypot(
    event.clientX - rightMouseDownPosition.x,
    event.clientY - rightMouseDownPosition.y
  );
  isRightMouseDown = false;
  if (timeDiff > 200 || moveDistance > 5) return;
  event.preventDefault();

  if (currentPoints.length === 1) {
    const sphere = currentSpheres[0];
    rulerGroup.remove(sphere);
    allSpheres = allSpheres.filter(s => s !== sphere);
    hoverableSpheres.splice(hoverableSpheres.indexOf(sphere), 1);
    currentPoints.length = 0;
    currentSpheres.length = 0;
    clearPreview();
    return;
  }

  if (currentPoints.length === 2) {
    const p1 = currentSpheres[0];
    const p2 = currentSpheres[1];
    measurements.push(drawRightTriangle(p1, p2));
    currentPoints.length = 0;
    currentSpheres.length = 0;
    clearPreview();
    createClearRulerButton();
    return;
  }

  if (currentPoints.length >= 3) {
    finalizePolylineMeasurement(pointGroups.length - 1);
    finalized = true;
    clearPreview();
    createClearRulerButton();
    // ✅ Reset group để đo mới sau đó
    pointGroups.push([]);
    sphereGroups.push([]);
    lineGroups.push([]);
    labelGroups.push([]);
    totalLabels.push(null);
    finalized = false;
  }
}

function clearPreview() {
  if (previewLine?.mesh) {
    rulerGroup.remove(previewLine.mesh);
    previewLine.mesh.geometry?.dispose();
    previewLine.mesh.material?.dispose();
    previewLine = null;
  }
  if (previewLabel) {
    rulerGroup.remove(previewLabel);
    previewLabel = null;
  }
  if (previewLine1?.mesh) {
    rulerGroup.remove(previewLine1.mesh);
    previewLine1.mesh.geometry?.dispose();
    previewLine1.mesh.material?.dispose();
    previewLine1 = null;
  }
  if (previewLabel1) {
    rulerGroup.remove(previewLabel1);
    previewLabel1 = null;
  }
}


function onMouseClick(event, scene) {
  if (!rulerEnabled || event.button !== 0) return;

  if (finalized || pointGroups.length === 0) {
    pointGroups.push([]);
    sphereGroups.push([]);
    lineGroups.push([]);
    labelGroups.push([]);
    totalLabels.push(null);
    finalized = false;

    previewLine = null;
    previewLabel = null;
    previewLine1 = null;
    previewLabel1 = null;
    polygonAreaLabel = null;
    polygonMesh = null;
  }

  const currentPoints = pointGroups.at(-1);
  const currentSpheres = sphereGroups.at(-1);

  updatePreviewLine({ clientX: event.clientX, clientY: event.clientY });
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, cameraRef);

  const intersects = raycaster.intersectObjects(collectVisibleMeshes(scene, rulerGroup), true);
  if (intersects.length === 0) return;

  const worldPoint = intersects[0].point.clone();
  if (!originPoint) {
    originPoint = worldPoint.clone();
    rulerGroup.position.copy(originPoint);
  }

  const localPoint = worldPoint.clone().sub(originPoint);
  const sphere = createSphere(localPoint, originPoint, cameraRef);
  rulerGroup.add(sphere);
  currentPoints.push(localPoint);
  currentSpheres.push(sphere);
  allSpheres.push(sphere);
  hoverableSpheres.push(sphere);
  if (currentPoints.length >= 2 && previewLine) {
    previewLine1 = previewLine;
    previewLabel1 = previewLabel;
    previewLine = null;
    previewLabel = null;
  }
}

// === Core Logic ===
function animateLabels() {
  requestAnimationFrame(animateLabels);
  updateSphereScales(allSpheres, cameraRef);
  updateAllLineScales(cameraRef);
}

function finalizePolylineMeasurement(groupIndex) {
  if (!pointGroups[groupIndex] || pointGroups[groupIndex].length < 2) return;

  regenerateLinesAndLabels(groupIndex);
}

function regenerateLinesAndLabels(groupIndex) {
  const pts = pointGroups[groupIndex];
  const oldLines = lineGroups[groupIndex];
  const oldLabels = labelGroups[groupIndex];
  const oldTotal = totalLabels[groupIndex];

  // 🧹 Xoá line cũ
  oldLines?.forEach(line => {
    rulerGroup.remove(line);
    line.geometry?.dispose?.();
    line.material?.dispose?.();
  });

  // 🧹 Xoá label cũ
  oldLabels?.forEach(lbl => {
    rulerGroup.remove(lbl);
  });

  // 🧹 Xoá tổng label
  if (oldTotal) {
    rulerGroup.remove(oldTotal);
    totalLabels[groupIndex] = null;
  }

  // ✅ Clear mảng
  lineGroups[groupIndex] = [];
  labelGroups[groupIndex] = [];

  // ✅ Vẽ lại line và label
  const worldPoints = pts.map(p => p.clone().add(originPoint));
  let totalLength = 0;

  for (let i = 0; i < pts.length - 1; i++) {
    const start = pts[i];
    const end = pts[i + 1];
  
    const { mesh } = drawMeasureLine(start, end, 0.05, rulerGroup, 'polyline', groupIndex);
    updateLineThickness(mesh, cameraRef); // 👈 thêm dòng này
    lineGroups[groupIndex].push(mesh);
  
    const mid = start.clone().lerp(end, 0.5);
    const dist = worldPoints[i].distanceTo(worldPoints[i + 1]);
    const label = createLabel(`${dist.toFixed(2)} m`, mid, groupIndex, rulerGroup);
    labelGroups[groupIndex].push(label);
    totalLength += dist;
  }
  
  const center = computeCentroid(worldPoints).sub(originPoint);
  const totalLabel = createLabel(`Tổng chiều dài: ${totalLength.toFixed(2)} m`, center, groupIndex, rulerGroup);
  totalLabels[groupIndex] = totalLabel;
  rulerGroup.add(totalLabel);

  // 🧹 Cleanup orphan lines
  const validLineSet = new Set(lineGroups[groupIndex]);
  rulerGroup.children.forEach(child => {
    if (
      child.userData.isPolyline &&
      child.userData.type === 'polyline' &&
      child.userData.groupIndex === groupIndex &&
      !validLineSet.has(child)
    ) {
      rulerGroup.remove(child);
      child.geometry?.dispose?.();
      child.material?.dispose?.();
    }
  });

  // 🧹 Cleanup orphan labels
  const validLabelSet = new Set(labelGroups[groupIndex]);
  if (totalLabels[groupIndex]) validLabelSet.add(totalLabels[groupIndex]);

  rulerGroup.children.forEach(child => {
    if (
      child instanceof CSS2DObject &&
      child.userData.isPolylineLabel &&
      child.userData.groupIndex === groupIndex &&
      !validLabelSet.has(child)
    ) {
      rulerGroup.remove(child);
    }
  });
}

// === Vẽ các thành phần ===

function drawRightTriangle(p1Sphere, p2Sphere) {
  const p1 = p1Sphere.position;
  const p2 = p2Sphere.position;

  const p1World = p1.clone().add(originPoint);
  const p2World = p2.clone().add(originPoint);
  const p1VN = convertToEPSG(p1World.x, p1World.y, p1World.z);
  const p2VN = convertToEPSG(p2World.x, p2World.y, p2World.z);
  const p3VN = new THREE.Vector3(p2VN.x, p2VN.y, p1VN.z);
  const p3World = convertToECEF(p3VN.x, p3VN.y, p3VN.z);
  const p3 = p3World.clone().sub(originPoint);

  const line1 = drawMeasureLine(p1, p3, 0.05, rulerGroup, 'triangle');
  const line2 = drawMeasureLine(p3, p2, 0.05, rulerGroup, 'triangle');
  const line3 = drawMeasureLine(p1, p2, 0.05, rulerGroup, 'triangle');
  
  const label1Pos = offsetLabelAwayFromThirdPoint(p1, p3, p2, 1.0);
  const label2Pos = offsetLabelAwayFromThirdPoint(p3, p2, p1, 1.0);
  const label3Pos = offsetLabelAwayFromThirdPoint(p1, p2, p3, 1.2);

  const label1 = createLabel(`${p1.distanceTo(p3).toFixed(2)} m`, label1Pos, null, rulerGroup);
  const label2 = createLabel(`${p3.distanceTo(p2).toFixed(2)} m`, label2Pos, null, rulerGroup);
  const label3 = createLabel(`${p1.distanceTo(p2).toFixed(2)} m`, label3Pos, null, rulerGroup);
  
  const leader1 = createLeaderLine(p1.clone().lerp(p3, 0.5), label1Pos, rulerGroup);
  const leader2 = createLeaderLine(p3.clone().lerp(p2, 0.5), label2Pos, rulerGroup);
  const leader3 = createLeaderLine(p1.clone().lerp(p2, 0.5), label3Pos, rulerGroup);

  const rightAngleMesh = drawRightAngleSymbol(p1, p2, p3);
  if (rightAngleMesh) {
    rulerGroup.add(rightAngleMesh);
  }

  return {
    p1: p1Sphere,
    p2: p2Sphere,
    lines: [line1, line2, line3],
    labels: [label1, label2, label3],
    leaders: [leader1, leader2, leader3],
    rightAngleMesh
  };
}

export function drawRightAngleSymbol(p1, p2, p3) {
  const dir1 = new THREE.Vector3().subVectors(p1, p3);
  const dir2 = new THREE.Vector3().subVectors(p2, p3);

  const len1 = dir1.length();
  const len2 = dir2.length();

  // Nếu cạnh quá ngắn (dưới 1m) thì không vẽ
  const minLength = 0.5;
  if (len1 < minLength || len2 < minLength) return null;

  const n1 = dir1.clone().normalize();
  const n2 = dir2.clone().normalize();

  const scale = Math.min(len1, len2) * 0.2;

  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(scale, 0);
  shape.lineTo(scale, scale);
  shape.lineTo(0, scale);
  shape.lineTo(0, 0);

  const geometry = new THREE.ShapeGeometry(shape);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffa500,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    depthTest: false,
  });

  const mesh = new THREE.Mesh(geometry, material);

  const zAxis = new THREE.Vector3().crossVectors(n2, n1).normalize();
  const xAxis = n1;
  const yAxis = n2;

  const matrix = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
  matrix.setPosition(p3);
  mesh.applyMatrix4(matrix);

  return mesh;
}

// function createSphere(localPosition) {
//   if (!cameraRef) return null;

//   const worldPos = localPosition.clone().add(originPoint || new THREE.Vector3());
//   const distance = cameraRef.position.distanceTo(worldPos);
//   const radius = THREE.MathUtils.clamp(Math.log10(distance + 1) * 0.1, 0.05, 0.5);

//   const sphere = new THREE.Mesh(
//     new THREE.SphereGeometry(radius, 16, 16),
//     new THREE.MeshBasicMaterial({
//       color: 0xff0000,
//       depthTest: false,
//     })
//   );
//   sphere.raycast = THREE.Mesh.prototype.raycast; // ✅ giữ raycast

//   sphere.position.copy(localPosition);
//   sphere.userData.isRulerSphere = true;

//   // ✅ Quan trọng: đảm bảo được raycast
//   sphere.raycast = THREE.Mesh.prototype.raycast;

//   return sphere;
// }

// === Cập nhật theo camera ===
function updateAllMeasurements() {
  for (const m of measurements) {
    const p1 = m.p1.position;
    const p2 = m.p2.position;

    const p1World = p1.clone().add(originPoint);
    const p2World = p2.clone().add(originPoint);
    const p1VN = convertToEPSG(p1World.x, p1World.y, p1World.z);
    const p2VN = convertToEPSG(p2World.x, p2World.y, p2World.z);
    const p3VN = new THREE.Vector3(p2VN.x, p2VN.y, p1VN.z);
    const p3World = convertToECEF(p3VN.x, p3VN.y, p3VN.z);
    const p3 = p3World.clone().sub(originPoint);

    updateLineTransform(m.lines[0].mesh, p1, p3);
    updateLineTransform(m.lines[1].mesh, p3, p2);
    updateLineTransform(m.lines[2].mesh, p1, p2);

    const label1Pos = offsetLabelAwayFromThirdPoint(p1, p3, p2, 1.0);
    const label2Pos = offsetLabelAwayFromThirdPoint(p3, p2, p1, 1.0);
    const label3Pos = offsetLabelAwayFromThirdPoint(p1, p2, p3, 1.2);

    updateLabel(m.labels[0], `${p1.distanceTo(p3).toFixed(2)} m`, label1Pos);
    updateLabel(m.labels[1], `${p3.distanceTo(p2).toFixed(2)} m`, label2Pos);
    updateLabel(m.labels[2], `${p1.distanceTo(p2).toFixed(2)} m`, label3Pos);

    updateLeaderLine(m.leaders[0], p1.clone().lerp(p3, 0.5), label1Pos);
    updateLeaderLine(m.leaders[1], p3.clone().lerp(p2, 0.5), label2Pos);
    updateLeaderLine(m.leaders[2], p1.clone().lerp(p2, 0.5), label3Pos);
    if (m.rightAngleMesh) {
      rulerGroup.remove(m.rightAngleMesh);
      m.rightAngleMesh.geometry.dispose();
      m.rightAngleMesh.material.dispose();
      m.rightAngleMesh = null;
    }
    
    const newRightAngle = drawRightAngleSymbol(p1, p2, p3);
    if (newRightAngle) {
      rulerGroup.add(newRightAngle);
      m.rightAngleMesh = newRightAngle;
    }
    
    
  }
}

function updateSphereScales(spheres, camera) {
  const cameraPos = camera.position;
  const tempVec = new THREE.Vector3();
  const lerpFactor = 0.2;

  for (const sphere of spheres) {
    if (!sphere.userData) continue;

    // Cập nhật scale mượt theo khoảng cách camera + hiệu ứng hover
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

    // Cập nhật màu mượt
    sphere.userData.currentColor.lerp(sphere.userData.targetColor, lerpFactor);
    sphere.material.color.copy(sphere.userData.currentColor);
  }
}


function updatePreviewLine(event) {
  if (!rulerEnabled || pointGroups.length === 0) return;

  const currentPoints = pointGroups.at(-1);
  if (currentPoints.length === 0) return;

  const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera({ x: mouseX, y: mouseY }, cameraRef);

  const intersects = raycaster.intersectObjects(
    collectVisibleMeshes(rulerGroup.parent, rulerGroup), true
  );
  if (intersects.length === 0) return;

  const hit = intersects[0].point.clone();
  const localStart = currentPoints[currentPoints.length - 1].clone();
  const localEnd = hit.clone().sub(originPoint);

  if (!previewLine) {
    const groupIndex = pointGroups.length - 1;
    previewLine = drawMeasureLine(localStart, localEnd, 0.05, rulerGroup, 'polyline', groupIndex);

  } else {
    updateLineTransform(previewLine.mesh, localStart, localEnd);
  }

  const mid = localStart.clone().lerp(localEnd, 0.5);
  const distance = localStart.clone().add(originPoint).distanceTo(hit);

  if (!previewLabel) {
    const groupIndex = pointGroups.length - 1;
    previewLabel = createLabel(`${distance.toFixed(2)} m`, mid, groupIndex, rulerGroup);

  } else {
    updateLabel(previewLabel, `${distance.toFixed(2)} m`, mid);
  }
}

function updateAllLineScales(camera) {
  measurements.forEach(m => {
    m.lines.forEach(line => {
      if (line?.mesh?.geometry?.parameters?.height) {
        updateLineThickness(line.mesh, camera);
      }
    });
  });

  if (previewLine?.mesh?.geometry?.parameters?.height) {
    updateLineThickness(previewLine.mesh, camera);
  }
}

// === Bật/Tắt ===
export function activateRuler() {
  rulerEnabled = true;                // ✅ cho phép thêm điểm mới
  rulerInteractionEnabled = true;     // ✅ cho phép kéo/sửa các điểm cũ
}


export function deactivateRuler() {
  rulerEnabled = false;             // ❌ không cho thêm điểm mới
  rulerInteractionEnabled = true;  // ✅ vẫn cho tương tác kéo điểm

  draggingSphere = null;
  highlightedSphere = null;
}

function createClearRulerButton() {
  if (document.getElementById('ruler-clear-button')) return;

  const btn = document.createElement('div');
  btn.id = 'ruler-clear-button';
  btn.classList.add('circle-button');
  btn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
  btn.addEventListener('click', () => {
    clearAllRulerMeasurements();
    btn.remove();
  });

  document.body.appendChild(btn);
}

function clearAllRulerMeasurements() {
  // 🧹 Xoá tất cả mesh & label
  rulerGroup.children.slice().forEach(child => {
    rulerGroup.remove(child);
    child.geometry?.dispose?.();
    child.material?.dispose?.();
  });

  // 🧹 Xoá các label CSS
  rulerGroup.children.slice().forEach(child => {
    if (child instanceof CSS2DObject) rulerGroup.remove(child);
  });

  // 🧼 Reset tất cả dữ liệu
  allSpheres.length = 0;
  measurements.length = 0;
  pointGroups.length = 0;
  sphereGroups.length = 0;
  lineGroups.length = 0;
  labelGroups.length = 0;
  totalLabels.length = 0;
  hoverableSpheres.length = 0;
  previewLine = null;
  previewLabel = null;
  previewLine1 = null;
  previewLabel1 = null;
  polygonAreaLabel = null;
  polygonMesh = null;
  finalized = false;
}
