/**
 * MemoMonde - Moteur de Jeu & Logique de Quiz (App Engine)
 */

const QuizGame = {
    settings: {
        continent: "all",
        category: "all", // "all", "capital", "flag", "language", "currency", "location"
        mechanic: "mixed", // "qcm", "click", "mixed"
        totalQuestions: 20
    },

    state: {
        active: false,
        questions: [],
        currentIndex: 0,
        score: 0,
        streak: 0,
        maxStreak: 0,
        errors: [],
        currentQuestion: null,
        answered: false,
        startTime: null,
        antiCheatActive: true
    },

    init() {
        MapController.init("world-map-svg", "map-tooltip");
        this.bindEvents();
        this.loadTheme();
        
        // Register map click for "click" mode questions
        MapController.onCountryClick((country) => {
            if (this.state.active && this.state.currentQuestion && this.state.currentQuestion.type === "click_on_map") {
                this.handleMapClickAnswer(country);
            }
        });
    },

    bindEvents() {
        // Theme toggle
        document.getElementById("btn-toggle-theme").addEventListener("click", () => {
            this.toggleTheme();
        });

        // Mute toggle
        document.getElementById("btn-toggle-sound").addEventListener("click", () => {
            const isMuted = SoundEngine.toggleMute();
            const btn = document.getElementById("btn-toggle-sound");
            btn.innerHTML = isMuted ? "🔇" : "🔊";
            btn.setAttribute("title", isMuted ? "Activer le son" : "Couper le son");
        });

        // Start Quiz button
        document.getElementById("btn-start-quiz").addEventListener("click", () => {
            this.startNewQuiz();
        });

        // Next Question button (for wrong answers or manual next)
        document.getElementById("btn-next-question").addEventListener("click", () => {
            this.nextQuestion();
        });

        // Restart Quiz button from Bilan
        document.getElementById("btn-restart-quiz").addEventListener("click", () => {
            this.showSetupScreen();
        });

        // Zoom map controls
        document.getElementById("btn-zoom-in").addEventListener("click", () => MapController.zoom(0.75));
        document.getElementById("btn-zoom-out").addEventListener("click", () => MapController.zoom(1.3));
        document.getElementById("btn-zoom-reset").addEventListener("click", () => MapController.resetZoom());
    },

    toggleTheme() {
        const body = document.body;
        const current = body.getAttribute("data-theme") || "dark";
        const next = current === "dark" ? "light" : "dark";
        body.setAttribute("data-theme", next);
        localStorage.setItem("memomonde_theme", next);
        
        const btn = document.getElementById("btn-toggle-theme");
        btn.innerHTML = next === "dark" ? "🌙" : "☀️";
    },

    loadTheme() {
        const saved = localStorage.getItem("memomonde_theme") || "dark";
        document.body.setAttribute("data-theme", saved);
        document.getElementById("btn-toggle-theme").innerHTML = saved === "dark" ? "🌙" : "☀️";
    },

    readSettingsFromUI() {
        this.settings.continent = document.getElementById("select-continent").value;
        this.settings.category = document.getElementById("select-category").value;
        this.settings.mechanic = document.getElementById("select-mechanic").value;
        this.settings.totalQuestions = parseInt(document.getElementById("select-qcount").value, 10);
    },

    showSetupScreen() {
        document.getElementById("screen-setup").classList.remove("hidden");
        document.getElementById("screen-quiz").classList.add("hidden");
        document.getElementById("screen-bilan").classList.add("hidden");
        MapController.clearHighlights();
        MapController.resetZoom();
        MapController.setAntiCheat(false);
    },

    startNewQuiz() {
        SoundEngine.playClick();
        this.readSettingsFromUI();

        const countryPool = CountryDB.getByContinent(this.settings.continent);
        if (countryPool.length < 4) {
            alert("Veuillez sélectionner une catégorie avec suffisamment de pays.");
            return;
        }

        // Prepare Questions
        this.state.questions = this.generateQuestions(countryPool, this.settings.totalQuestions);
        this.state.currentIndex = 0;
        this.state.score = 0;
        this.state.streak = 0;
        this.state.maxStreak = 0;
        this.state.errors = [];
        this.state.active = true;
        this.state.startTime = Date.now();
        this.state.antiCheatActive = true;

        MapController.setAntiCheat(true);

        document.getElementById("screen-setup").classList.add("hidden");
        document.getElementById("screen-bilan").classList.add("hidden");
        document.getElementById("screen-quiz").classList.remove("hidden");

        this.renderCurrentQuestion();
    },

    generateQuestions(pool, count) {
        const questions = [];
        const shuffledPool = [...pool].sort(() => 0.5 - Math.random());
        const effectiveCount = Math.min(count, shuffledPool.length);

        const possibleTypes = [];
        const cat = this.settings.category;
        const mech = this.settings.mechanic;

        if (mech === "click") {
            possibleTypes.push("click_on_map");
        } else { // QCM or Mixed
            if (cat === "all" || cat === "location") {
                possibleTypes.push("map_highlight_to_country");
                if (mech === "mixed") possibleTypes.push("click_on_map");
            }
            if (cat === "all" || cat === "capital") {
                possibleTypes.push("country_to_capital");
                possibleTypes.push("capital_to_country");
            }
            if (cat === "all" || cat === "flag") {
                possibleTypes.push("flag_to_country");
            }
            if (cat === "all" || cat === "language") {
                possibleTypes.push("country_to_language");
            }
            if (cat === "all" || cat === "currency") {
                possibleTypes.push("country_to_currency");
            }
        }

        if (possibleTypes.length === 0) {
            possibleTypes.push("country_to_capital");
        }

        for (let i = 0; i < effectiveCount; i++) {
            const targetCountry = shuffledPool[i];
            const qType = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
            
            // Build distractor options
            const distractors = CountryDB.getRandom(3, targetCountry.id, targetCountry.continent);
            const allOptions = [...distractors, targetCountry].sort(() => 0.5 - Math.random());

            questions.push({
                type: qType,
                target: targetCountry,
                options: allOptions
            });
        }

        return questions;
    },

    renderCurrentQuestion() {
        this.state.answered = false;
        MapController.clearHighlights();

        const q = this.state.questions[this.state.currentIndex];
        this.state.currentQuestion = q;

        // Update Header & Progress
        const currentNum = this.state.currentIndex + 1;
        const totalNum = this.state.questions.length;
        document.getElementById("quiz-progress-text").innerText = `Question ${currentNum} / ${totalNum}`;
        document.getElementById("quiz-progress-bar").style.width = `${(currentNum / totalNum) * 100}%`;
        document.getElementById("quiz-score-live").innerText = `Score: ${this.state.score}`;

        const questionPromptEl = document.getElementById("question-prompt");
        const questionSubtextEl = document.getElementById("question-subtext");
        const optionsContainer = document.getElementById("options-container");
        const mapInstructionEl = document.getElementById("map-instruction-banner");
        const nextBtn = document.getElementById("btn-next-question");
        const educationalCard = document.getElementById("educational-card");

        nextBtn.classList.add("hidden");
        educationalCard.classList.add("hidden");
        mapInstructionEl.classList.add("hidden");
        optionsContainer.innerHTML = "";

        // Reset map focus
        MapController.resetZoom();

        // Helper for Flag CDN images with fallback
        const getFlagImg = (code, size = "small", fallbackEmoji = "") => {
            if (!code) return fallbackEmoji;
            const lower = code.toLowerCase();
            let imgClass = "flag-img-small";
            let width = "w80";
            if (size === "large") {
                imgClass = "flag-img-large";
                width = "w320";
            } else if (size === "medium") {
                imgClass = "flag-img-medium";
                width = "w160";
            }
            return `<img src="https://flagcdn.com/${width}/${lower}.png" alt="${code}" class="${imgClass}" loading="lazy" onerror="this.onerror=null; this.src='https://flagcdn.com/${width}/un.png';">`;
        };

        // Render question based on type
        switch (q.type) {
            case "flag_to_country":
                questionPromptEl.innerHTML = `<div class="flag-wrapper-large">${getFlagImg(q.target.id, 'large', q.target.flag)}</div><span>À quel pays appartient ce drapeau ?</span>`;
                questionSubtextEl.innerText = `Continent : ${q.target.continent}`;
                this.renderQcmOptions(q.options, q.target.name, (opt) => `<span>${opt.name}</span>`, (opt) => opt.name);
                break;

            case "country_to_capital":
                questionPromptEl.innerHTML = `${getFlagImg(q.target.id, 'medium', q.target.flag)} <strong>${q.target.name}</strong>`;
                questionSubtextEl.innerText = "Quelle est la capitale de ce pays ?";
                this.renderQcmOptions(q.options, q.target.capital, (opt) => opt.capital, (opt) => opt.capital);
                break;

            case "capital_to_country":
                questionPromptEl.innerHTML = `📍 <strong>${q.target.capital}</strong>`;
                questionSubtextEl.innerText = "De quel pays cette ville est-elle la capitale ?";
                this.renderQcmOptions(q.options, q.target.name, (opt) => `<span>${opt.name}</span>`, (opt) => opt.name);
                break;

            case "country_to_language":
                questionPromptEl.innerHTML = `${getFlagImg(q.target.id, 'medium', q.target.flag)} <strong>${q.target.name}</strong>`;
                questionSubtextEl.innerText = "Quelle est la langue principale officielle de ce pays ?";
                this.renderQcmOptions(q.options, q.target.language, (opt) => opt.language, (opt) => opt.language);
                break;

            case "country_to_currency":
                questionPromptEl.innerHTML = `${getFlagImg(q.target.id, 'medium', q.target.flag)} <strong>${q.target.name}</strong>`;
                questionSubtextEl.innerText = "Quelle est la monnaie officielle de ce pays ?";
                this.renderQcmOptions(q.options, q.target.currency, (opt) => opt.currency, (opt) => opt.currency);
                break;

            case "map_highlight_to_country":
                questionPromptEl.innerHTML = "🔍 Identifiez le pays en surbrillance sur la carte";
                questionSubtextEl.innerText = `Continent : ${q.target.continent}`;
                MapController.highlightCountry(q.target.id, "target");
                MapController.focusOnCountry(q.target.id);
                this.renderQcmOptions(q.options, q.target.name, (opt) => `<span>${opt.name}</span>`, (opt) => opt.name);
                break;

            case "click_on_map":
                questionPromptEl.innerHTML = `🎯 Cliquez sur la carte pour localiser :`;
                questionSubtextEl.innerHTML = `${getFlagImg(q.target.id, 'medium', q.target.flag)} <strong>${q.target.name}</strong> (Capitale : ${q.target.capital})`;
                mapInstructionEl.innerText = `Localisez ${q.target.name} en cliquant directement sur le tracé de la carte !`;
                mapInstructionEl.classList.remove("hidden");
                break;
        }
    },

    renderQcmOptions(options, correctValue, labelFn, valueFn = null) {
        const optionsContainer = document.getElementById("options-container");
        optionsContainer.innerHTML = "";

        const getValue = valueFn || labelFn;

        options.forEach(opt => {
            const btn = document.createElement("button");
            btn.className = "qcm-option-btn glass-card";
            btn.innerHTML = labelFn(opt);
            const val = String(getValue(opt)).trim();
            btn.dataset.value = val;

            btn.addEventListener("click", () => {
                if (this.state.answered) return;
                this.handleQcmAnswer(btn, val, correctValue);
            });

            optionsContainer.appendChild(btn);
        });
    },

    handleQcmAnswer(selectedBtn, selectedValue, correctValue) {
        this.state.answered = true;
        const q = this.state.currentQuestion;
        
        const normSelected = String(selectedValue).trim().toLowerCase();
        const normCorrect = String(correctValue).trim().toLowerCase();
        const isCorrect = (normSelected === normCorrect);

        const allButtons = document.querySelectorAll(".qcm-option-btn");
        allButtons.forEach(btn => {
            btn.disabled = true;
            if (String(btn.dataset.value).trim().toLowerCase() === normCorrect) {
                btn.classList.add("correct");
            }
        });

        if (isCorrect) {
            selectedBtn.classList.add("correct");
            SoundEngine.playCorrect();
            this.state.score++;
            this.state.streak++;
            if (this.state.streak > this.state.maxStreak) {
                this.state.maxStreak = this.state.streak;
            }
            MapController.highlightCountry(q.target.id, "correct");

            // Auto-advance after 1.0s on correct answer
            setTimeout(() => {
                this.nextQuestion();
            }, 1000);
        } else {
            selectedBtn.classList.add("wrong");
            SoundEngine.playWrong();
            this.state.streak = 0;
            MapController.highlightCountry(q.target.id, "correct");
            this.recordError(selectedValue, correctValue);
            this.showEducationalCard();
        }
    },

    handleMapClickAnswer(clickedCountry) {
        if (this.state.answered) return;
        this.state.answered = true;

        const q = this.state.currentQuestion;
        const isCorrect = (clickedCountry.id === q.target.id);

        if (isCorrect) {
            MapController.highlightCountry(q.target.id, "correct");
            SoundEngine.playCorrect();
            this.state.score++;
            this.state.streak++;
            if (this.state.streak > this.state.maxStreak) {
                this.state.maxStreak = this.state.streak;
            }

            setTimeout(() => {
                this.nextQuestion();
            }, 1000);
        } else {
            MapController.highlightCountry(clickedCountry.id, "wrong");
            MapController.highlightCountry(q.target.id, "correct");
            SoundEngine.playWrong();
            this.state.streak = 0;

            this.recordError(clickedCountry.name, q.target.name);
            this.showEducationalCard();
        }
    },

    recordError(userVal, correctVal) {
        const q = this.state.currentQuestion;
        this.state.errors.push({
            questionNumber: this.state.currentIndex + 1,
            targetCountry: q.target,
            userAnswer: userVal,
            correctAnswer: correctVal
        });
    },

    showEducationalCard() {
        const eduCard = document.getElementById("educational-card");
        const nextBtn = document.getElementById("btn-next-question");
        const target = this.state.currentQuestion.target;

        const getFlagImg = (code, size = "small") => {
            if (!code) return "";
            const lower = code.toLowerCase();
            let imgClass = "flag-img-medium";
            let width = "w160";
            if (size === "large") { imgClass = "flag-img-large"; width = "w320"; }
            return `<img src="https://flagcdn.com/${width}/${lower}.png" alt="${code}" class="${imgClass}" loading="lazy" onerror="this.style.display='none'">`;
        };

        document.getElementById("edu-flag").innerHTML = getFlagImg(target.id, 'medium');
        document.getElementById("edu-country-name").innerText = target.name;
        document.getElementById("edu-capital").innerText = target.capital;
        document.getElementById("edu-continent").innerText = target.continent;
        document.getElementById("edu-language").innerText = target.language;
        document.getElementById("edu-currency").innerText = target.currency;

        eduCard.classList.remove("hidden");
        nextBtn.classList.remove("hidden");
    },

    nextQuestion() {
        this.state.currentIndex++;
        if (this.state.currentIndex < this.state.questions.length) {
            this.renderCurrentQuestion();
        } else {
            this.finishQuiz();
        }
    },

    finishQuiz() {
        this.state.active = false;
        SoundEngine.playVictory();
        MapController.setAntiCheat(false);

        document.getElementById("screen-quiz").classList.add("hidden");
        document.getElementById("screen-bilan").classList.remove("hidden");

        const total = this.state.questions.length;
        const score = this.state.score;
        const scoreOutOf20 = Math.round((score / total) * 20 * 10) / 10;

        document.getElementById("bilan-score-raw").innerText = `${score} / ${total}`;
        document.getElementById("bilan-score-20").innerText = `${scoreOutOf20} / 20`;

        // Rank Badge & Message
        let rankText = "";
        let rankClass = "";

        if (scoreOutOf20 >= 19) {
            rankText = "🏆 Maître Géographe du Monde !";
            rankClass = "rank-gold";
        } else if (scoreOutOf20 >= 15) {
            rankText = "🌟 Grand Explorateur !";
            rankClass = "rank-silver";
        } else if (scoreOutOf20 >= 11) {
            rankText = "🌍 Voyageur Curieux";
            rankClass = "rank-bronze";
        } else if (scoreOutOf20 >= 7) {
            rankText = "🗺️ Apprenti Cartographe";
            rankClass = "rank-normal";
        } else {
            rankText = "🌱 Débutant en Géographie";
            rankClass = "rank-low";
        }

        const badgeEl = document.getElementById("bilan-rank-badge");
        badgeEl.innerText = rankText;
        badgeEl.className = `rank-badge ${rankClass}`;

        // Helper for flag
        const getFlagImg = (code) => {
            if (!code) return "";
            const lower = code.toLowerCase();
            return `<img src="https://flagcdn.com/w80/${lower}.png" alt="${code}" class="flag-img-small" loading="lazy" onerror="this.style.display='none'">`;
        };

        // Render Errors Table
        const errorListEl = document.getElementById("bilan-error-list");
        errorListEl.innerHTML = "";

        if (this.state.errors.length === 0) {
            errorListEl.innerHTML = `<div class="perfect-score-msg">🎉 Sans faute ! Félicitations, vous connaissez parfaitement les pays du monde !</div>`;
        } else {
            const table = document.createElement("table");
            table.className = "error-table";
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>N°</th>
                        <th>Pays</th>
                        <th>Votre réponse</th>
                        <th>Bonne réponse</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;

            const tbody = table.querySelector("tbody");
            this.state.errors.forEach(err => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>Q${err.questionNumber}</td>
                    <td>${getFlagImg(err.targetCountry.id)} <strong>${err.targetCountry.name}</strong></td>
                    <td class="text-wrong">${err.userAnswer}</td>
                    <td class="text-correct">${err.correctAnswer}</td>
                    <td><button class="btn-review-item">🔎 Voir sur la carte</button></td>
                `;

                tr.querySelector(".btn-review-item").addEventListener("click", () => {
                    MapController.clearHighlights();
                    MapController.highlightCountry(err.targetCountry.id, "correct");
                    MapController.focusOnCountry(err.targetCountry.id);
                    // Scroll map to top view
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });

                tbody.appendChild(tr);
            });

            errorListEl.appendChild(table);
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    QuizGame.init();
});
