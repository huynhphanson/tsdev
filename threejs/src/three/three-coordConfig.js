import proj4 from 'proj4';
import { cos } from 'three/src/nodes/TSL.js';

proj4.defs('EPSG:9217',
  '+proj=tmerc +lat_0=0 +lon_0=108.25 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-191.90441429,-39.30318279,-111.45032835,-0.00928836,0.01975479,-0.00427372,0.252906278 +units=m +no_defs +type=crs');
 proj4.defs('EPSG:9210',
  '+proj=tmerc +lat_0=0 +lon_0=105.75 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-191.90441429,-39.30318279,-111.45032835,-0.00928836,0.01975479,-0.00427372,0.252906278 +units=m +no_defs +type=crs'); 

let currentEPSG = 'EPSG:9217';
let currentLabel = 'VN-2000/TM-3 108°15’';

/**
 * Gán mã EPSG và nhãn tương ứng từ config JSON
 * @param {string} epsgCode - mã EPSG (ví dụ: "EPSG:9217")
 * @param {string} label - nhãn hiển thị (ví dụ: "VN-2000/TM-3 108°15’")
 */
export function setEPSG(code, label = '') {
  currentEPSG = code;
  if (label) currentLabel = label;
}
export function getCurrentEPSG() {
  return currentEPSG;
}

export function getEPSGLabel() {
  return {
    label: currentLabel,
    epsg: currentEPSG
  };
}
