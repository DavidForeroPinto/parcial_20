// public/js/ui/ui.js
export function renderItems(items, tableBody) {
  tableBody.innerHTML = "";
  items.forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.model}</td>
      <td>$${Number(item.price).toLocaleString()}</td>
      <td>${item.year}</td>
      <td>${item.color}</td>
      <td>
        <button class="btn-edit" data-id="${item.id}">Editar</button>
        <button class="btn-delete" data-id="${item.id}">Eliminar</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

export function resetForm(form, submitBtn) {
  form.reset();
  if (submitBtn) submitBtn.textContent = "Agregar Carro";
  form.querySelectorAll(".input-error").forEach(el => el.classList.remove("input-error"));
}

export function fillForm(form, item, submitBtn) {
  form.querySelector("#name").value = item.name || "";
  form.querySelector("#model").value = item.model || "";
  form.querySelector("#price").value = item.price !== undefined ? item.price : "";
  form.querySelector("#year").value = item.year !== undefined ? item.year : "";
  form.querySelector("#color").value = item.color || "";
  form.querySelector("#imageUrl").value = item.imageUrl || "";
  form.querySelector("#description").value = item.description || "";
  if (submitBtn) submitBtn.textContent = "Guardar cambios";
}
