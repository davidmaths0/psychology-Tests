/**
 * find-the-matching-pairs.js
 *
 * "Find the Matching Pairs" — a no-timer, anti-stress memory game. Tap
 * two tiles that share the same icon; some tiles have no match at all
 * (the "unmatched" ones), so part of the challenge is recognizing which
 * tiles are even worth pairing up.
 *
 * Adapted from the original draft: same round/pairs/mistakes logic,
 * but icons are rendered with Tabler Icons (webfont linked in
 * find-the-matching-pairs.html) and class names use the match- prefix
 * so this game's CSS never collides with Find the Triplicate's game-
 * classes.
 */

(function () {

    // Round configuration — unchanged from the original draft
    const ROUNDS = [
        { cards: 9, pairs: 4, unmatched: 1 },
        { cards: 12, pairs: 5, unmatched: 2 },
        { cards: 15, pairs: 6, unmatched: 3 },
        { cards: 18, pairs: 7, unmatched: 4 }
    ];

    // Tabler icon names (requires the Tabler Icons webfont, linked in
    // find-the-matching-pairs.html) — rendered as <i class="ti ti-X">.
    const ICON_NAMES = [
        "bed", "music", "train", "pizza", "bike", "cookie", "plane",
        "ball-football", "car", "coffee", "camera", "headphones", "heart",
        "book", "umbrella", "tree", "fish", "apple", "home", "key",
        "star", "sun", "moon", "bell"
    ];

    // Game state
    let currentRound = 0;
    let matchedPairs = 0;
    let roundMistakes = 0;
    let totalMistakes = 0;
    let firstSelection = null;
    let locked = false;

    // DOM elements
    let board, roundDisplay, mistakesDisplay, totalMistakesDisplay,
        status, roundResult, roundResultTitle, roundResultText,
        finalResult, finalScore, playAgain;

    function startGame() {
        currentRound = 0;
        totalMistakes = 0;
        startRound();
    }

    function startRound() {
        matchedPairs = 0;
        roundMistakes = 0;
        firstSelection = null;
        locked = false;

        const round = ROUNDS[currentRound];

        roundDisplay.textContent = `${currentRound + 1} / ${ROUNDS.length}`;
        mistakesDisplay.textContent = "0";
        totalMistakesDisplay.textContent = totalMistakes;

        status.textContent = "";
        status.className = "match-status";

        roundResult.style.display = "none";
        finalResult.style.display = "none";

        board.className = `match-board round-${currentRound + 1}`;

        createBoard(round);
    }

    function createBoard(round) {
        board.innerHTML = "";

        const requiredUniqueIcons = round.pairs + round.unmatched;

        const shuffledIcons = [...ICON_NAMES].sort(() => Math.random() - 0.5);
        const selectedIcons = shuffledIcons.slice(0, requiredUniqueIcons);

        let cardIcons = [];

        for (let i = 0; i < round.pairs; i++) {
            cardIcons.push(selectedIcons[i], selectedIcons[i]);
        }

        for (let i = round.pairs; i < requiredUniqueIcons; i++) {
            cardIcons.push(selectedIcons[i]);
        }

        cardIcons = cardIcons.sort(() => Math.random() - 0.5);

        cardIcons.forEach((iconName) => {
            const card = document.createElement("button");
            card.className = "match-card";
            card.dataset.icon = iconName;
            card.setAttribute("aria-label", iconName.replace("-", " "));
            card.innerHTML = `<i class="ti ti-${iconName}"></i>`;
            card.addEventListener("click", () => selectCard(card));
            board.appendChild(card);
        });
    }

    function selectCard(card) {
        if (locked || card.classList.contains("matched") || card === firstSelection) {
            return;
        }

        if (!firstSelection) {
            firstSelection = card;
            card.classList.add("selected");
            return;
        }

        card.classList.add("selected");
        locked = true;

        checkPair(firstSelection, card);
    }

    function checkPair(card1, card2) {
        const isPair = card1.dataset.icon === card2.dataset.icon;

        if (isPair) {
            card1.classList.remove("selected");
            card2.classList.remove("selected");
            card1.classList.add("matched");
            card2.classList.add("matched");

            matchedPairs++;

            status.textContent = "Correct pair!";
            status.className = "match-status correct";

            firstSelection = null;
            locked = false;

            if (matchedPairs === ROUNDS[currentRound].pairs) {
                finishRound();
            }
        } else {
            roundMistakes++;
            totalMistakes++;

            mistakesDisplay.textContent = roundMistakes;
            totalMistakesDisplay.textContent = totalMistakes;

            card1.classList.add("wrong");
            card2.classList.add("wrong");

            status.textContent = "Wrong pair!";
            status.className = "match-status incorrect";

            playErrorSound();

            setTimeout(() => {
                card1.classList.remove("selected", "wrong");
                card2.classList.remove("selected", "wrong");
                firstSelection = null;
                locked = false;
            }, 500);
        }
    }

    function finishRound() {
        locked = true;

        roundResult.style.display = "block";
        roundResultTitle.textContent = `Round ${currentRound + 1} Complete!`;
        roundResultText.textContent = `Mistakes this round: ${roundMistakes}. Total mistakes: ${totalMistakes}.`;

        if (currentRound === ROUNDS.length - 1) {
            setTimeout(() => finishGame(), 1800);
        } else {
            setTimeout(() => {
                currentRound++;
                startRound();
            }, 2200);
        }
    }

    function finishGame() {
        board.innerHTML = "";
        status.textContent = "";
        roundResult.style.display = "none";
        finalResult.style.display = "block";
        finalScore.textContent = totalMistakes;
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

    document.addEventListener("DOMContentLoaded", () => {
        board = document.getElementById("gameBoard");
        roundDisplay = document.getElementById("roundDisplay");
        mistakesDisplay = document.getElementById("mistakesDisplay");
        totalMistakesDisplay = document.getElementById("totalMistakesDisplay");
        status = document.getElementById("status");
        roundResult = document.getElementById("roundResult");
        roundResultTitle = document.getElementById("roundResultTitle");
        roundResultText = document.getElementById("roundResultText");
        finalResult = document.getElementById("finalResult");
        finalScore = document.getElementById("finalScore");
        playAgain = document.getElementById("playAgain");

        if (!board) return; // not on this game's page

        playAgain.addEventListener("click", startGame);

        // No Start button for this game — it begins right away.
        startGame();
    });

})();
