/* ============================================
   BREST 採用LP（C案）/ lp.js
   - 動画はタップしたときだけ Instagram を読み込む（最初の表示を軽くする）
   - ページ内フォームを GAS（data-endpoint）に送る
   - 計測は dataLayer に積む（GTM で GA4・Meta に流す）
       apply_click … 面談のボタン（#entry へのリンク）を押した
       lead_submit … フォームを送り終えた
   ============================================ */
(function () {
  "use strict";

  var opened = Date.now();

  document.addEventListener("DOMContentLoaded", function () {
    initLazyMovie();
    initCtaTracking();
    initForm();
  });

  function push(obj) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(obj);
  }

  function loadInstagram(done) {
    if (window.instgrm) return done();
    var s = document.createElement("script");
    s.src = "https://www.instagram.com/embed.js";
    s.async = true;
    s.onload = done;
    document.body.appendChild(s);
  }

  function initLazyMovie() {
    document.querySelectorAll("[data-ig]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var url = btn.getAttribute("data-ig");
        var box = document.createElement("div");
        box.className = "movie-lazy__item is-loaded";
        box.innerHTML =
          '<blockquote class="instagram-media" data-instgrm-permalink="' + url +
          '" data-instgrm-version="14" style="margin:0;min-width:0;width:100%"></blockquote>';
        btn.replaceWith(box);
        loadInstagram(function () {
          if (window.instgrm) window.instgrm.Embeds.process();
        });
      });
    });
  }

  function initCtaTracking() {
    document.querySelectorAll('a[href="#entry"]').forEach(function (a, i) {
      a.addEventListener("click", function () {
        push({ event: "apply_click", cta_position: a.getAttribute("data-cta") || String(i + 1) });
      });
    });
  }

  function initForm() {
    document.querySelectorAll("[data-entry-form]").forEach(function (wrap) {
      var form = wrap.querySelector("form");
      var endpoint = wrap.getAttribute("data-endpoint");
      var button = form.querySelector('[type="submit"]');
      var error = wrap.querySelector(".entry-form__error");
      var sending = false;

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (sending || !form.reportValidity()) return;
        sending = true;
        button.disabled = true;
        if (error) error.hidden = true;

        var data = new URLSearchParams(new FormData(form));
        var q = new URLSearchParams(location.search);
        ["utm_source", "utm_medium", "utm_content"].forEach(function (k) {
          data.append(k, q.get(k) || "");
        });
        data.append("page", location.pathname);
        data.append("opened", String(opened));

        if (!endpoint) {  // デモ: 送らずに完了の表示だけ
          wrap.classList.add("is-done");
          wrap.scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }
        fetch(endpoint, { method: "POST", body: data })
          .then(function (res) { return res.json(); })
          .then(function (json) {
            if (!json.ok) throw new Error(json.error || "ng");
            push({ event: "lead_submit", lead_from: form.elements.from ? form.elements.from.value : "" });
            wrap.classList.add("is-done");
            wrap.scrollIntoView({ behavior: "smooth", block: "center" });
          })
          .catch(function () {
            if (error) error.hidden = false;
            sending = false;
            button.disabled = false;
          });
      });
    });
  }
})();
