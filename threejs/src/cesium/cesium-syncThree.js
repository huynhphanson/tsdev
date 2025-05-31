import * as THREE from 'three';
import * as Cesium from 'cesium';

export function syncThreeToCesium(camera, controls, cesiumViewer) {
  {

    let pPos = new THREE.Vector3(0, 0, 0).applyMatrix4(camera.matrixWorld);
    let pRight = new THREE.Vector3(600, 0, 0).applyMatrix4(camera.matrixWorld);
    let pUp = new THREE.Vector3(0, 600, 0).applyMatrix4(camera.matrixWorld);
    let pTarget = controls.target;

    let toCes = (pos) => {
      let xy = [pos.x, pos.y];
      let height = pos.z;
      let deg = toMap.forward(xy);
      let cPos = Cesium.Cartesian3.fromDegrees(...deg, height);

      return cPos;
    };

    let cPos = new Cesium.Cartesian3(pPos.x, pPos.y, pPos.z);
    let cUpTarget = new Cesium.Cartesian3(pUp.x, pUp.y, pUp.z);
    let cTarget = new Cesium.Cartesian3(pTarget.x, pTarget.y, pTarget.z);

    let cDir = Cesium.Cartesian3.subtract(cTarget, cPos, new Cesium.Cartesian3());
    let cUp = Cesium.Cartesian3.subtract(cUpTarget, cPos, new Cesium.Cartesian3());

    cDir = Cesium.Cartesian3.normalize(cDir, new Cesium.Cartesian3());
    cUp = Cesium.Cartesian3.normalize(cUp, new Cesium.Cartesian3());

    cesiumViewer.camera.setView({
      destination : cPos,
      orientation : {
        direction : cDir,
        up : cUp
      }
    });
    
  }

  let aspect = camera.aspect;
  if(aspect < 1){
    let fovy = Math.PI * (camera.fov / 180);
    cesiumViewer.camera.frustum.fov = fovy;
  }else{
    let fovy = Math.PI * (camera.fov / 180);
    let fovx = Math.atan(Math.tan(0.5 * fovy) * aspect) * 2
    cesiumViewer.camera.frustum.fov = fovx;
  }
}