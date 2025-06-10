export async function setupCreateProject() {
  const form = document.getElementById('modelForm');
  const clientSelect = document.getElementById('clientSelect');
  const customClient = document.getElementById('customClient');
  const slugInput = document.getElementById('slugInput');
  const dropdown = document.getElementById('slugDropdown');

  let clientData = {};

  try {
    const res = await fetch("/api/model-meta/clients");
    clientData = await res.json(); // { general: [...], t27: [...] }

    // Render client list
    clientSelect.innerHTML = "";
    Object.keys(clientData).forEach(client => {
      const opt = document.createElement("option");
      opt.value = client;
      opt.textContent = client.toUpperCase();
      clientSelect.appendChild(opt);
    });
    const optNew = document.createElement("option");
    optNew.value = "__new";
    optNew.textContent = "+ Thêm khách hàng mới";
    clientSelect.appendChild(optNew);

    // Render slug dropdown
    function updateSlugDropdown(client, show = false) {
      const slugs = clientData[client] || [];
      dropdown.innerHTML = "";

      if (slugs.length === 0) {
        dropdown.style.display = "none";
        return;
      }

      slugs.forEach(slug => {
        const li = document.createElement("li");
        li.textContent = slug;
        li.className = "dropdown-item";
        li.addEventListener("click", () => {
          slugInput.value = slug;
          dropdown.style.display = "none";
        });
        dropdown.appendChild(li);
      });

      dropdown.style.display = show ? "block" : "none";
    }

    // Client select change
    clientSelect.addEventListener("change", () => {
      const selected = clientSelect.value;

      if (selected === "__new") {
        customClient.style.display = "block";
        slugInput.placeholder = "Nhập slug mô hình mới...";
        dropdown.style.display = "none";
      } else {
        customClient.style.display = "none";
        slugInput.placeholder = "Nhập hoặc chọn slug...";
        updateSlugDropdown(selected, false);
      }
    });

    // Show dropdown on focus
    slugInput.addEventListener("focus", () => {
      const selected = clientSelect.value;
      if (selected !== "__new") {
        updateSlugDropdown(selected, true);
      }
    });

    // Filter list on input
    slugInput.addEventListener("input", () => {
      const keyword = slugInput.value.toLowerCase();
      const items = dropdown.querySelectorAll("li");

      let hasMatch = false;
      items.forEach(li => {
        const visible = li.textContent.toLowerCase().includes(keyword);
        li.style.display = visible ? "block" : "none";
        if (visible) hasMatch = true;
      });

      dropdown.style.display = hasMatch ? "block" : "none";
    });

    // Hide dropdown when click outside
    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target) && e.target !== slugInput) {
        dropdown.style.display = "none";
      }
    });

    // Init client select
    clientSelect.dispatchEvent(new Event("change"));
  } catch (err) {
    console.error("Lỗi tải client/slug:", err);
  }

  // Submit form
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    if (clientSelect.value === '__new') {
      formData.set('client', customClient.value.trim());
    }

    const res = await fetch('/api/projects', {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      window.location.reload();
    } else {
      alert('Tạo mới thất bại');
    }
  });
}
