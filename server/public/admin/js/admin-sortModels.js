// sortModels.js
import Sortable from 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/+esm';

export function initSortableGallery(gallerySelector = '#gallery') {
  const gallery = document.querySelector(gallerySelector);
  if (!gallery) return;

  new Sortable(gallery, {
    animation: 200,
    handle: '.card-image',
    ghostClass: 'sortable-ghost',
    onEnd: async () => {
      const order = [...gallery.children]
        .filter(el => el.classList.contains('card'))
        .map(el => el.dataset.id);

      try {
        const res = await fetch('/api/projects/order', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order })
        });
        if (!res.ok) throw new Error();
      } catch {
        alert('❌ Lỗi khi lưu thứ tự mô hình');
      }
    }
  });
}
