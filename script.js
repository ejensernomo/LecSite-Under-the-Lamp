/*
    Full Name: Elisha Jenser A. Nomo
    Section: WD-202
    Activity: Under The Lamp
    File: Hamburger menu + header scroll state
*/

(function () {
    "use strict";

    var header = document.querySelector("header");
    var toggle = document.querySelector(".menu-toggle");
    var nav = document.getElementById("primary-nav");

    // If a page doesn't have the button, leave the normal menu alone.
    if (!header || !toggle || !nav) {
        return;
    }

    // Tells the CSS "JavaScript is working, you can use the hamburger layout".
    header.classList.add("nav-enabled");

    // Same breakpoint as the tablet media query in styles.css.
    var tabletUp = window.matchMedia("(min-width: 768px)");

    function setMenu(open, returnFocus) {
        nav.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");

        if (!open && returnFocus) {
            toggle.focus();
        }
    }

    // Home page: header floats over the hero, then turns solid after you scroll.
    function updateHeader() {
        header.classList.toggle("is-scrolled", window.scrollY > 40);
    }
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });

    // Tap the hamburger to open or close.
    toggle.addEventListener("click", function () {
        var isOpen = toggle.getAttribute("aria-expanded") === "true";
        setMenu(!isOpen);
    });

    // Close after choosing a link (helps same-page links like #experience).
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
})();