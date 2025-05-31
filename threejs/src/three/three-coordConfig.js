import proj4 from 'proj4';

proj4.defs('EPSG:9217',
  '+proj=tmerc +lat_0=0 +lon_0=108.25 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-191.90441429,-39.30318279,-111.45032835,-0.00928836,0.01975479,-0.00427372,0.252906278 +units=m +no_defs +type=crs');
 proj4.defs('EPSG:9210',
  '+proj=tmerc +lat_0=0 +lon_0=105.75 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-191.90441429,-39.30318279,-111.45032835,-0.00928836,0.01975479,-0.00427372,0.252906278 +units=m +no_defs +type=crs'); 

export const COORD_SYSTEMS = {
  'EPSG:9217': {
    label: 'VN-2000/TM-3 108°15’',
    epsg: 'EPSG:9217'
  },
  'EPSG:9210': {
    label: 'VN-2000/TM-3 105°45’',
    epsg: 'EPSG:9210'
  },
  // thêm các hệ khác nếu cần
};

export const currentEPSG = 'EPSG:9217';

export function getEPSGLabel() {
  const config = COORD_SYSTEMS[currentEPSG];
  return config
    ? { label: config.label, epsg: config.epsg }
    : { label: 'Unknown', epsg: currentEPSG };
}
