/* Optimum Physiotherapy — progressive enhancement only.
   Every fact this file touches also exists in the raw HTML. JavaScript never
   supplies content here; it highlights, toggles and computes "open now", which
   cannot be correct if it is baked in at build time. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  /* ---------- opening hours: the single source of truth for time maths ----------
     Mirrors the visible table and the JSON-LD. 24h local clock. */
  var HOURS = {
    0: null,            // Sunday — closed
    1: [9, 19],
    2: [9, 19],
    3: [13, 19],        // Wednesday opens at 1pm
    4: [9, 19],
    5: [9, 19],
    6: [9, 14]          // Saturday
  };
  var DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function fmt(h) {
    var suffix = h >= 12 ? "pm" : "am";
    var hour = h % 12 || 12;
    return hour + suffix;
  }

  function openState(now) {
    var day = now.getDay();
    var span = HOURS[day];
    var mins = now.getHours() * 60 + now.getMinutes();
    if (span && mins >= span[0] * 60 && mins < span[1] * 60) {
      return { open: true, text: "Open until " + fmt(span[1]) };
    }
    // find the next opening, looking forward up to a week
    for (var i = 0; i < 8; i++) {
      var d = (day + i) % 7;
      var s = HOURS[d];
      if (!s) continue;
      if (i === 0 && mins < s[0] * 60) {
        return { open: false, text: "Opens at " + fmt(s[0]) };
      }
      if (i > 0) {
        var label = i === 1 ? "tomorrow" : DAY_NAMES[d];
        return { open: false, text: "Opens " + label + " at " + fmt(s[0]) };
      }
    }
    return { open: false, text: "Closed" };
  }

  var badge = document.querySelector("[data-open-now]");
  if (badge) {
    var state = openState(new Date());
    var dot = badge.querySelector(".open-dot");
    var label = badge.querySelector("[data-open-text]");
    if (dot) dot.setAttribute("data-open", String(state.open));
    if (label) label.textContent = state.text;
  }

  /* highlight today's row in any hours table */
  var todayName = DAY_NAMES[new Date().getDay()];
  document.querySelectorAll("[data-hours-table] tr").forEach(function (row) {
    if (row.getAttribute("data-day") === todayName) {
      row.querySelectorAll("th,td").forEach(function (cell) {
        cell.setAttribute("data-today", "true");
      });
      var th = row.querySelector("th");
      if (th && !th.querySelector(".today-tag")) {
        var tag = document.createElement("span");
        tag.className = "today-tag visually-hidden";
        tag.textContent = " (today)";
        th.appendChild(tag);
      }
    }
  });

  /* ---------- mobile navigation ---------- */
  var toggle = document.querySelector("[data-nav-toggle]");
  var drawer = document.querySelector("[data-drawer]");
  if (toggle && drawer) {
    function openDrawer() {
      drawer.classList.add("is-open");
      drawer.removeAttribute("hidden");
      toggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      var first = drawer.querySelector("a, button");
      if (first) first.focus();
      document.addEventListener("keydown", onKey);
    }
    function closeDrawer() {
      drawer.classList.remove("is-open");
      drawer.setAttribute("hidden", "");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      toggle.focus();   // WAI-ARIA: return focus to the control that opened the dialog
    }
    function onKey(e) {
      if (e.key === "Escape") { closeDrawer(); return; }
      if (e.key !== "Tab") return;
      var items = drawer.querySelectorAll("a, button");
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    toggle.addEventListener("click", function () {
      drawer.classList.contains("is-open") ? closeDrawer() : openDrawer();
    });
    drawer.addEventListener("click", function (e) {
      if (e.target === drawer || e.target.closest("[data-drawer-close]")) closeDrawer();
    });
  }

  /* ---------- reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        setTimeout(function () { el.classList.add("is-in"); }, Math.min(i * 45, 180));
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- current year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
