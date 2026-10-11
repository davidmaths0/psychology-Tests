/**
 * collapsible-list.js
 *
 * Folds a long list under a "View more" link that opens like a curtain.
 *
 * Usage — mark the list in the HTML and just keep adding items to it:
 *
 *   <section class="tests" data-collapsible data-visible="4">
 *       <a class="test-card">…</a>   <!-- the first 4 are always shown -->
 *       <a class="test-card">…</a>
 *       …                            <!-- anything after goes under "View more" -->
 *   </section>
 *
 * - If the list has `data-visible` items or fewer, nothing happens (no link).
 * - Without JavaScript the whole list simply stays visible.
 * - Opening/closing is animated in CSS (see "Collapsible list" in styles.css).
 */

(function () {

    const DEFAULT_VISIBLE = 4;
    const LABEL_MORE = "View more";
    const LABEL_LESS = "View less";

    function prefersReducedMotion() {
        return Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }

    function initList(list, index) {
        const visible = parseInt(list.dataset.visible, 10) || DEFAULT_VISIBLE;
        const items = Array.from(list.children);

        if (items.length <= visible) return; // nothing to fold away

        // Move the extra items into a collapsible block placed right after the list
        const id = `${list.id || `collapsible-list-${index}`}-more`;

        const more = document.createElement("div");
        more.className = "collapsible-more";
        more.id = id;

        const inner = document.createElement("div");
        inner.className = "collapsible-more-inner";

        const group = document.createElement("div");
        group.className = list.className; // same layout/spacing as the visible items

        items.slice(visible).forEach((item) => group.appendChild(item));
        inner.appendChild(group);
        more.appendChild(inner);
        list.after(more);

        // "View more" link, aligned to the right under the list
        const row = document.createElement("div");
        row.className = "collapsible-toggle-row";

        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "collapsible-toggle";
        toggle.textContent = LABEL_MORE;
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-controls", id);

        row.appendChild(toggle);
        more.after(row);

        toggle.addEventListener("click", () => {
            const willOpen = !more.classList.contains("open");

            toggle.setAttribute("aria-expanded", String(willOpen));
            toggle.textContent = willOpen ? LABEL_LESS : LABEL_MORE;

            if (willOpen) {
                more.classList.add("open");
                // With no animation there's no transitionend, so settle right away
                if (prefersReducedMotion()) more.classList.add("settled");
            } else {
                more.classList.remove("settled", "open");
            }
        });

        // Once the curtain has finished opening, stop clipping so the cards'
        // hover shadows aren't cut off at the edges.
        more.addEventListener("transitionend", (event) => {
            if (
                event.target === more &&
                event.propertyName === "grid-template-rows" &&
                more.classList.contains("open")
            ) {
                more.classList.add("settled");
            }
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll("[data-collapsible]").forEach(initList);
    });

})();
