import * as THREE from 'three'
import gsap from 'gsap';
import { convertToEPSG, convertToECEF } from './three-convertCoor';
import { centerCameraTiles, centerECEFTiles } from './three-3dtilesModel';
import { centerECEF, cameraECEF } from './three-gltfModel';
import { resetHighlight, applyHighlight } from '../utils/highlighUtils';
let previousObjects = [];
let previousColors = new Map();
let selectedObjects = [];
function addSelectedObject( object ) {
  selectedObjects = [object];
}

export function resizeScreen (camera, renderer, labelRenderer, effectFXAA, composer) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
  labelRenderer.setSize( window.innerWidth, window.innerHeight );
  effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

export function onMouseMove( event, raycaster, camera, obj3d, outlinePass ) {
  // event.preventDefault();
  const coords = new THREE.Vector2();
  coords.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  coords.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  raycaster.setFromCamera(coords, camera);
  const intersects = raycaster.intersectObjects(obj3d.children);
  if (intersects.length > 0) {
    addSelectedObject(intersects[0].object);
  } else {
    selectedObjects = [];
  }

  if (outlinePass) {
    outlinePass.selectedObjects = selectedObjects;
  }
};

// Zoome Gsap
export function zoomAt (target, newPos, camera, controls) {
	gsap.to( camera.position, {
		duration: 1,
		x: newPos.x,
		y: newPos.y,
		z: newPos.z,
	} );

	gsap.to( controls.target, {
		duration: 1,
		x: target.x,
		y: target.y,
		z: target.z,
	} );
};

export function findProjectPosition (camera, controls) {
  if (centerECEF && cameraECEF) {
    zoomAt(centerECEF, cameraECEF, camera, controls);
  } else if (centerECEFTiles && centerCameraTiles) {
    zoomAt(centerECEFTiles, centerCameraTiles, camera, controls);
  }
}

export function zoomTarget(event, raycaster, scene, camera, controls) {
  event.preventDefault();

  const coords = new THREE.Vector2();
  coords.x = (event.clientX / window.innerWidth) * 2 - 1;
  coords.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(coords, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  if (!intersects.length) return;
  const object = intersects[0].object;
  const parentType = object.parent?.type;

  resetHighlight(); // 🧹 xóa highlight cũ

  // ✅ Nếu là point do người dùng thêm thủ công
  if (object.userData?.type === 'point') {
    const target = object.position.clone();
    const direction = camera.position.clone().sub(target).normalize();
    const newPos = target.clone().add(direction.multiplyScalar(10.0));
    zoomAt(target, newPos, camera, controls);
    return;
  }

  if (parentType === "Group") {
    // Tiles3D hoặc group lớn
    const target = intersects[0].point;
    const cameraPosition = camera.position.clone();
    const distance = cameraPosition.sub(target);
    const direction = distance.normalize();
    const offset = distance.clone().sub(direction.multiplyScalar(15.0));
    const newPos = target.clone().sub(offset);
    zoomAt(target, newPos, camera, controls);
  } else {
    // GLTF model
    const mesh = object;
    const objIdAttr = mesh.geometry?.attributes?.objectId;
    const colorAttr = mesh.geometry?.attributes?.color;
    const faceIndex = intersects[0].face?.a;

    const objId = applyHighlight(mesh, objIdAttr, colorAttr, faceIndex, scene);

    if (objId === null) return;

    const meta = mesh.userData.metadata?.find(obj => obj.id === objId);
    if (meta) {
      zoomGltf(meta, camera, controls);
    }
  }
}

export function zoomGltf(meta, camera, controls, padding = 1.2) {
  const center = meta.center;
  const size = meta.size;

  const centerECEF = convertToECEF(center.x, center.y, center.z);
  const maxDim = Math.max(size.x, size.y, size.z);

  const fov = camera.fov * (Math.PI / 180); // đổi sang radian
  const distance = (maxDim / 2) / Math.tan(fov / 2) * padding;
  const direction = camera.getWorldDirection(new THREE.Vector3()).negate(); // hướng ra sau
  const newCameraPos = centerECEF.clone().add(direction.multiplyScalar(distance));

  zoomAt(centerECEF, newCameraPos, camera, controls);
}

export function getCoordinate (event, raycaster, scene, camera) {
  const coords = new THREE.Vector3();
  coords.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  coords.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  raycaster.setFromCamera(coords, camera);
  const intersects = raycaster.intersectObjects(scene.children);
  if(intersects.length > 0){
    const p = intersects[0].point;
    const pEPSG = convertToEPSG(p.x, p.y, p.z)
    console.log('Tọa độ:',pEPSG.x, pEPSG.y, pEPSG.z);
    // console.log('Đang chọn:', intersects[0].object)
  }
}

