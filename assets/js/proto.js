/* ============================================
   BREST 採用LP 刷新の試作 / proto.js
   - 動画はタップしたときだけ Instagram を読み込む（最初の表示を軽くする）
   - ページ内フォーム（試作なので送信はしない）
   ============================================ */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    initLazyMovie();
    initForm();
  });

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

  function initForm() {
    document.querySelectorAll("[data-entry-form]").forEach(function (wrap) {
      var form = wrap.querySelector("form");
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!form.reportValidity()) return;
        wrap.classList.add("is-done");
        wrap.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  }
})();
