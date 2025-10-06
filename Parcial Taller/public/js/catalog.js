// public/js/catalog.js
import { getItems, getItem } from "./services/api.js";

let listenersAttached = false;

/** Helpers */
function formatPrice(p) {
  if (p === undefined || p === null) return "-";
  return `$${Number(p).toLocaleString()}`;
}
function escapeHtml(s) {
  if (!s && s !== 0) return "";
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Crea una card para un item */
function createCard(item) {
  const article = document.createElement("article");
  article.className = "card";
  article.dataset.id = item.id;

  article.innerHTML = `
    <div class="card-image" data-id="${item.id}">
      <img src="${escapeHtml(item.imageUrl || '/assets/images/default.jpg')}" 
           alt="${escapeHtml(item.name + ' ' + item.model)}" loading="lazy" />
      <div class="price-badge">${formatPrice(item.price)}</div>
      <div class="card-overlay">
        <button class="btn btn-details" data-id="${item.id}" type="button">Ver detalles</button>
      </div>
    </div>
    <div class="card-body">
      <h3 class="card-title">${escapeHtml(item.name)} ${escapeHtml(item.model)}</h3>
    </div>
  `;
  return article;
}

/** Llenar y mostrar el modal */
function fillAndShowModal(item) {
  const modal = document.getElementById("itemModal");
  if (!modal) return;

  document.getElementById("modalTitle").textContent = `${item.name} ${item.model}`;
  const img = document.getElementById("modalImage");
  img.src = item.imageUrl || "/assets/images/default.jpg";
  img.alt = `${item.name} ${item.model}`;
  document.getElementById("d_model").textContent = item.model || "";
  document.getElementById("d_price").textContent = formatPrice(item.price);
  document.getElementById("d_year").textContent = item.year || "";
  document.getElementById("d_color").textContent = item.color || "";
  document.getElementById("d_description").textContent = item.description || "";

  modal.classList.add("show");
  modal.style.display = "flex";
  modal.setAttribute("aria-hidden", "false");
}

/** Cerrar modal */
function closeModal() {
  const modal = document.getElementById("itemModal");
  if (!modal) return;
  modal.classList.remove("show");
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
}

/** Adjuntar listeners al contenedor y modal (solo una vez) */
function attachListeners(container) {
  if (listenersAttached) return;

  // Delegación de clicks para botones y cards
  container.addEventListener("click", async (e) => {
    const btn = e.target.closest(".btn-details");
    if (btn) {
      const id = Number(btn.dataset.id);
      try {
        const item = await getItem(id);
        fillAndShowModal(item);
      } catch {
        alert("No se pudo cargar el detalle.");
      }
      return;
    }

    const imgWrapper = e.target.closest(".card-image");
    if (imgWrapper) {
      const id = Number(imgWrapper.dataset.id);
      try {
        const item = await getItem(id);
        fillAndShowModal(item);
      } catch {
        alert("No se pudo cargar el detalle.");
      }
    }
  });

  // Botón cerrar modal
  const closeBtn = document.getElementById("closeModal");
  const modal = document.getElementById("itemModal");
  if (closeBtn) closeBtn.addEventListener("click", closeModal);

  // Clic fuera del contenido cierra modal
  if (modal) {
    modal.addEventListener("click", (ev) => {
      if (ev.target === modal) closeModal();
    });
  }

  // Escape cierra modal
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") closeModal();
  });

  listenersAttached = true;
}

/** PUBLIC: carga y pinta el catálogo */
export async function loadCatalog() {
  const container = document.getElementById("catalogContainer");
  if (!container) return;

  try {
    const items = await getItems();
    container.innerHTML = ""; // limpia
    items.forEach((item) => {
      const card = createCard(item);
      container.appendChild(card);
    });
    attachListeners(container);
  } catch (err) {
    console.error("Error loadCatalog:", err);
    container.innerHTML = `<p class="error">No se pudo cargar el catálogo.</p>`;
  }
}
