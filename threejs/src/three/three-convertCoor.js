import * as THREE from 'three';
import proj4 from 'proj4';
import { getCurrentEPSG  } from './three-coordConfig';

// 2️⃣ Hàm chuyển đổi từng vertex trong GLTF từ VN-2000 → ECEF
export function convertToECEF(x, y, z = 0) {
  const epsg = getCurrentEPSG(); // 🔄 lấy giá trị động mới nhất
  const pointcloudProjection = proj4(`${epsg}`);
  const mapProjection = proj4.defs('WGS84');
  const toMap = proj4(pointcloudProjection, mapProjection);

  const [lon, lat] = toMap.forward([x, y]);
  const height = z;

  const ecef = Cesium.Cartesian3.fromDegrees(lon, lat, height);
  const matrix = Cesium.Transforms.eastNorthUpToFixedFrame(ecef);

  return new THREE.Vector3(matrix[12], matrix[13], matrix[14]);
}


export function convertToEPSG(ecefX, ecefY, ecefZ) {
  const epsg = getCurrentEPSG();
  const cartesian = new Cesium.Cartesian3(ecefX, ecefY, ecefZ);
  const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
  
  const lon = Cesium.Math.toDegrees(cartographic.longitude);
  const lat = Cesium.Math.toDegrees(cartographic.latitude);
  const height = cartographic.height;

  const pointcloudProjection = proj4(`${epsg}`);
  const mapProjection = proj4.defs('WGS84');
  const toVN2000 = proj4(mapProjection, pointcloudProjection);
  const [x, y] = toVN2000.forward([lon, lat]);

  return new THREE.Vector3(x, y, height) ;
}

export function getECEFTransformFromEPSG(x, y, z) {
  const epsg = getCurrentEPSG();
  const [lon, lat] = proj4(`${epsg}`, 'WGS84', [x, y]);
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
