/* EL CASTILLO DE TEQUILA — interacciones */
(function () {
  "use strict";

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

  /* ---- Formularios (demo) ---- */
  document.querySelectorAll("form[data-demo]").forEach(function (f) {
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var btn = f.querySelector("[type=submit]");
      if (btn) { var t = btn.innerHTML; btn.innerHTML = "<span>¡Gracias! Te contactaremos pronto ✓</span>"; btn.disabled = true;
        setTimeout(function(){ btn.innerHTML = t; btn.disabled = false; f.reset(); }, 3500); }
    });
  });

  /* ---- Año dinámico ---- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
