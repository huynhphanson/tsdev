import { setBasemap } from "../cesium/cesium-init";
import { getViewer } from "../cesium/cesium-viewer";

document.querySelectorAll('.basemap-item').forEach(item => {
  item.addEventListener('click', () => {
    // Xóa trạng thái selected cũ
    document.querySelectorAll('.basemap-item').forEach(i => i.classList.remove('selected'));
    item.classList.add('selected');

    // Gọi setBasemap phù hợp
    const type = item.getAttribute('data-type');
    const cesiumViewer = getViewer()
    setBasemap(type, cesiumViewer);
  });
});