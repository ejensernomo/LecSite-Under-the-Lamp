/*
    Full Name: Elisha Jenser A. Nomo
    Section: WD-202
    Activity: Under The Lamp
    File: audio.js (used by every page)

    Keeps the music going while you browse the site.

    HOW IT WORKS
    - On a server (VS Code Live Server, GitHub Pages ...) script.js swaps pages
      without reloading, so the song never even pauses. This file just keeps
      remembering where the song is.
    - If a page DOES fully reload (site opened as a file, F5, a browser quirk),
      this file puts the song back where it was and plays it again.
      Expect a short silence while the new page loads.

    The player itself is the <audio> inside #music-sample (outside <main>
    on every page). It is only visible on Home, but it exists on all pages.

    1. SAVE     remember playing / paused, position and volume
    2. RESUME   restore them when a page loads
*/

(function () {
    "use strict";

    var player = document.getElementById("music-sample");
    var audio = player ? player.querySelector("audio") : null;

    if (!audio) {
        return;   // this page has no music player
    }

    // Self-check: the Console one-liner reads this flag.
    document.documentElement.setAttribute("data-audio-js", "on");

    var STORAGE_KEY = "utl-music";   // sessionStorage: one tab only, cleared when the tab closes
    var leaving = false;             // true once the page is being left
    var waitingForClick = false;     // music should play, but the browser asked for a click first
    var lastSave = 0;
    var resumeTime = 0;


    /* ==========================================================
       1. SAVE: remember what the music is doing
       ========================================================== */

    function readState() {
        try {
            return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY));
        } catch (error) {
            return null;
        }
    }

    function saveState(force) {
        var now = Date.now();

        // Not while leaving (the browser pauses the audio as the page closes),
        // and at most once per second unless forced.
        if (leaving || (!force && now - lastSave < 1000)) {
            return;
        }
        lastSave = now;

        try {
            window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
                playing: !audio.paused || waitingForClick,
                time: audio.currentTime,
                savedAt: now,
                volume: audio.volume,
                muted: audio.muted
            }));
        } catch (error) {
            // Storage blocked: the music simply won't resume after a reload.
        }
    }

    // Last save right before the page closes, then stop saving.
    function saveAndLeave() {
        saveState(true);
        leaving = true;
    }

    audio.addEventListener("play", function () {
        waitingForClick = false;
        saveState(true);
    });

    audio.addEventListener("pause", function () {
        saveState(true);
    });

    audio.addEventListener("timeupdate", function () {
        saveState(false);
    });

    audio.addEventListener("volumechange", function () {
        saveState(true);
    });

    window.addEventListener("beforeunload", saveAndLeave);
    window.addEventListener("pagehide", saveAndLeave);


    /* ==========================================================
       2. RESUME: put the music back after a page loads
       ========================================================== */

    // Browsers may refuse to start sound without a click on the new page.
    // If so, wait for the first click / key press / tap and start then.
    function waitForInteraction() {
        var events = ["pointerdown", "keydown", "touchstart"];
        waitingForClick = true;

        function start() {
            events.forEach(function (name) {
                document.removeEventListener(name, start, true);
            });
            audio.play().catch(function () {
                waitingForClick = false;
            });
        }

        events.forEach(function (name) {
            document.addEventListener(name, start, true);
        });
    }

    function tryToPlay() {
        var attempt = audio.play();

        if (attempt && attempt.catch) {
            attempt.catch(waitForInteraction);
        }
    }

    function resume() {
        var saved = readState();

        if (!saved) {
            return;   // nothing was playing before
        }

        if (typeof saved.volume === "number") {
            audio.volume = saved.volume;
        }
        audio.muted = Boolean(saved.muted);

        // The song kept "running" while the new page loaded, so add that time.
        var elapsed = saved.playing ? (Date.now() - saved.savedAt) / 1000 : 0;
        resumeTime = (saved.time || 0) + elapsed;
        audio.currentTime = resumeTime;   // before the file loads this becomes the start position

        if (saved.playing) {
            tryToPlay();
        }
    }

    // The song is shorter than the time we added? Wrap around (the audio loops).
    audio.addEventListener("loadedmetadata", function () {
        if (resumeTime > 0 && isFinite(audio.duration) && resumeTime >= audio.duration - 0.25) {
            audio.currentTime = resumeTime % audio.duration;
        }
    });

    // Coming back with the Back button can restore a frozen copy of the page.
    window.addEventListener("pageshow", function (event) {
        if (event.persisted) {
            leaving = false;
            resume();
        }
    });

    resume();
})();
