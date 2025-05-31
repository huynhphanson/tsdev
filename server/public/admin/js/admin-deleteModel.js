export function deleteModel(btn) {
  const client = btn.dataset.client;
  const slug = btn.dataset.slug;

  fetch(`/api/projects/${client}/${slug}`, {
    method: 'DELETE'
  }).then(res => {
    if (res.status === 204) {
      const card = btn.closest('.card');
      if (card) card.remove();
    } else {
      alert('Xoá thất bại');
    }
  });
}
