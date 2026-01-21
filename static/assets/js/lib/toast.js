import { qs } from "./dom.js";

export function toast({ title = "", message = "", timeout = 2200 } = {}) {
  const stack = qs("[data-toast-stack]");
  if (!stack) return;

  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `
    <div>
      <p class="toast__title">${escapeHtml(title)}</p>
      ${message ? `<p class="toast__msg">${escapeHtml(message)}</p>` : ""}
    </div>
    <button class="icon-btn toast__close" type="button" aria-label="Close toast">
      <span class="icon icon--close" aria-hidden="true"></span>
    </button>
  `;

  const close = () => {
    el.classList.remove("is-show");
    window.setTimeout(() => el.remove(), 280);
  };

  el.querySelector(".toast__close")?.addEventListener("click", close);

  stack.appendChild(el);
  requestAnimationFrame(() => el.classList.add("is-show"));

  if (timeout) window.setTimeout(close, timeout);
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
