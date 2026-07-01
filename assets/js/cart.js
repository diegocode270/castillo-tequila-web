/* EL CASTILLO DE TEQUILA — Cart module */
(function () {
  "use strict";

  var STORAGE_KEY = "ecdt_cart";

  /* ===== Estado ===== */
  var items = [];

  function loadState() {
    try { items = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch (e) { items = []; }
  }
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch (e) {}
  }
  function findIdx(id) {
    for (var i = 0; i < items.length; i++) { if (items[i].id === id) return i; }
    return -1;
  }

  /* ===== API pública ===== */
  window.Cart = {
    add: function (p) {
      var idx = findIdx(p.id);
      if (idx >= 0) {
        items[idx].cantidad++;
      } else {
        items.push({
          id: p.id,
          nombre: p.nombre || "",
          precio: Number(p.precio_descuento || p.precio || 0),
          precio_base: Number(p.precio || 0),
          precio_desc: p.precio_descuento ? Number(p.precio_descuento) : null,
          imagen_url: p.imagen_url || "",
          imagen_style: p.imagen_style || "",
          cantidad: 1
        });
      }
      saveState();
      renderDrawer();
      updateCounter();
      openDrawer();
    },
    remove: function (id) {
      items = items.filter(function (x) { return x.id !== id; });
      saveState();
      renderDrawer();
      updateCounter();
    },
    updateQty: function (id, delta) {
      var idx = findIdx(id);
      if (idx < 0) return;
      items[idx].cantidad = Math.max(0, items[idx].cantidad + delta);
      if (items[idx].cantidad === 0) items.splice(idx, 1);
      saveState();
      renderDrawer();
      updateCounter();
    },
    count: function () {
      return items.reduce(function (s, x) { return s + x.cantidad; }, 0);
    },
    total: function () {
      return items.reduce(function (s, x) { return s + x.precio * x.cantidad; }, 0);
    }
  };

  /* ===== Helpers ===== */
  function esc(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function fmt(n) { return Number(n || 0).toLocaleString("es-MX"); }

  /* ===== DOM del drawer ===== */
  var overlay, drawer, drawerBody, drawerFoot;

  function buildDrawer() {
    overlay = document.createElement("div");
    overlay.className = "cart-overlay";
    overlay.setAttribute("aria-hidden", "true");

    drawer = document.createElement("aside");
    drawer.className = "cart-drawer";
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-modal", "true");
    drawer.setAttribute("aria-label", "Carrito de compras");
    drawer.innerHTML =
      '<div class="cart-drawer__hd">' +
        '<h3 class="cart-drawer__title">Tu Carrito' +
          '<span class="cart-count-bubble" id="cart-count-bubble"></span>' +
        "</h3>" +
        '<button class="cart-close-btn" id="cart-close-btn" aria-label="Cerrar carrito">&#x2715;</button>' +
      "</div>" +
      '<div class="cart-drawer__body" id="cart-drawer-body"></div>' +
      '<div class="cart-drawer__foot" id="cart-drawer-foot"></div>';

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    drawerBody = document.getElementById("cart-drawer-body");
    drawerFoot = document.getElementById("cart-drawer-foot");
  }

  /* ===== Render ===== */
  function renderDrawer() {
    if (!drawerBody) return;

    var n = window.Cart.count();
    var bubble = document.getElementById("cart-count-bubble");
    if (bubble) bubble.textContent = n > 0 ? String(n) : "";

    if (items.length === 0) {
      drawerBody.innerHTML =
        '<div class="cart-empty">' +
          '<span class="cart-empty__icon">&#127870;</span>' +
          "<p>Tu carrito está vacío.</p>" +
          '<p class="cart-empty__sub">Agrega alguno de nuestros tequilas.</p>' +
        "</div>";
      drawerFoot.innerHTML = "";
      return;
    }

    var html = '<ul class="cart-items" role="list">';
    items.forEach(function (item) {
      var imgFilter = (item.imagen_style && item.imagen_style.indexOf("brightness(0)") !== -1)
        ? ' style="filter:brightness(0)"' : "";
      html +=
        '<li class="cart-item">' +
          '<div class="cart-item__img">' +
            '<img src="' + esc(item.imagen_url) + '" alt="' + esc(item.nombre) + '"' + imgFilter + ">" +
          "</div>" +
          '<div class="cart-item__info">' +
            '<p class="cart-item__name">' + esc(item.nombre) + "</p>" +
            (item.precio_desc
              ? '<p class="cart-item__price"><s>$' + fmt(item.precio_base) + "</s> $" + fmt(item.precio_desc) + " MXN</p>"
              : '<p class="cart-item__price">$' + fmt(item.precio) + " MXN</p>") +
            '<div class="cart-item__qty">' +
              '<button class="cart-qty-btn" data-action="minus" data-id="' + esc(String(item.id)) + '" aria-label="Reducir cantidad">&#8722;</button>' +
              '<span class="cart-qty-val" aria-live="polite">' + item.cantidad + "</span>" +
              '<button class="cart-qty-btn" data-action="plus" data-id="' + esc(String(item.id)) + '" aria-label="Aumentar cantidad">&#43;</button>' +
            "</div>" +
          "</div>" +
          '<div class="cart-item__aside">' +
            '<button class="cart-remove-btn" data-id="' + esc(String(item.id)) + '" aria-label="Eliminar ' + esc(item.nombre) + '">&#x2715;</button>' +
            '<span class="cart-item__sub">$' + fmt(item.precio * item.cantidad) + "</span>" +
          "</div>" +
        "</li>";
    });
    html += "</ul>";
    drawerBody.innerHTML = html;

    drawerFoot.innerHTML =
      '<div class="cart-foot__summary">' +
        '<span class="cart-foot__label">Subtotal</span>' +
        '<span class="cart-foot__total">$' + fmt(window.Cart.total()) + " MXN</span>" +
      "</div>" +
      '<p class="cart-foot__note">Envío e impuestos calculados al finalizar</p>' +
      '<a href="#checkout" class="btn btn--gold cart-checkout-btn">' +
        "<span>Continuar proceso de pago</span>" +
        '<span class="btn-arrow">→</span>' +
      "</a>";
  }

  /* ===== Contador nav ===== */
  function updateCounter() {
    var n = window.Cart.count();
    var navCart = document.querySelector(".nav__cart");
    if (navCart) navCart.textContent = "Carrito (" + n + ")";
  }

  /* ===== Abrir / cerrar ===== */
  function openDrawer() {
    renderDrawer();
    overlay.classList.add("open");
    drawer.classList.add("open");
    document.body.classList.add("cart-open");
    var btn = document.getElementById("cart-close-btn");
    if (btn) setTimeout(function () { btn.focus(); }, 380);
  }

  function closeDrawer() {
    overlay.classList.remove("open");
    drawer.classList.remove("open");
    document.body.classList.remove("cart-open");
  }

  /* ===== Eventos ===== */
  function initEvents() {
    overlay.addEventListener("click", closeDrawer);
    document.getElementById("cart-close-btn").addEventListener("click", closeDrawer);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drawer.classList.contains("open")) closeDrawer();
    });

    /* Abrir drawer desde el nav */
    var navCart = document.querySelector(".nav__cart");
    if (navCart) {
      navCart.setAttribute("href", "#");
      navCart.addEventListener("click", function (e) { e.preventDefault(); openDrawer(); });
    }

    /* Botón "Agregar al carrito" — delegación en document */
    document.addEventListener("click", function (e) {
      var btn = e.target.closest(".cart-add-btn");
      if (!btn || btn.disabled) return;
      e.preventDefault();

      var producto;
      try { producto = JSON.parse(btn.dataset.product); } catch (err) { return; }

      var span = btn.querySelector("span");
      var orig = span ? span.textContent : "";
      btn.disabled = true;
      btn.classList.add("cart-adding");
      if (span) span.textContent = "✓ Agregado";
      setTimeout(function () {
        btn.disabled = false;
        btn.classList.remove("cart-adding");
        if (span) span.textContent = orig;
      }, 1500);

      window.Cart.add(producto);
    });

    /* Controles dentro del drawer — delegación en document */
    document.addEventListener("click", function (e) {
      var rmBtn = e.target.closest(".cart-remove-btn");
      if (rmBtn) { window.Cart.remove(Number(rmBtn.dataset.id)); return; }

      var qBtn = e.target.closest(".cart-qty-btn");
      if (qBtn) {
        window.Cart.updateQty(Number(qBtn.dataset.id), qBtn.dataset.action === "plus" ? 1 : -1);
      }
    });
  }

  /* ===== Init ===== */
  loadState();

  function init() {
    buildDrawer();
    initEvents();
    updateCounter();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
