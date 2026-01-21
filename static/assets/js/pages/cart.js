import { formatMoneyKGS, qs } from "../lib/dom.js";
import { clearCart, getCartItems, getCartSubtotal, removeItem, setQty } from "../lib/cart.js";
import { initBaseUI } from "../lib/ui.js";
import { initReveal } from "../lib/reveal.js";
import { toast } from "../lib/toast.js";

initBaseUI();
initReveal();

render();

window.addEventListener("cart:change", render);

qs("[data-scroll-checkout]")?.addEventListener("click", () => {
  qs("[data-checkout]")?.scrollIntoView({ behavior: "smooth", block: "start" });
});

initForm();
initSuccessModal();

function render() {
  const wrap = qs("[data-cart-items]");
  const empty = qs("[data-cart-empty]");
  const subtotal = qs("[data-subtotal]");
  const total = qs("[data-total]");

  if (!wrap || !empty || !subtotal || !total) return;

  const items = getCartItems();

  empty.hidden = items.length !== 0;
  wrap.style.display = items.length ? "flex" : "none";

  wrap.innerHTML = "";
  items.forEach((it) => wrap.appendChild(renderItem(it)));

  const sum = getCartSubtotal();
  subtotal.textContent = formatMoneyKGS(sum);
  total.textContent = formatMoneyKGS(sum);

  updateSubmitState();
}

function renderItem(it) {
  const el = document.createElement("article");
  el.className = "cart-item";

  el.innerHTML = `
    <div class="cart-item__img"><img src="${it.image}" loading="lazy" decoding="async" alt="" /></div>
    <div>
      <p class="cart-item__title">${escapeHtml(it.title)}</p>
      <div class="cart-item__meta">${escapeHtml(it.size)} • ${escapeHtml(it.color)}</div>
      <div class="cart-item__meta">${formatMoneyKGS(it.price)}</div>
    </div>
    <div class="cart-item__right">
      <button class="icon-btn" type="button" data-remove aria-label="Remove">
        <span class="icon icon--close" aria-hidden="true"></span>
      </button>
      <div class="stepper" aria-label="Quantity">
        <button class="stepper__btn" type="button" data-dec aria-label="Decrease">−</button>
        <span class="stepper__val" data-val>${it.qty}</span>
        <button class="stepper__btn" type="button" data-inc aria-label="Increase">+</button>
      </div>
    </div>
  `;

  const val = el.querySelector("[data-val]");

  el.querySelector("[data-inc]")?.addEventListener("click", () => {
    setQty(it, (it.qty || 1) + 1);
  });

  el.querySelector("[data-dec]")?.addEventListener("click", () => {
    const next = (it.qty || 1) - 1;
    if (next <= 0) return;
    setQty(it, next);
    if (val) val.textContent = String(next);
  });

  el.querySelector("[data-remove]")?.addEventListener("click", () => {
    el.classList.add("is-removing");
    window.setTimeout(() => removeItem(it), 220);
  });

  return el;
}

function initForm() {
  const form = qs("[data-form]");
  const submit = qs("[data-submit]");

  if (!form || !submit) return;

  const phone = form.querySelector('input[name="phone"]');
  phone?.addEventListener("input", () => {
    phone.value = maskKG(phone.value);
    validate(form);
  });

  form.addEventListener("input", () => validate(form));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const ok = validate(form, true);
    if (!ok) return;

    if (getCartItems().length === 0) {
      toast({ title: "Корзина пустая", message: "Добавь товары перед оформлением" });
      return;
    }

    openSuccess();
    clearCart();
    form.reset();
    submit.disabled = true;
  });
}

function validate(form, show = false) {
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const phone = String(data.get("phone") || "").trim();
  const address = String(data.get("address") || "").trim();

  const errors = {};

  if (!name) errors.name = "Укажи имя";
  if (!address) errors.address = "Укажи адрес";

  const phoneDigits = phone.replace(/\D/g, "");
  if (!(phone.startsWith("+996") && phoneDigits.length >= 12)) errors.phone = "Телефон в формате +996";

  ["name", "phone", "address", "city", "comment"].forEach((k) => {
    const el = form.querySelector(`[data-err="${k}"]`);
    if (!el) return;
    const msg = errors[k] || "";
    el.textContent = msg;
    el.hidden = !(show && msg);
  });

  const ok = Object.keys(errors).length === 0;
  const submit = qs("[data-submit]");
  if (submit) submit.disabled = !(ok && getCartItems().length > 0);
  return ok;
}

function updateSubmitState() {
  const form = qs("[data-form]");
  if (!form) return;
  validate(form, false);
}

function maskKG(v) {
  const digits = String(v || "").replace(/\D/g, "");

  let d = digits;
  if (d.startsWith("996")) d = d.slice(3);

  const a = d.slice(0, 3);
  const b = d.slice(3, 6);
  const c = d.slice(6, 9);

  let out = "+996";
  if (a) out += ` ${a}`;
  if (b) out += ` ${b}`;
  if (c) out += ` ${c}`;
  return out;
}

function initSuccessModal() {
  const modal = qs("[data-success-modal]");
  if (!modal) return;
  modal.querySelectorAll("[data-close-success]").forEach((b) => b.addEventListener("click", closeSuccess));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeSuccess();
  });
}

function openSuccess() {
  const modal = qs("[data-success-modal]");
  if (!modal) return;
  const idEl = qs("[data-order-id]");
  if (idEl) idEl.textContent = makeOrderId();

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeSuccess() {
  const modal = qs("[data-success-modal]");
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function makeOrderId() {
  const a = Math.random().toString(16).slice(2, 6).toUpperCase();
  const b = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `AU-${a}${b}`;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
