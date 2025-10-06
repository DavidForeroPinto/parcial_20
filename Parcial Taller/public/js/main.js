// public/js/main.js
import { getItems, getItem, createItem, updateItem, deleteItem } from "./services/api.js";
import { renderItems, resetForm, fillForm } from "./ui/ui.js";
import { loadCatalog } from "./catalog.js"; // importamos, pero NO ejecutamos hasta que el usuario pida ver catálogo

const form = document.getElementById("itemForm");
const tableBody = document.getElementById("itemsTable");
const submitBtn = document.getElementById("submitBtn");
let editingId = null;

// NAV
const navGestion = document.getElementById("navGestion");
const navCatalog = document.getElementById("navCatalog");
const gestionSection = document.getElementById("gestionSection");
const catalogSection = document.getElementById("catalogSection");

function showSection(section) {
  if (section === "gestion") {
    gestionSection.classList.add("active");
    catalogSection.classList.remove("active");
    navGestion.classList.add("active");
    navCatalog.classList.remove("active");
  } else {
    gestionSection.classList.remove("active");
    catalogSection.classList.add("active");
    navGestion.classList.remove("active");
    navCatalog.classList.add("active");
  }
}

// Eventos de la navbar
navGestion.addEventListener("click", (e) => { e.preventDefault(); showSection("gestion"); });
navCatalog.addEventListener("click", async (e) => { 
  e.preventDefault(); 
  showSection("catalog"); 
  await loadCatalog(); // cargo catálogo en el momento que el usuario lo solicita
});

// Delegación de eventos para editar/eliminar
tableBody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const id = Number(btn.dataset.id);

  if (btn.classList.contains("btn-delete")) {
    if (!confirm("¿Eliminar este carro?")) return;
    try {
      await deleteItem(id);
      await loadItems();
      // si estamos en catálogo, refrescarlo (por si el usuario lo dejó abierto)
      if (catalogSection.classList.contains("active")) await loadCatalog();
    } catch (err) {
      console.error(err);
      alert("Error eliminando item.");
    }
  } else if (btn.classList.contains("btn-edit")) {
    try {
      const item = await getItem(id);
      fillForm(form, item, submitBtn);
      editingId = id;
      showSection("gestion");
    } catch (err) {
      console.error(err);
      alert("Error cargando item.");
    }
  }
});

// Validaciones mínimas (visual)
function validateForm() {
  let ok = true;
  form.querySelectorAll("input[required]").forEach(inp => {
    inp.classList.toggle("input-error", !inp.value.trim());
    if (!inp.value.trim()) ok = false;
  });
  const price = Number(form.querySelector("#price").value);
  const year = Number(form.querySelector("#year").value);
  if (isNaN(price) || price <= 0) { form.querySelector("#price").classList.add("input-error"); ok = false; }
  if (isNaN(year) || year < 1900) { form.querySelector("#year").classList.add("input-error"); ok = false; }
  return ok;
}

// Envío form
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validateForm()) { alert("Corrige los campos en rojo."); return; }

  const body = {
    name: form.querySelector("#name").value.trim(),
    model: form.querySelector("#model").value.trim(),
    price: Number(form.querySelector("#price").value),
    year: Number(form.querySelector("#year").value),
    color: form.querySelector("#color").value.trim(),
    imageUrl: form.querySelector("#imageUrl").value.trim() || "/assets/images/default.jpg",
    description: form.querySelector("#description").value.trim()
  };

  try {
    if (editingId) {
      await updateItem(editingId, body);
      editingId = null;
    } else {
      await createItem(body);
    }
    resetForm(form, submitBtn);
    await loadItems();
    // refrescar catálogo si está visible
    if (catalogSection.classList.contains("active")) await loadCatalog();
  } catch (err) {
    console.error(err);
    alert("Error guardando item.");
  }
});

// Cargar lista de gestión
async function loadItems() {
  try {
    const items = await getItems();
    renderItems(items, tableBody);
  } catch (err) {
    console.error(err);
    alert("No se pudieron cargar los items.");
  }
}

// Inicializa
loadItems();
showSection("gestion");
