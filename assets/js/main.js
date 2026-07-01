/* EL CASTILLO DE TEQUILA — interacciones */
(function () {
  "use strict";

  /* ---- Supabase ---- */
  var SUPA_URL = "https://vjkeukkouhhumaagwoli.supabase.co";
  var SUPA_KEY = "sb_publishable_AywGr8b8-Km5cbdnHYBZFg_8aX6tiQE";
  var db = (typeof supabase !== "undefined" && supabase.createClient)
    ? supabase.createClient(SUPA_URL, SUPA_KEY)
    : null;

  /* ---- Nav scroll state ---- */
  var nav = document.querySelector(".nav");
  function onScroll() {
    if (!nav) return;
    if (window.scrollY > 40) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Menú móvil ---- */
  var burger = document.querySelector(".burger");
  var mobile = document.querySelector(".mobile-menu");
  if (burger && mobile) {
    burger.addEventListener("click", function () {
      burger.classList.toggle("open");
      mobile.classList.toggle("open");
      document.body.style.overflow = mobile.classList.contains("open") ? "hidden" : "";
    });
    mobile.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        burger.classList.remove("open");
        mobile.classList.remove("open");
        document.body.style.overflow = "";
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mobile.classList.contains("open")) {
        burger.classList.remove("open");
        mobile.classList.remove("open");
        document.body.style.overflow = "";
        burger.focus();
      }
    });
  }

  /* ---- Reveal on scroll ---- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".reveal, .reveal-x").forEach(function (el) { io.observe(el); });

  /* ---- Conteo de estadísticas ---- */
  var counted = false;
  var statObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting && !counted) {
        counted = true;
        document.querySelectorAll("[data-count]").forEach(function (el) {
          var target = parseFloat(el.getAttribute("data-count"));
          var suffix = el.getAttribute("data-suffix") || "";
          var dur = 1600, start = null;
          function step(ts) {
            if (!start) start = ts;
            var p = Math.min((ts - start) / dur, 1);
            var val = Math.floor((1 - Math.pow(1 - p, 3)) * target);
            el.textContent = val.toLocaleString("es-MX") + suffix;
            if (p < 1) requestAnimationFrame(step);
            else el.textContent = target.toLocaleString("es-MX") + suffix;
          }
          requestAnimationFrame(step);
        });
      }
    });
  }, { threshold: 0.4 });
  var trust = document.querySelector("[data-stats]");
  if (trust) statObs.observe(trust);

  /* ---- Parallax suave en heros ---- */
  var pm = document.querySelectorAll("[data-parallax]");
  if (pm.length) {
    var rafPending = false;
    window.addEventListener("scroll", function () {
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(function () {
          var y = window.scrollY;
          pm.forEach(function (el) {
            el.style.transform = "translateY(" + y * 0.18 + "px) scale(1.08)";
          });
          rafPending = false;
        });
      }
    }, { passive: true });
  }

  /* ---- Age gate ---- */
  var gate = document.querySelector(".gate");
  if (gate) {
    var ok = false;
    try { ok = sessionStorage.getItem("ecdt_age_ok") === "1"; } catch (e) {}
    if (ok) {
      gate.classList.add("hide");
    } else {
      document.body.style.overflow = "hidden";
      var yes = gate.querySelector("[data-age-yes]");
      var no = gate.querySelector("[data-age-no]");
      if (yes) yes.addEventListener("click", function () {
        try { sessionStorage.setItem("ecdt_age_ok", "1"); } catch (e) {}
        gate.classList.add("hide");
        document.body.style.overflow = "";
      });
      if (no) no.addEventListener("click", function () {
        window.location.href = "https://www.google.com/";
      });
    }
  }

  /* ---- Formularios + Supabase ---- */
  document.querySelectorAll("form[data-demo]").forEach(function (f) {
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var btn = f.querySelector("[type=submit]");
      var originalHTML = btn ? btn.innerHTML : "";

      function showSuccess() {
        if (btn) {
          btn.innerHTML = "<span>¡Gracias! Te contactaremos pronto ✓</span>";
          btn.disabled = true;
          setTimeout(function () { btn.innerHTML = originalHTML; btn.disabled = false; f.reset(); }, 3500);
        }
      }

      var table = f.getAttribute("data-table");
      if (db && table) {
        var payload = {};
        f.querySelectorAll("input[name], select[name], textarea[name]").forEach(function (el) {
          if (el.type === "checkbox") return;
          payload[el.name] = el.type === "number" ? (parseInt(el.value, 10) || 0) : el.value.trim();
        });
        db.from(table).insert([payload]).then(function (res) {
          if (res.error) console.warn("[Supabase]", res.error.message);
          showSuccess();
        });
      } else {
        showSuccess();
      }
    });
  });

  /* ---- Año dinámico ---- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---- Catálogo dinámico de productos desde Supabase ---- */
  function escHtml(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function renderVariantes(str) {
    if (!str) return "";
    return '<div class="variants">' + String(str).split("·").map(function (v) {
      return "<span>" + escHtml(v.trim()) + "</span>";
    }).join("") + "</div>";
  }
  function renderPrecio(p, cls) {
    var base = Number(p.precio || 0).toLocaleString("es-MX");
    if (p.precio_descuento) {
      var desc = Number(p.precio_descuento).toLocaleString("es-MX");
      return '<div class="' + cls + '"><s class="precio-tachado">$' + base + '</s>&nbsp;<strong class="precio-oferta">$' + desc + " MXN</strong></div>";
    }
    return '<div class="' + cls + '">Desde $' + base + " MXN</div>";
  }
  function cartDataAttr(p) {
    return escHtml(JSON.stringify({
      id: p.id, nombre: p.nombre, precio: p.precio,
      precio_descuento: p.precio_descuento,
      imagen_url: p.imagen_url, imagen_style: p.imagen_style
    }));
  }
  function renderBottleCard(p, i) {
    var delays = ["", " d1", " d2", " d3", " d4"];
    var imgAttr = p.imagen_style ? ' style="' + escHtml(p.imagen_style) + '"' : "";
    return '<div class="bottle-card reveal' + (delays[Math.min(i, 4)] || "") + '">' +
      '<img loading="lazy" src="' + escHtml(p.imagen_url || "") + '" alt="' + escHtml(p.nombre) + '"' + imgAttr + ">" +
      '<div class="tag">' + escHtml(p.tag || "") + "</div>" +
      '<h3 class="h-md" style="margin:.3em 0">' + escHtml(p.nombre) + "</h3>" +
      '<p class="muted" style="font-size:.9rem">' + escHtml(p.descripcion || "") + "</p>" +
      renderPrecio(p, "price") +
      renderVariantes(p.variantes) +
      '<div class="mt-s"><button class="btn btn--solid cart-add-btn" data-product="' + cartDataAttr(p) + '" aria-label="Agregar ' + escHtml(p.nombre) + ' al carrito"><span>Agregar al carrito</span></button></div>' +
      "</div>";
  }
  function renderShopCard(p, i) {
    var delays = ["", " d1", " d2", " d3"];
    var imgAttr = p.imagen_style ? ' style="' + escHtml(p.imagen_style) + '"' : "";
    return '<div class="shop-card reveal' + (delays[Math.min(i, 3)] || "") + '">' +
      '<div class="shop-card__img"><img loading="lazy" src="' + escHtml(p.imagen_url || "") + '" alt="' + escHtml(p.nombre) + '"' + imgAttr + "></div>" +
      '<div class="tag">' + escHtml(p.tag || "") + "</div>" +
      "<h3>" + escHtml(p.nombre) + "</h3>" +
      renderPrecio(p, "price") +
      '<div class="mt-s"><button class="btn btn--solid cart-add-btn" data-product="' + cartDataAttr(p) + '" aria-label="Agregar ' + escHtml(p.nombre) + ' al carrito"><span>Agregar al carrito</span></button></div>' +
      "</div>";
  }

  var bottleGrid = document.getElementById("productos-grid");
  var shopGrid   = document.getElementById("tienda-grid");
  if (db && (bottleGrid || shopGrid)) {
    var skel = "<div class='skel-card'></div><div class='skel-card'></div><div class='skel-card'></div><div class='skel-card'></div>";
    if (bottleGrid) bottleGrid.innerHTML = skel;
    if (shopGrid)   shopGrid.innerHTML   = skel;
    db.from("productos").select("*").eq("activo", true).order("orden").then(function (res) {
      if (res.error) { console.warn("[Supabase productos]", res.error.message); return; }
      var lista = res.data || [];
      if (bottleGrid) {
        bottleGrid.innerHTML = lista.map(renderBottleCard).join("");
        bottleGrid.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
      }
      if (shopGrid) {
        shopGrid.innerHTML = lista.map(renderShopCard).join("");
        shopGrid.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
      }
    });
  }
})();
