(() => {
  "use strict";

  const TEXT = {
    bg: {
      title: "Запазете датата — Стефани & Елизар",
      hint: "Докоснете, за да отворите",
      open: "Отворете завесите",
      save: ["Запазете", "датата"],
      name1: "СТЕФАНИ",
      amp: "&",
      name2: "ЕЛИЗАР",
      subtitle: "се женят",
      date: "25.07.2027",
      place: "Пасарел Лейк Клуб",
      follow: "Очаквайте официални покани",
      replay: "Отново",
      mute: "Изключи звука",
      unmute: "Включи звука",
      switchTo: "en",
      switchLabel: "EN",
    },
    en: {
      title: "Save the Date — Stefani & Elizar",
      hint: "Tap to open",
      open: "Open the curtains",
      save: ["Save the Date"],
      name1: "STEFANI",
      amp: "&",
      name2: "ELIZAR",
      subtitle: "are getting married",
      date: "25.07.2027",
      place: "Pasarel Lake Club",
      follow: "Formal invitations to follow",
      replay: "Replay",
      mute: "Mute",
      unmute: "Unmute",
      switchTo: "bg",
      switchLabel: "BG",
    },
  };

  const ASSETS = {
    music: "assets/music.mp3",
    photos: ["assets/photo.jpg", "assets/photo-placeholder.jpg"],
  };

  const TIMING = {
    curtainsToFirstScene: 2000,
    saveHold: 4600,
    namesHold: 5600,
    sceneGap: 1000,
    replayDelay: 4200,
    curtainsClose: 3000,
    reducedFade: 1300,
    musicFadeDelay: 900,
  };

  const params = new URLSearchParams(location.search);
  const lang = params.get("lang") === "en" ? "en" : "bg";
  const t = TEXT[lang];

  const $ = (id) => document.getElementById(id);
  const curtains = $("curtains");
  const scenes = {
    save: $("scene-save"),
    names: $("scene-names"),
    final: $("scene-final"),
  };
  const replayBtn = $("replay");
  const muteBtn = $("mute");
  const langLink = $("lang-switch");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function applyText() {
    document.documentElement.lang = lang;
    document.title = t.title;
    document.querySelectorAll("[data-t]").forEach((el) => {
      el.textContent = t[el.dataset.t];
    });

    const title = $("save-title");
    title.replaceChildren(
      ...t.save.map((line, i) => {
        const span = document.createElement("span");
        span.className = "wipe";
        span.style.setProperty("--d", `${0.2 + i * 1.3}s`);
        span.textContent = line;
        return span;
      })
    );

    curtains.setAttribute("aria-label", `${t.open} — ${t.hint}`);
    muteBtn.setAttribute("aria-label", t.mute);
    langLink.textContent = t.switchLabel;
    langLink.hreflang = t.switchTo;
    langLink.href = t.switchTo === "en" ? "?lang=en" : location.pathname;
  }

  function loadPhoto() {
    const tryLoad = (src) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(src);
        img.onerror = reject;
        img.src = src;
      });

    ASSETS.photos
      .reduce((chain, src) => chain.catch(() => tryLoad(src)), Promise.reject())
      .then((src) => {
        $("photo").style.backgroundImage = `url("${src}")`;
      })
      .catch(() => {});
  }

  const makeAudio = (src, loop) => {
    const el = new Audio();
    el.loop = loop;
    el.preload = "auto";
    el.src = src;
    return el;
  };
  const music = makeAudio(ASSETS.music, true);
  let muted = false;

  function fadeVolume(el, to, ms) {
    const from = el.volume;
    const start = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - start) / ms);
      el.volume = from + (to - from) * k;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function startSound(el, volume, fadeDelay, fadeMs) {
    el.currentTime = 0;
    el.muted = muted;
    el.volume = fadeMs ? 0 : volume;
    const playing = el.play();
    if (!playing) return;
    playing
      .then(() => {
        muteBtn.hidden = false;
        if (fadeMs) setTimeout(() => fadeVolume(el, volume, fadeMs), fadeDelay);
      })
      .catch(() => {});
  }

  function startAudio() {
    startSound(music, 0.8, TIMING.musicFadeDelay, 3000);
  }

  function toggleMute() {
    muted = !muted;
    music.muted = muted;
    muteBtn.setAttribute("aria-pressed", String(muted));
    muteBtn.setAttribute("aria-label", muted ? t.unmute : t.mute);
  }

  let runId = 0;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function show(name) {
    Object.entries(scenes).forEach(([key, el]) => {
      const active = key === name;
      el.classList.toggle("is-active", active);
      el.setAttribute("aria-hidden", String(!active));
    });
  }

  function setReplayVisible(visible) {
    replayBtn.classList.toggle("is-hidden", !visible);
    replayBtn.tabIndex = visible ? 0 : -1;
  }

  async function play() {
    const id = ++runId;
    const alive = () => id === runId;

    curtains.classList.add("is-open");
    curtains.tabIndex = -1;
    langLink.classList.add("is-hidden");
    langLink.tabIndex = -1;

    if (reducedMotion.matches) {
      await wait(TIMING.reducedFade);
      if (!alive()) return;
      show("final");
      await wait(TIMING.reducedFade);
      if (!alive()) return;
      setReplayVisible(true);
      return;
    }

    const steps = [
      [TIMING.curtainsToFirstScene, () => show("save")],
      [TIMING.saveHold, () => show(null)],
      [TIMING.sceneGap, () => show("names")],
      [TIMING.namesHold, () => show(null)],
      [TIMING.sceneGap, () => show("final")],
      [TIMING.replayDelay, () => setReplayVisible(true)],
    ];

    for (const [delay, action] of steps) {
      await wait(delay);
      if (!alive()) return;
      action();
    }
  }

  async function replay() {
    const id = ++runId;
    setReplayVisible(false);
    show(null);

    if (!reducedMotion.matches) {
      curtains.classList.remove("is-open");
      await wait(TIMING.curtainsClose);
    } else {
      await wait(TIMING.reducedFade);
    }
    if (id !== runId) return;
    play();
  }

  let opened = false;
  curtains.addEventListener("click", () => {
    if (opened) return;
    opened = true;
    startAudio();
    play();
  });

  replayBtn.addEventListener("click", replay);
  muteBtn.addEventListener("click", toggleMute);

  applyText();
  loadPhoto();
})();
