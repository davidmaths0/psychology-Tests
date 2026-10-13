/**
 * my-results.js
 * Renders the "My Results" page by reading each test's saved progress
 * from localStorage (the same storage quiz-engine.js writes to).
 *
 * To register a new test here, just add it to TESTS below — nothing
 * else needs to change.
 */

const TESTS = [
    { id: "gad7", title: "Anxiety Test (GAD-7)", description: "Generalized anxiety symptoms.", url: "tests/gad7.html" },
    { id: "adhd", title: "ADHD Self-Assessment", description: "Attention and activity-level patterns.", url: "tests/adhd.html" },
    { id: "autism", title: "Autism Traits Self-Assessment", description: "Common autism-related trait patterns.", url: "tests/autism.html" },
    // `version` must match the version in js/tests/bipolar-data.js. Progress saved
    // with a different version is ignored (the quiz itself discards it too).
    { id: "bipolar", title: "Bipolar Mood Patterns Self-Assessment", description: "Changes in mood, energy, sleep, and activity.", url: "tests/bipolar.html", version: 2 }
];

/**
 * Reads a test's saved progress. Returns null if nothing is saved
 * (or if localStorage isn't available).
 */
function getProgress(testId, version) {
    try {
        const raw = localStorage.getItem(`quiz-progress:${testId}`);
        const saved = raw ? JSON.parse(raw) : null;
        if (saved && version !== undefined && saved.version !== version) return null;
        return saved;
    } catch (error) {
        console.warn("my-results.js: could not read saved progress.", error);
        return null;
    }
}

/**
 * Turns a test's saved progress into a { label, cssClass, actionLabel }
 * description for rendering.
 */
function describeStatus(progress, totalQuestions) {
    if (progress && progress.completed) {
        return { label: "Completed", cssClass: "status-done", actionLabel: "View results" };
    }

    const answeredCount = progress ? Object.keys(progress.answers || {}).length : 0;

    if (answeredCount > 0) {
        return {
            label: `In progress (${answeredCount} answered)`,
            cssClass: "status-progress",
            actionLabel: "Continue"
        };
    }

    return { label: "Not started", cssClass: "status-none", actionLabel: "Start test" };
}

function renderHistory() {
    const list = document.getElementById("results-list");
    if (!list) return;

    list.innerHTML = TESTS.map((test) => {
        const progress = getProgress(test.id, test.version);
        const status = describeStatus(progress);

        return `
            <a href="${test.url}" class="test-card">

                <div class="test-info">
                    <h2>${test.title}</h2>
                    <p>${test.description}</p>
                    <span class="result-status ${status.cssClass}">${status.label}</span>
                </div>

                <div class="arrow">
                    →
                </div>

            </a>
        `;
    }).join("");
}

renderHistory();