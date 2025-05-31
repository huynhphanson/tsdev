import * as THREE from 'three';
import proj4 from 'proj4';
import { currentEPSG } from './three-coordConfig';

// 2️⃣ Hàm chuyển đổi từng vertex trong GLTF từ VN-2000 → ECEF
export function convertToECEF(x, y, z = 0) {
  
  const pointcloudProjection = proj4(`${currentEPSG}`);
  const mapProjection = proj4.defs('WGS84');
  const toMap = proj4(pointcloudProjection, mapProjection);
  // Chuyển VN-2000 → WGS84
  const [lon, lat] = toMap.forward([x, y]);
  const height = z;

  // Chuyển từ WGS84 → ECEF
  const ecef = Cesium.Cartesian3.fromDegrees(lon, lat, height);

  // Chuyển từ ECEF về hệ local (Cesium - Three.js)
  const matrix = Cesium.Transforms.eastNorthUpToFixedFrame(ecef);
  return new THREE.Vector3(matrix[12], matrix[13], matrix[14]);
}

export function convertToEPSG(ecefX, ecefY, ecefZ) {

  const cartesian = new Cesium.Cartesian3(ecefX, ecefY, ecefZ);
  const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
  
  const lon = Cesium.Math.toDegrees(cartographic.longitude);
  const lat = Cesium.Math.toDegrees(cartographic.latitude);
  const height = cartographic.height;

  const pointcloudProjection = proj4(`${currentEPSG}`);
  const mapProjection = proj4.defs('WGS84');
  const toVN2000 = proj4(mapProjection, pointcloudProjection);
  const [x, y] = toVN2000.forward([lon, lat]);

  return new THREE.Vector3(x, y, height) ;
}

export function getECEFTransformFromEPSG(x, y, z) {
  const [lon, lat] = proj4(`${currentEPSG}`, 'WGS84', [x, y]);
  const rawECEF = Cesium.Cartesian3.fromDegrees(lon, lat, z);
  const matrix = Cesium.Transforms.eastNorthUpToFixedFrame(rawECEF);

  return {
    ecef: new THREE.Vector3(rawECEF.x, rawECEF.y, rawECEF.z),
    rawECEF, // thêm nếu cần dùng với Cesium
    matrix: new THREE.Matrix4().set(
      matrix[0], matrix[4], matrix[8],  matrix[12],
      matrix[1], matrix[5], matrix[9],  matrix[13],
      matrix[2], matrix[6], matrix[10], matrix[14],
      matrix[3], matrix[7], matrix[11], matrix[15]
    )
  };
}
