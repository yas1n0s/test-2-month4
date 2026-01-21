const KEY = "aurum_cart_v1";

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function write(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

function emit() {
  window.dispatchEvent(new CustomEvent("cart:change"));
}

export function getCartItems() {
  return read();
}

export function getCartCount() {
  return read().reduce((acc, it) => acc + (it.qty || 0), 0);
}

export function getCartSubtotal() {
  return read().reduce((acc, it) => acc + (it.price || 0) * (it.qty || 0), 0);
}

export function addToCart(item) {
  const items = read();
  const key = `${item.product_id}__${item.size || ""}__${item.color || ""}`;
  const idx = items.findIndex((x) => `${x.product_id}__${x.size || ""}__${x.color || ""}` === key);

  if (idx >= 0) items[idx].qty = (items[idx].qty || 1) + (item.qty || 1);
  else items.push({ ...item, qty: item.qty || 1 });

  write(items);
  emit();
}

export function setQty(match, qty) {
  const items = read();
  const nextQty = Math.max(1, Number(qty || 1));
  const idx = items.findIndex(
    (x) => x.product_id === match.product_id && x.size === match.size && x.color === match.color
  );
  if (idx < 0) return;
  items[idx].qty = nextQty;
  write(items);
  emit();
}

export function removeItem(match) {
  const items = read().filter(
    (x) => !(x.product_id === match.product_id && x.size === match.size && x.color === match.color)
  );
  write(items);
  emit();
}

export function clearCart() {
  write([]);
  emit();
}
