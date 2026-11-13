/* ============================================
   BREST 採用LP / main.js
   - ヒーロー3シーン切替
   - VOICE カルーセル
   - Sticky CTA バーのフェード制御
   ============================================ */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    initHeroScenes();
    initCarousel(".voice__carousel", ".voice-card", { loop: "infinite" });
    initCarousel(".movie__carousel", ".movie__embed", { loop: "wrap" });
    initStickyCta();
    initHamburger();
    initFaq();
  }

  /* ============================================
     ハンバーガーメニュー（SP）
     ============================================ */
  function initHamburger() {
    const btn = document.querySelector("[data-hamburger]");
    const nav = document.getElementById("siteNav");
    if (!btn || !nav) return;
    btn.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
    });
    nav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        nav.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
        btn.setAttribute("aria-label", "メニューを開く");
      });
    });
  }

  /* ============================================
     FAQ アコーディオン
     ============================================ */
  function initFaq() {
    document.querySelectorAll("[data-faq-toggle]").forEach((q) => {
      q.addEventListener("click", () => {
        const expanded = q.getAttribute("aria-expanded") === "true";
        q.setAttribute("aria-expanded", expanded ? "false" : "true");
      });
    });
  }

  /* ============================================
     ヒーロー 3シーンローテーション（ohsho 方式）
     ============================================ */
  function initHeroScenes() {
    const scenes = document.querySelectorAll(".hero__scene");
    if (scenes.length < 2) return;
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const INTERVAL = 5000;
    let idx = Array.from(scenes).findIndex((s) => s.classList.contains("is-active"));
    if (idx < 0) {
      scenes[0].classList.add("is-active");
      idx = 0;
    }
    setInterval(() => {
      scenes[idx].classList.remove("is-active");
      idx = (idx + 1) % scenes.length;
      scenes[idx].classList.add("is-active");
    }, INTERVAL);
  }

  /* ============================================
     汎用カルーセル
     PC 3枚 / Tablet 2枚 / Mobile 1枚
     loop:
       "wrap"     … 端で先頭/末尾にスナップ（埋め込み iframe 系向け）
       "infinite" … 前後にクローン要素を仕込んでシームレス無限スクロール
     ============================================ */
  function initCarousel(rootSelector, itemSelector, opts) {
    const root = document.querySelector(rootSelector);
    if (!root) return;

    const loopMode = (opts && opts.loop) === "infinite" ? "infinite" : "wrap";
    const viewport = root.querySelector("[data-viewport]");
    const track = root.querySelector("[data-track]");
    const prevBtn = root.querySelector("[data-prev]");
    const nextBtn = root.querySelector("[data-next]");
    const dots = root.querySelectorAll("[data-dot]");
    const realItems = Array.from(track.querySelectorAll(itemSelector));
    if (!realItems.length) return;

    const realCount = realItems.length;
    let items = realItems.slice();
    let perView = 3;
    let maxIndex = 0;       // wrap モード用
    let cloneCount = 0;     // infinite モード用（前後それぞれの枚数）
    let index = 0;          // items 配列上の表示位置（クローン含む）
    let isAnimating = false;

    function calcPerView() {
      const w = window.innerWidth;
      if (w <= 768) return 1;
      if (w <= 960) return 2;
      return 3;
    }

    /* infinite モード: 前後にクローン要素を仕込む */
    function setupClones() {
      track.querySelectorAll("[data-clone]").forEach((el) => el.remove());
      perView = calcPerView();
      cloneCount = Math.min(perView, realCount);

      for (let i = realCount - cloneCount; i < realCount; i++) {
        const c = realItems[i].cloneNode(true);
        c.setAttribute("data-clone", "head");
        c.setAttribute("aria-hidden", "true");
        track.insertBefore(c, track.firstChild);
      }
      for (let i = 0; i < cloneCount; i++) {
        const c = realItems[i].cloneNode(true);
        c.setAttribute("data-clone", "tail");
        c.setAttribute("aria-hidden", "true");
        track.appendChild(c);
      }
      items = Array.from(track.querySelectorAll(itemSelector));
      index = cloneCount;
      isAnimating = false;
    }

    function realIndexOf(i) {
      if (loopMode !== "infinite") return i;
      const r = ((i - cloneCount) % realCount + realCount) % realCount;
      return r;
    }

    function setTranslate(animate) {
      const gap = parseFloat(getComputedStyle(track).gap) || 0;
      const itemWidth = items[0].getBoundingClientRect().width;
      const offset = (itemWidth + gap) * index;
      if (!animate) {
        const prev = track.style.transition;
        track.style.transition = "none";
        track.style.transform = `translate3d(-${offset}px, 0, 0)`;
        // 強制リフロー後、transition を元に戻す
        void track.offsetWidth;
        track.style.transition = prev;
      } else {
        track.style.transform = `translate3d(-${offset}px, 0, 0)`;
      }
    }

    function updateDots() {
      const r = realIndexOf(index);
      dots.forEach((dot, i) => {
        dot.classList.toggle("is-active", i === r);
      });
    }

    function update(animate) {
      perView = calcPerView();
      if (loopMode === "wrap") {
        maxIndex = Math.max(0, realCount - perView);
        const span = maxIndex + 1;
        index = ((index % span) + span) % span;
      }
      setTranslate(animate !== false);
      updateDots();
    }

    function go(dir) {
      if (loopMode === "infinite") {
        if (isAnimating) return;
        isAnimating = true;
        index += dir;
        setTranslate(true);
        updateDots();
      } else {
        maxIndex = Math.max(0, realCount - perView);
        const span = maxIndex + 1;
        index = (((index + dir) % span) + span) % span;
        setTranslate(true);
        updateDots();
      }
    }

    /* infinite: アニメ完了後、クローン領域に居たら実体側へ瞬間移動 */
    if (loopMode === "infinite") {
      track.addEventListener("transitionend", (e) => {
        if (e.propertyName !== "transform") return;
        isAnimating = false;
        if (index >= cloneCount + realCount) {
          index -= realCount;
          setTranslate(false);
        } else if (index < cloneCount) {
          index += realCount;
          setTranslate(false);
        }
        updateDots();
      });
    }

    if (prevBtn) prevBtn.addEventListener("click", () => go(-1));
    if (nextBtn) nextBtn.addEventListener("click", () => go(1));

    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        const target = parseInt(dot.dataset.dot, 10);
        if (loopMode === "infinite") {
          if (isAnimating) return;
          index = cloneCount + ((target % realCount) + realCount) % realCount;
          setTranslate(true);
          updateDots();
        } else {
          maxIndex = Math.max(0, realCount - perView);
          index = Math.min(target, maxIndex);
          setTranslate(true);
          updateDots();
        }
      });
    });

    /* タッチスワイプ */
    let startX = 0;
    let isDragging = false;
    viewport.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
      isDragging = true;
    }, { passive: true });
    viewport.addEventListener("touchend", (e) => {
      if (!isDragging) return;
      isDragging = false;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) < 40) return;
      go(dx < 0 ? 1 : -1);
    });

    /* resize 対応 */
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (loopMode === "infinite") setupClones();
        update(false);
      }, 120);
    });

    /* Instagram埋め込みなど後から高さ確定するケース用に少し遅延でも再計算 */
    setTimeout(() => update(false), 600);
    setTimeout(() => update(false), 2000);

    if (loopMode === "infinite") setupClones();
    update(false);
  }

  /* ============================================
     Sticky CTA バー
     ============================================ */
  function initStickyCta() {
    const bar = document.querySelector("[data-sticky-cta]");
    if (!bar) return;
    const hero = document.querySelector(".hero");
    const entry = document.querySelector(".entry");
    const footer = document.querySelector(".site-footer");

    function check() {
      const heroBottom = hero ? hero.getBoundingClientRect().bottom : 0;
      const entryTop = entry ? entry.getBoundingClientRect().top : Infinity;
      const footerTop = footer ? footer.getBoundingClientRect().top : Infinity;
      const winH = window.innerHeight;
      // FV通過後はずっと表示。最終CTAまたはフッターが画面に入ってきたら非表示
      const inActiveRange = heroBottom < 80 && entryTop > 80 && footerTop > winH;
      bar.classList.toggle("is-visible", inActiveRange);
    }

    let ticking = false;
    window.addEventListener("scroll", () => {
      if (!ticking) {
        requestAnimationFrame(() => { check(); ticking = false; });
        ticking = true;
      }
    }, { passive: true });
    window.addEventListener("resize", check);
    check();
  }
})();
