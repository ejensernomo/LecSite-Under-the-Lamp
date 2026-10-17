/*
    Full Name: Elisha Jenser A. Nomo
    Section: WD-202
    Activity: Under The Lamp
    File: script.js (used by every page)

    1. HEADER      hamburger menu + header scroll state
    2. PAGE SWAP   moves between pages WITHOUT a full reload,
                   so the music (player on Home) keeps playing
*/

(function () {
    "use strict";

    var header = document.querySelector("header");
    var toggle = document.querySelector(".menu-toggle");
    var nav = document.getElementById("primary-nav");


    /* ==========================================================
       1. HEADER: hamburger menu + scroll state
       ========================================================== */

    // Same breakpoint as the tablet media query in styles.css.
    var tabletUp = window.matchMedia("(min-width: 768px)");

    // Open or close the mobile menu.
    function setMenu(open, returnFocus) {
        nav.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");

        if (!open && returnFocus) {
            toggle.focus();
        }
    }

    // Home page: the header floats over the hero, then turns solid after you scroll.
    function updateHeader() {
        header.classList.toggle("is-scrolled", window.scrollY > 40);
    }

    if (header && toggle && nav) {
        // Tells the CSS "JavaScript is working, you can use the hamburger layout".
        header.classList.add("nav-enabled");

        updateHeader();
        window.addEventListener("scroll", updateHeader, { passive: true });

        // Tap the hamburger to open or close.
        toggle.addEventListener("click", function () {
            var isOpen = toggle.getAttribute("aria-expanded") === "true";
            setMenu(!isOpen);
        });

        // Close after choosing a link.
        nav.addEventListener("click", function (event) {
            if (event.target.closest("a")) {
                setMenu(false);
            }
        });

        // Close with the Escape key.
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && nav.classList.contains("is-open")) {
                setMenu(false, true);
            }
        });

        // Close when tapping anywhere outside the header.
        document.addEventListener("click", function (event) {
            if (!header.contains(event.target)) {
                setMenu(false);
            }
        });

        // Reset when the window grows to tablet/desktop so the menu isn't stuck open.
        tabletUp.addEventListener("change", function (event) {
            if (event.matches) {
                setMenu(false);
            }
        });
    }


    /* ==========================================================
       2. PAGE SWAP: change pages without reloading
       ----------------------------------------------------------
       A normal link reloads the whole page, which destroys the
       <audio> and stops the music. Instead we:
         - fetch the next page,
         - replace only <main> and <footer>,
         - leave the header and the music player untouched.
       The player (#music-sample) sits outside <main> on every page.
       The CSS only shows it on Home, but it keeps playing everywhere.
       It needs the site to run on a server (VS Code "Live Server",
       GitHub Pages, ...). Opened as a plain file (file://) the links
       just work normally, but the music stops between pages.
       ========================================================== */

    var canSwap = window.fetch && window.history && window.history.pushState &&
                  window.location.protocol !== "file:";

    // Self-check: the Console one-liner in the instructions reads this flag.
    document.documentElement.setAttribute("data-page-swap", canSwap ? "on" : "off");

    // Helpful messages in the browser console (press F12) if something is set up wrong.
    var player = document.getElementById("music-sample");

    if (!canSwap) {
        console.warn("[Under The Lamp] The page is opened as '" + window.location.protocol +
            "//', so links reload the whole page and the music stops. " +
            "Open the site with a server instead (VS Code 'Live Server': right-click index.html > Open with Live Server).");
    }

    if (player && player.closest("main")) {
        console.warn("[Under The Lamp] The music player (#music-sample) is inside <main>, so it is replaced " +
            "when you change pages. Move it to sit right after </main>, like in the new index.html.");
    }

    if (canSwap) {
        var swapId = 0;                                                   // ignores older, slower clicks
        var shownPage = window.location.pathname + window.location.search;

        // "/about.html" -> "about.html" ("/" -> "index.html")
        function fileName(href) {
            return new URL(href, window.location.href).pathname.split("/").pop() || "index.html";
        }

        // Underline the nav link of the page we are now on.
        function markActiveLink(href) {
            var current = fileName(href);

            document.querySelectorAll("#primary-nav a").forEach(function (link) {
                var isHere = fileName(link.href) === current;
                link.classList.toggle("active", isHere);

                if (isHere) {
                    link.setAttribute("aria-current", "page");
                } else {
                    link.removeAttribute("aria-current");
                }
            });
        }

        // Fetch a page and swap its <main> + <footer> into the current page.
        function loadPage(href, addToHistory) {
            var thisSwap = ++swapId;

            fetch(href)
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error("Page not found");
                    }
                    return response.text();
                })
                .then(function (html) {
                    if (thisSwap !== swapId) {
                        return;   // a newer click already took over
                    }

                    var next = new DOMParser().parseFromString(html, "text/html");
                    var nextMain = next.querySelector("main");
                    var nextFooter = next.querySelector("footer");

                    if (!nextMain || !nextFooter) {
                        throw new Error("Not a site page");
                    }

                    // The swap: header and music player are NOT touched.
                    document.querySelector("main").replaceWith(nextMain);
                    document.querySelector("footer").replaceWith(nextFooter);
                    document.title = next.title;
                    document.body.className = next.body.className;    // home / about / menu / contact

                    var description = document.querySelector('meta[name="description"]');
                    var nextDescription = next.querySelector('meta[name="description"]');
                    if (description && nextDescription) {
                        description.setAttribute("content", nextDescription.getAttribute("content"));
                    }

                    if (addToHistory) {
                        window.history.pushState(null, "", href);
                    }
                    shownPage = window.location.pathname + window.location.search;

                    markActiveLink(href);
                    window.scrollTo(0, 0);
                    updateHeader();

                    // Move keyboard / screen-reader focus to the new page content.
                    nextMain.setAttribute("tabindex", "-1");
                    nextMain.focus({ preventScroll: true });
                })
                .catch(function () {
                    window.location.href = href;   // anything went wrong: do a normal page load
                });
        }

        // Click on an internal page link -> swap instead of reload.
        document.addEventListener("click", function (event) {
            var link = event.target.closest("a");

            if (!link || event.defaultPrevented || event.button !== 0 ||
                event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                return;
            }
            if ((link.target && link.target !== "_self") || link.hasAttribute("download")) {
                return;
            }

            var url = new URL(link.href, window.location.href);
            var isSamePage = url.pathname === window.location.pathname && url.search === window.location.search;

            if (url.origin !== window.location.origin || !/(\.html?|\/)$/.test(url.pathname)) {
                return;   // other websites, tel:, files ... behave normally
            }
            if (isSamePage && url.hash) {
                return;   // jump to a section on this page
            }

            event.preventDefault();

            if (isSamePage) {
                window.scrollTo({ top: 0, behavior: "smooth" });   // e.g. clicking "Home" while on Home
            } else {
                loadPage(url.href, true);
            }
        });

        // Browser Back / Forward buttons.
        window.addEventListener("popstate", function () {
            if (window.location.pathname + window.location.search !== shownPage) {
                loadPage(window.location.href, false);
            }
        });
    }
})();