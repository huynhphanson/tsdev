import * as THREE from 'three';
import { outlinePass } from "../three/three-outline";

let currentOutlineMesh = null;

export function applyHighlight(mesh, objIdAttr, colorAttr, faceIndex, scene) {
  let objId = null;

  // === Trường hợp mặc định: mesh có objectIdAttr → dùng logic gốc ===
  if (objIdAttr && faceIndex !== undefined) {
    objId = objIdAttr.array[faceIndex];

    if (currentOutlineMesh) {
      scene.remove(currentOutlineMesh);
      currentOutlineMesh.geometry.dispose();
      currentOutlineMesh.material.dispose();
      currentOutlineMesh = null;
    }

    const index = mesh.geometry.index.array;
    const objectId = objIdAttr.array;
    const indices = [];

    for (let i = 0; i < index.length; i += 3) {
      const a = index[i], b = index[i + 1], c = index[i + 2];
      if (objectId[a] === objId && objectId[b] === objId && objectId[c] === objId) {
        indices.push(a, b, c);
      }
    }

    const outlineGeom = new THREE.BufferGeometry();
    outlineGeom.setAttribute('position', mesh.geometry.attributes.position);
    outlineGeom.setIndex(indices);
    outlineGeom.computeBoundingSphere();

    const outlineMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide });

    currentOutlineMesh = new THREE.Mesh(outlineGeom, outlineMat);
    currentOutlineMesh.frustumCulled = false;
    currentOutlineMesh.matrixAutoUpdate = false;
    currentOutlineMesh.scale.set(1.01, 1.01, 1.01);
    currentOutlineMesh.renderOrder = 999;
    currentOutlineMesh.matrix.copy(mesh.matrixWorld);
    currentOutlineMesh.matrixWorld.copy(mesh.matrixWorld);
    scene.add(currentOutlineMesh);

    if (outlinePass) {
      outlinePass.selectedObjects = [currentOutlineMesh];
    }

    return objId;
  }

  // === Trường hợp mesh không có objectIdAttr → dùng full geometry (tube, sphere) ===
  if (mesh.userData.highlightId) {
    objId = mesh.userData.highlightId;

    if (currentOutlineMesh) {
      scene.remove(currentOutlineMesh);
      currentOutlineMesh.geometry.dispose();
      currentOutlineMesh.material.dispose();
      currentOutlineMesh = null;
    }

    const outlineGeom = mesh.geometry.clone();
    const outlineMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide });

    currentOutlineMesh = new THREE.Mesh(outlineGeom, outlineMat);
    currentOutlineMesh.frustumCulled = false;
    currentOutlineMesh.matrixAutoUpdate = false;
    currentOutlineMesh.scale.set(1.01, 1.01, 1.01);
    currentOutlineMesh.renderOrder = 999;
    currentOutlineMesh.matrix.copy(mesh.matrixWorld);
    currentOutlineMesh.matrixWorld.copy(mesh.matrixWorld);
    scene.add(currentOutlineMesh);

    if (outlinePass) {
      outlinePass.selectedObjects = [currentOutlineMesh];
    }

    return objId;
  }

  return null;
}


export function resetHighlight() {
  if (outlinePass) {
    outlinePass.selectedObjects = [];
  }

  if (currentOutlineMesh) {
    currentOutlineMesh.parent?.remove(currentOutlineMesh);
    currentOutlineMesh.geometry.dispose();
    currentOutlineMesh.material.dispose();
    currentOutlineMesh = null;
  }
}
