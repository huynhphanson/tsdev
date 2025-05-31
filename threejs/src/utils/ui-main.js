import * as THREE from 'three';


const iconButtons = document.querySelectorAll('.menu-btn');
const panels = document.querySelectorAll('.panel')

// Nếu click vào vùng UI sẽ không kích hoạt các chức năng khác
export function isClickOnUI(event) {
  const uiAreas = ['.sidenav-right', '.info-panel']; // các vùng muốn bỏ qua
  return uiAreas.some(selector => {
    const el = document.querySelector(selector);
    return el && el.contains(event.target);
  });
}

// Lọc qua các nút, ấn nút nào sẽ hiện bảng thông tin lên
if (!window._menuEventsBound) {
  window._menuEventsBound = true;

  iconButtons.forEach(button => {
    button.addEventListener('click', () => {
      const panelId = button.getAttribute('data-panel');
      const panel = document.getElementById(panelId);
      if (!panel) return;

      const isActive = panel.classList.contains('active');
      if (isActive) {
        button.classList.remove('i-active');
        panel.classList.remove('active');
        return;
      }

      iconButtons.forEach(btn => btn.classList.remove('i-active'));
      panels.forEach(p => p.classList.remove('active'));

      button.classList.add('i-active');
      panel.classList.add('active');
    });
  });
}


// Export function để khi click ra ngoài màn hình (ngoại trùng vùng model) thì bảng thuộc tính sẽ tắt, cần phải export để raycaster clearInfoTable vào trong main.js
export function clearInfoTable (event, raycaster, scene, camera) {
  
  const isClickInIcon = event.target.closest(".icon-bar-right");
  const isClickInPanel = event.target.closest(".panel");

  const coords = new THREE.Vector3();
  coords.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  coords.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

  // Bắn tia raycaster từ camera
  raycaster.setFromCamera(coords, camera);

  // Kiểm tra xem có chạm object nào không
  const intersects = raycaster.intersectObjects(scene.children, true); // true = tìm sâu trong Group

  const isClickOnModel = intersects.length > 0;

  if (!isClickInIcon && !isClickInPanel && !isClickOnModel) {
    panels.forEach(p => p.classList.remove("active"));
    iconButtons.forEach(btn => btn.classList.remove('i-active'));
  }
};

