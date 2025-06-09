export function initViewerAccessCheck() {
  document.querySelectorAll('.open-viewer').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();

      const viewerURL = this.href;
      fetch(viewerURL, { method: 'HEAD', credentials: 'include' })
        .then(res => {
          if (res.ok) {
            window.open(viewerURL, '_blank');
          } else if (res.status === 403) {
            showPopup('Bạn không có quyền truy cập mô hình này!', 'error');
          } else if (res.status === 423) {
            showPopup('Mô hình đang phát triển', 'info');
          } else {
            showPopup('Lỗi không xác định!', 'warning');
          }
        })
        .catch(() => showPopup('Không thể kết nối tới máy chủ!', 'warning'));
    });
  });
}

function showPopup(msg, type = 'error') {
  const popup = document.createElement('div');
  popup.className = `viewer-popup ${type}`;
  popup.innerText = msg;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 1500);
}
