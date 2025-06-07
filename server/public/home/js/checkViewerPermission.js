export function initViewerAccessCheck() {
  document.querySelectorAll('.open-viewer').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();

      const client = this.dataset.client;
      const slug = this.dataset.slug;
      const url = `/api/configs/${client}/${slug}`;
      const viewerURL = this.href;

      fetch(url, { method: 'GET', credentials: 'include' })
        .then(res => {
          if (res.ok) {
            window.open(viewerURL, '_blank');
          } else if (res.status === 403) {
            showPopup('❌ Bạn không có quyền truy cập mô hình này!');
          } else if (res.status === 404) {
            showPopup('⚠️ Mô hình không tồn tại!');
          } else {
            showPopup('⚠️ Đã xảy ra lỗi khi kiểm tra quyền.');
          }
        })
        .catch(() => showPopup('⚠️ Không thể kết nối tới máy chủ!'));
    });
  });
}

function showPopup(msg) {
  const popup = document.createElement('div');
  popup.innerText = msg;
  Object.assign(popup.style, {
    position: 'fixed',
    top: '30%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: '#222',
    color: '#fff',
    padding: '1.5rem 2rem',
    borderRadius: '12px',
    fontSize: '1.1rem',
    zIndex: 10000
  });
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 3000);
}
