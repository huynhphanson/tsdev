export function setupUserDelete() {
  const modal = document.getElementById('confirmDeleteModal');
  const confirmBtn = document.getElementById('confirmDeleteBtn');
  const cancelBtn = document.getElementById('cancelDeleteBtn');
  let selectedBtn = null;

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedBtn = btn;
      modal.style.display = 'flex';
    });
  });

  confirmBtn.addEventListener('click', async () => {
    if (!selectedBtn) return;
    const id = selectedBtn.dataset.id;
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });

    if (res.status === 204) {
      selectedBtn.closest('tr').remove();
    } else {
      alert('Xoá thất bại');
    }

    modal.style.display = 'none';
    selectedBtn = null;
  });

  cancelBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    selectedBtn = null;
  });
}
