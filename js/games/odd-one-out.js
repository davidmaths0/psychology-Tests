(function () {
    // Each puzzle has one item outside the shared category. Round size grows
    // from four to seven words, with more closely related distractors later on.
    const ROUNDS = [
        [
            { words: ["Turquoise", "Black", "Olive", "Penguin"], odd: "Penguin", reason: "Penguin is an animal; the other words are colors." },
            { words: ["Red", "Banana", "Blue", "Green"], odd: "Banana", reason: "Banana is a fruit; the other words are colors." },
            { words: ["Mango", "Grape", "Violet", "Peach"], odd: "Violet", reason: "Violet is a color; the other words are fruits." }
        ],
        [
            { words: ["Soccer", "Badminton", "Volleyball", "Table Tennis", "Chess"], odd: "Chess", reason: "Chess is played on a board and uses no ball; the others are physical sports played with a ball or shuttlecock." },
            { words: ["Apple", "Pear", "Carrot", "Plum", "Peach"], odd: "Carrot", reason: "Carrot is a vegetable; the other words are fruits." },
            { words: ["Blue", "Yellow", "Circle", "Red", "Purple"], odd: "Circle", reason: "Circle is a shape; the other words are colors." }
        ],
        [
            { words: ["Badminton", "Tennis", "Squash", "Table Tennis", "Soccer", "Racquetball"], odd: "Soccer", reason: "Soccer is played mainly with the feet; the other sports use a racquet or paddle." },
            { words: ["Lemon", "Orange", "Lime", "Grapefruit", "Carrot", "Tangerine"], odd: "Carrot", reason: "Carrot is a root vegetable; the other words are citrus fruits." },
            { words: ["Scarlet", "Crimson", "Ruby", "Azure", "Cherry", "Vermilion"], odd: "Azure", reason: "Azure is a shade of blue; the other words are shades or names associated with red." }
        ],
        [
            { words: ["Lemon", "Lime", "Orange", "Grapefruit", "Tangerine", "Clementine", "Pineapple"], odd: "Pineapple", reason: "Pineapple is not a citrus fruit; the other six are citrus fruits." },
            { words: ["Soccer", "Rugby", "Basketball", "Volleyball", "Handball", "Water Polo", "Badminton"], odd: "Badminton", reason: "Badminton is played with a shuttlecock; the other sports use a ball." },
            { words: ["Turquoise", "Cyan", "Teal", "Aqua", "Navy", "Coral", "Azure"], odd: "Coral", reason: "Coral is a warm orange-pink shade; the other words are shades of blue or blue-green." }
        ]
    ];

    let roundIndex = 0;
    let mistakes = 0;
    let activePuzzle = null;
    let locked = false;
    let lastPuzzleIndex = -1;
    let retryTimeout = null;

    const byId = (id) => document.getElementById(id);
    const intro = byId("odd-intro");
    const play = byId("odd-play");
    const complete = byId("odd-complete");
    const correctOverlay = byId("odd-correct-overlay");
    const wordBoard = byId("odd-words");
    const feedback = byId("odd-feedback");
    const nextLink = byId("odd-next");

    function choosePuzzle() {
        const puzzles = ROUNDS[roundIndex];
        let next = Math.floor(Math.random() * puzzles.length);
        if (puzzles.length > 1 && next === lastPuzzleIndex) next = (next + 1) % puzzles.length;
        lastPuzzleIndex = next;
        activePuzzle = puzzles[next];
    }

    function renderRound() {
        if (retryTimeout !== null) {
            window.clearTimeout(retryTimeout);
            retryTimeout = null;
        }
        locked = false;
        choosePuzzle();
        byId("odd-round").textContent = `ROUND ${roundIndex + 1} / ${ROUNDS.length}`;
        byId("odd-progress").style.width = `${((roundIndex + 1) / ROUNDS.length) * 100}%`;
        feedback.textContent = "";
        feedback.className = "odd-feedback";
        wordBoard.innerHTML = "";
        activePuzzle.words.forEach((word) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "odd-word";
            button.textContent = word;
            button.addEventListener("click", () => chooseWord(word, button));
            wordBoard.appendChild(button);
        });
    }

    function chooseWord(word, button) {
        if (locked) return;
        locked = true;
        wordBoard.querySelectorAll("button").forEach((item) => { item.disabled = true; });

        if (word === activePuzzle.odd) {
            button.classList.add("odd-correct");
            byId("odd-explanation").textContent = activePuzzle.reason;
            nextLink.textContent = roundIndex === ROUNDS.length - 1 ? "See results" : "Next round";
            correctOverlay.classList.remove("hidden");
            requestAnimationFrame(() => correctOverlay.classList.add("visible"));
        } else {
            mistakes++;
            byId("odd-mistakes").textContent = mistakes;
            button.classList.add("odd-incorrect");
            feedback.textContent = "Not quite. Take another look at a new set of words for this round.";
            feedback.classList.add("incorrect");
            playErrorSound();
            retryTimeout = window.setTimeout(() => {
                retryTimeout = null;
                renderRound();
            }, 3000);
        }
    }

    function advanceRound() {
        if (!locked || correctOverlay.classList.contains("hidden")) return;
        correctOverlay.classList.remove("visible");
        window.setTimeout(() => correctOverlay.classList.add("hidden"), 250);
        roundIndex++;
        if (roundIndex === ROUNDS.length) showCompletion();
        else {
            lastPuzzleIndex = -1;
            renderRound();
        }
    }

    function playErrorSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.type = "square";
            oscillator.frequency.setValueAtTime(180, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + 0.15);
            gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.15);
        } catch (error) {
            // The game continues normally if audio is unavailable.
        }
    }

    function showCompletion() {
        play.classList.add("hidden");
        complete.classList.remove("hidden");
        byId("odd-final-mistakes").textContent = mistakes;
    }

    function startGame() {
        if (retryTimeout !== null) {
            window.clearTimeout(retryTimeout);
            retryTimeout = null;
        }
        roundIndex = 0;
        mistakes = 0;
        lastPuzzleIndex = -1;
        correctOverlay.classList.remove("visible");
        correctOverlay.classList.add("hidden");
        byId("odd-mistakes").textContent = "0";
        intro.classList.add("hidden");
        complete.classList.add("hidden");
        play.classList.remove("hidden");
        renderRound();
    }

    document.addEventListener("DOMContentLoaded", () => {
        if (!wordBoard) return;
        byId("odd-start").addEventListener("click", startGame);
        byId("odd-restart").addEventListener("click", startGame);
        byId("odd-play-again").addEventListener("click", startGame);
        nextLink.addEventListener("click", (event) => {
            event.preventDefault();
            advanceRound();
        });
    });
})();
