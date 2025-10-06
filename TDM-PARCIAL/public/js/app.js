/* =========================
   Utilidades iniciales
   ========================= */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const form = $('.form');
const formStatus = $('#formStatus');
const submitBtn = $('#submitBtn');

const fullName = $('#fullname');
const email = $('#email');
const phone = $('#phone');
const role = $('#role');
const terms = $('#terms');

const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* Scroll suave para enlaces internos (respeta reduced-motion) */
$$('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length > 1) {
      const target = $(id);
      if (target) {
        e.preventDefault();
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
        target.setAttribute('tabindex', '-1'); // foco accesible
        target.focus({ preventScroll: true });
      }
    }
  });
});

/* =========================
   Helpers de validación UI
   ========================= */
function getFieldWrapper(inputEl) {
  return inputEl.closest('.form-field') || inputEl.parentElement;
}
function getOrCreateErrorEl(inputEl) {
  const wrap = getFieldWrapper(inputEl);
  let err = wrap.querySelector('.field-error');
  if (!err) {
    err = document.createElement('small');
    err.className = 'field-error';
    err.style.color = 'var(--danger)';
    err.style.fontWeight = '600';
    err.style.marginTop = '.25rem';
    wrap.appendChild(err);
  }
  return err;
}
function clearError(inputEl) {
  const wrap = getFieldWrapper(inputEl);
  const err = wrap.querySelector('.field-error');
  if (err) err.textContent = '';
}
function setStateOK(inputEl) {
  inputEl.classList.remove('is-error');
  inputEl.classList.add('is-ok');
  inputEl.setAttribute('aria-invalid', 'false');
  clearError(inputEl);
}
function setStateError(inputEl, message) {
  inputEl.classList.remove('is-ok');
  inputEl.classList.add('is-error');
  inputEl.setAttribute('aria-invalid', 'true');
  const err = getOrCreateErrorEl(inputEl);
  err.textContent = message || 'Campo inválido';
}

/* =========================
   Reglas de validación
   ========================= */
const emailRegex =
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

function validateName() {
  const v = fullName.value.trim();
  if (v.length < 3) { setStateError(fullName, 'Ingresa tu nombre completo.'); return false; }
  setStateOK(fullName); return true;
}
function validateEmail() {
  const v = email.value.trim();
  if (!emailRegex.test(v)) { setStateError(email, 'Correo no válido.'); return false; }
  setStateOK(email); return true;
}
function validatePhone() {
  const v = phone.value.trim();
  if (!v) { phone.classList.remove('is-error','is-ok'); clearError(phone); return true; } // opcional
  const digits = v.replace(/\D/g, '');
  if (digits.length < 7) { setStateError(phone, 'Teléfono muy corto.'); return false; }
  setStateOK(phone); return true;
}
function validateRole() {
  if (!role.value) { setStateError(role, 'Selecciona una opción.'); return false; }
  setStateOK(role); return true;
}
function validateTerms() {
  if (!terms.checked) {
    // Para checkbox usamos el mensaje global
    formStatus.textContent = 'Debes aceptar la política de datos y términos.';
    formStatus.style.color = 'var(--danger)';
    terms.focus();
    return false;
  }
  return true;
}

function validateAll() {
  const checks = [validateName(), validateEmail(), validatePhone(), validateRole(), validateTerms()];
  return checks.every(Boolean);
}

/* Validación en vivo */
[fullName, email, phone, role].forEach(el => {
  el.addEventListener('input', () => {
    // revalida de forma ligera campo a campo
    switch (el) {
      case fullName: validateName(); break;
      case email: validateEmail(); break;
      case phone: validatePhone(); break;
      case role: validateRole(); break;
    }
    formStatus.textContent = '';
  });
});
terms.addEventListener('change', () => (formStatus.textContent = ''));

/* =========================
   Envío del formulario
   ========================= */
async function postOrSimulate(payload) {
  // Intenta POST real a /api/register (para cuando montes Node.js)
  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Fail');
    return await res.json();
  } catch {
    // Sin backend: simula una respuesta OK
    await new Promise(r => setTimeout(r, 700));
    return { ok: true, id: crypto.randomUUID() };
  }
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.style.opacity = isLoading ? 0.7 : 1;
  submitBtn.textContent = isLoading ? 'Enviando…' : 'Enviar inscripción';
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  formStatus.textContent = '';
  formStatus.removeAttribute('style');

  // Reset visual states
  [fullName, email, phone, role].forEach(el => el.classList.remove('is-ok','is-error'));

  if (!validateAll()) {
    // Lleva el foco al primer campo inválido
    const firstInvalid = [fullName, email, phone, role].find(el => el.classList.contains('is-error')) || (!terms.checked ? terms : null);
    if (firstInvalid) firstInvalid.focus();
    return;
  }

  const data = {
    fullname: fullName.value.trim(),
    email: email.value.trim(),
    phone: phone.value.trim(),
    role: role.value,
    message: $('#message')?.value.trim() || '',
    timestamp: new Date().toISOString()
  };

  setLoading(true);
  try {
    const resp = await postOrSimulate(data);
    if (resp?.ok) {
      formStatus.textContent = '¡Registro enviado! Revisa tu correo para la confirmación.';
      formStatus.style.color = 'var(--ok)';
      form.reset();
      // Limpia estados visuales tras reset
      [fullName, email, phone, role].forEach(el => el.classList.remove('is-ok','is-error'));
    } else {
      throw new Error('Respuesta no válida');
    }
  } catch (err) {
    formStatus.textContent = 'No se pudo enviar el registro. Inténtalo nuevamente en unos segundos.';
    formStatus.style.color = 'var(--danger)';
    console.error(err);
  } finally {
    setLoading(false);
  }
});

/* =========================
   Mejora: autoguardado ligero (por si recargan)
   ========================= */
const LS_KEY = 'curso-registro';
['input', 'change'].forEach(evt => {
  form.addEventListener(evt, () => {
    const snapshot = {
      fullname: fullName.value,
      email: email.value,
      phone: phone.value,
      role: role.value,
      message: $('#message')?.value || '',
      terms: terms.checked
    };
    localStorage.setItem(LS_KEY, JSON.stringify(snapshot));
  }, { passive: true });
});
window.addEventListener('DOMContentLoaded', () => {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    if (saved.fullname) fullName.value = saved.fullname;
    if (saved.email) email.value = saved.email;
    if (saved.phone) phone.value = saved.phone;
    if (saved.role) role.value = saved.role;
    if (saved.message) $('#message').value = saved.message;
    if (typeof saved.terms === 'boolean') terms.checked = saved.terms;
  } catch {}
});

