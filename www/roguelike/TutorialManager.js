/**
 * SNAKE ROGUELIKE - Tutoriel "Serpent Academy"
 * Dr. Snakey enseigne les bases du mode Roguelike
 */

import { logger } from '../services/logger.js';

class TutorialManager {
    constructor() {
        this.currentScene = 0;
        this.isActive = false;
        this.tutorialContainer = null;
        this.miniCanvas = null;
        this.miniCtx = null;

        // Mini-jeu state
        this.snake = [];
        this.food = null;
        this.skulls = [];
        this.powerup = null;
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.gameLoop = null;
        this.combo = 0;
        this.isRock = false;
        this.rockTimer = 0;
        this.applesEaten = 0;
        this.sceneApplesEaten = 0;
        this.skullHit = false;

        // Grid config (petit pour tuto)
        this.gridSize = 10;
        this.cellSize = 30;

        // Dialogues
        this.currentDialogueIndex = 0;
        this.currentDialogues = null;
        this.onDialogueComplete = null;

        // Scenes définition (simplifié)
        this.scenes = [
            'welcome',
            'movement',      // Manger 3 pommes
            'combo_explain', // Explication combo (dialogue seul)
            'rock',         // Gameplay ghost + crâne
            'upgrades',
            'graduation'
        ];

        this.dialogues = {
            welcome: [
                { text: "Bienvenue a la Serpent Academy !", emotion: 'happy' },
                { text: "Je suis Dr. Snakey, ton instructeur.", emotion: 'normal' },
                { text: "Aujourd'hui... tu deviens chasseur !", emotion: 'excited' }
            ],
            movement_intro: [
                { text: "Commencons par les bases.", emotion: 'normal' },
                { text: "Swipe ou utilise les fleches pour te deplacer.", emotion: 'normal' }
            ],
            movement_success: [
                { text: "Excellent ! Tu grandis a chaque pomme !", emotion: 'happy' }
            ],
            combo_explain: [
                { text: "Maintenant, parlons du COMBO.", emotion: 'serious' },
                { text: "Chaque pomme augmente ton combo de 1.", emotion: 'normal' },
                { text: "Le combo = ta puissance. Plus il est haut, mieux c'est !", emotion: 'excited' },
                { text: "MAIS... les cranes divisent ton combo par 2 !", emotion: 'scared' },
                { text: "Evite-les a tout prix !", emotion: 'serious' }
            ],
            rock_intro: [
                { text: "Heureusement, tu as des allies...", emotion: 'happy' },
                { text: "Le mode Roche te rend INVINCIBLE !", emotion: 'excited' },
                { text: "Attrape-la et traverse le crane sans danger !", emotion: 'normal' }
            ],
            rock_success: [
                { text: "Parfait ! Tu maitrises la Roche !", emotion: 'happy' }
            ],
            upgrades: [
                { text: "Entre chaque stage, tu choisis une amelioration.", emotion: 'normal' },
                { text: "Certaines sont RARES... d'autres LEGENDAIRES !", emotion: 'excited' },
                { text: "Chaque run est unique. Experimente !", emotion: 'happy' }
            ],
            graduation: [
                { text: "Tu es pret, jeune serpent.", emotion: 'proud' },
                { text: "Montre-moi ce que tu vaux !", emotion: 'excited' }
            ]
        };
    }

    /**
     * Vérifie si le tutoriel a été complété
     */
    hasCompletedTutorial() {
        return localStorage.getItem('roguelike_tutorial_completed') === 'true';
    }

    /**
     * Marque le tutoriel comme complété
     */
    markCompleted() {
        localStorage.setItem('roguelike_tutorial_completed', 'true');
    }

    /**
     * Reset le tutoriel (pour debug)
     */
    resetTutorial() {
        localStorage.removeItem('roguelike_tutorial_completed');
    }

    /**
     * Démarre le tutoriel
     * @param {boolean} launchGameAfter - Si true, lance une run après le tuto (défaut: true)
     */
    start(launchGameAfter = true) {
        // Sauvegarder si on doit lancer le jeu après
        this.launchGameAfter = launchGameAfter;

        if (this.hasCompletedTutorial() && launchGameAfter) {
            this.launchRoguelike();
            return;
        }

        this.isActive = true;
        this.currentScene = 0;
        this.createUI();
        this.runScene('welcome');

        logger.log('[Tutorial] Démarré (launchGameAfter=' + launchGameAfter + ')');
    }

    /**
     * Crée l'interface du tutoriel
     */
    createUI() {
        this.tutorialContainer = document.createElement('div');
        this.tutorialContainer.id = 'tutorial-container';
        this.tutorialContainer.className = 'tutorial-container';
        this.tutorialContainer.innerHTML = `
            <!-- Background cyber -->
            <div class="tuto-background">
                <div class="tuto-grid-lines"></div>
                <div class="tuto-particles"></div>
            </div>

            <!-- Bouton Skip -->
            <button class="tuto-skip-btn" id="tuto-skip-btn">
                PASSER ▶▶
            </button>

            <!-- Zone Dr. Snakey -->
            <div class="tuto-character" id="tuto-character">
                <div class="tuto-snakey" id="tuto-snakey">
                    <div class="snakey-body">
                        <div class="snakey-glasses">👓</div>
                        <div class="snakey-face" id="snakey-face">◕‿◕</div>
                    </div>
                    <div class="snakey-coat">🥼</div>
                </div>
            </div>

            <!-- Bulle de dialogue -->
            <div class="tuto-dialogue-box hidden" id="tuto-dialogue-box">
                <div class="tuto-dialogue-text" id="tuto-dialogue-text"></div>
                <div class="tuto-dialogue-next" id="tuto-dialogue-next">[ Appuie pour continuer ]</div>
            </div>

            <!-- Zone de jeu mini -->
            <div class="tuto-game-area hidden" id="tuto-game-area">
                <div class="tuto-hud">
                    <div class="tuto-combo-display">
                        <span class="tuto-combo-label">COMBO</span>
                        <span class="tuto-combo-value" id="tuto-combo">0</span>
                    </div>
                    <div class="tuto-objective" id="tuto-objective">
                        P 0/3
                    </div>
                </div>
                <canvas id="tuto-canvas" width="300" height="300"></canvas>
                <div class="tuto-controls">
                    <div class="tuto-dpad">
                        <button class="tuto-dpad-btn tuto-dpad-up" id="tuto-up">^</button>
                        <button class="tuto-dpad-btn tuto-dpad-left" id="tuto-left">&lt;</button>
                        <button class="tuto-dpad-btn tuto-dpad-down" id="tuto-down">v</button>
                        <button class="tuto-dpad-btn tuto-dpad-right" id="tuto-right">&gt;</button>
                    </div>
                </div>
            </div>

            <!-- Ecran upgrades demo -->
            <div class="tuto-upgrades-demo hidden" id="tuto-upgrades-demo">
                <div class="tuto-upgrade-title">CHOISIS TON AMELIORATION</div>
                <div class="tuto-upgrade-cards">
                    <div class="tuto-upgrade-card rarity-common">
                        <div class="tuto-card-icon">XP</div>
                        <div class="tuto-card-name">Sagesse</div>
                        <div class="tuto-card-desc">+25% XP</div>
                        <div class="tuto-card-rarity">Commun</div>
                    </div>
                    <div class="tuto-upgrade-card rarity-rare">
                        <div class="tuto-card-icon">+1</div>
                        <div class="tuto-card-name">Seconde Chance</div>
                        <div class="tuto-card-desc">+1 vie</div>
                        <div class="tuto-card-rarity">Rare</div>
                    </div>
                    <div class="tuto-upgrade-card rarity-legendary">
                        <div class="tuto-card-icon">V</div>
                        <div class="tuto-card-name">Vampire</div>
                        <div class="tuto-card-desc">Vole des segments</div>
                        <div class="tuto-card-rarity">Legendaire</div>
                    </div>
                </div>
            </div>

            <!-- Achievement final -->
            <div class="tuto-achievement hidden" id="tuto-achievement">
                <div class="tuto-achievement-icon">OK</div>
                <div class="tuto-achievement-text">Diplome de la Serpent Academy</div>
            </div>
        `;

        document.body.appendChild(this.tutorialContainer);
        this.bindEvents();

        // Init canvas
        this.miniCanvas = document.getElementById('tuto-canvas');
        this.miniCtx = this.miniCanvas.getContext('2d');
    }

    /**
     * Bind les événements
     */
    bindEvents() {
        // Skip button
        document.getElementById('tuto-skip-btn').addEventListener('click', () => this.skip());

        // Dialogue box click
        document.getElementById('tuto-dialogue-box').addEventListener('click', () => this.nextDialogue());

        // D-pad controls
        document.getElementById('tuto-up')?.addEventListener('click', () => this.setDirection(0, -1));
        document.getElementById('tuto-down')?.addEventListener('click', () => this.setDirection(0, 1));
        document.getElementById('tuto-left')?.addEventListener('click', () => this.setDirection(-1, 0));
        document.getElementById('tuto-right')?.addEventListener('click', () => this.setDirection(1, 0));

        // Keyboard
        this.keyHandler = (e) => {
            if (!this.isActive) return;
            switch(e.key) {
                case 'ArrowUp': this.setDirection(0, -1); break;
                case 'ArrowDown': this.setDirection(0, 1); break;
                case 'ArrowLeft': this.setDirection(-1, 0); break;
                case 'ArrowRight': this.setDirection(1, 0); break;
                case ' ':
                case 'Enter':
                    this.nextDialogue();
                    break;
            }
        };
        document.addEventListener('keydown', this.keyHandler);

        // Touch swipe
        let touchStartX = 0, touchStartY = 0;
        const gameArea = document.getElementById('tuto-game-area');
        gameArea?.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        gameArea?.addEventListener('touchend', (e) => {
            const dx = e.changedTouches[0].clientX - touchStartX;
            const dy = e.changedTouches[0].clientY - touchStartY;
            if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
                if (Math.abs(dx) > Math.abs(dy)) {
                    this.setDirection(dx > 0 ? 1 : -1, 0);
                } else {
                    this.setDirection(0, dy > 0 ? 1 : -1);
                }
            }
        });
    }

    /**
     * Lance une scène par nom
     */
    runScene(sceneName) {
        logger.log(`[Tutorial] Scene: ${sceneName}`);

        // Cacher tout d'abord
        this.hideAllUI();

        switch(sceneName) {
            case 'welcome':
                this.showDialogueSequence('welcome', () => this.runScene('movement'));
                break;

            case 'movement':
                this.showDialogueSequence('movement_intro', () => this.startMovementGame());
                break;

            case 'combo_explain':
                this.showDialogueSequence('combo_explain', () => this.runScene('rock'));
                break;

            case 'rock':
                this.showDialogueSequence('rock_intro', () => this.startRockGame());
                break;

            case 'upgrades':
                this.showUpgradesDemo();
                break;

            case 'graduation':
                this.showGraduation();
                break;
        }
    }

    /**
     * Cache toutes les UI
     */
    hideAllUI() {
        document.getElementById('tuto-dialogue-box')?.classList.add('hidden');
        document.getElementById('tuto-game-area')?.classList.add('hidden');
        document.getElementById('tuto-upgrades-demo')?.classList.add('hidden');
        document.getElementById('tuto-hint')?.classList.add('hidden');
        document.getElementById('tuto-achievement')?.classList.add('hidden');
    }

    /**
     * Affiche une séquence de dialogues
     */
    showDialogueSequence(key, onComplete) {
        const dialogues = this.dialogues[key];
        if (!dialogues || dialogues.length === 0) {
            onComplete?.();
            return;
        }

        this.currentDialogueIndex = 0;
        this.currentDialogues = dialogues;
        this.onDialogueComplete = onComplete;

        document.getElementById('tuto-dialogue-box')?.classList.remove('hidden');
        document.getElementById('tuto-character')?.classList.remove('hidden');

        this.showDialogue(0);
    }

    /**
     * Affiche un dialogue
     */
    showDialogue(index) {
        const dialogue = this.currentDialogues[index];
        if (!dialogue) return;

        const textEl = document.getElementById('tuto-dialogue-text');
        const faceEl = document.getElementById('snakey-face');

        // Emotion
        const emotions = {
            normal: '◕‿◕',
            happy: '◕ω◕',
            excited: '◕ᴗ◕',
            worried: '◕︿◕',
            scared: '◕△◕',
            serious: '◕_◕',
            proud: '◕◡◕'
        };
        faceEl.textContent = emotions[dialogue.emotion] || emotions.normal;

        // Typewriter effect
        textEl.textContent = '';
        let i = 0;
        const typeWriter = () => {
            if (i < dialogue.text.length && this.isActive) {
                textEl.textContent += dialogue.text.charAt(i);
                i++;
                setTimeout(typeWriter, 25);
            }
        };
        typeWriter();

        if (window.audio?.buttonClick) window.audio.buttonClick();
    }

    /**
     * Dialogue suivant
     */
    nextDialogue() {
        if (!this.currentDialogues) return;

        this.currentDialogueIndex++;

        if (this.currentDialogueIndex >= this.currentDialogues.length) {
            this.currentDialogues = null;
            document.getElementById('tuto-dialogue-box')?.classList.add('hidden');
            this.onDialogueComplete?.();
        } else {
            this.showDialogue(this.currentDialogueIndex);
        }
    }

    // ========== MINI-JEUX ==========

    initMiniGame() {
        this.snake = [
            { x: 5, y: 5 },
            { x: 4, y: 5 },
            { x: 3, y: 5 }
        ];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.combo = 1;
        this.sceneApplesEaten = 0;
        this.isRock = false;
        this.rockTimer = 0;
        this.skulls = [];
        this.powerup = null;
        this.skullHit = false;
        this.food = null;

        this.updateComboDisplay();
    }

    /**
     * Jeu mouvement : manger 3 pommes
     */
    startMovementGame() {
        document.getElementById('tuto-game-area')?.classList.remove('hidden');
        document.getElementById('tuto-character')?.classList.add('hidden');
        this.hideHint(); // Pas de hint sur le gameplay
        this.updateObjective(0, 3);

        this.initMiniGame();
        this.spawnFood();
        this.startGameLoop();
    }

    /**
     * Jeu ghost : attraper ghost et traverser crane
     */
    startRockGame() {
        document.getElementById('tuto-game-area')?.classList.remove('hidden');
        document.getElementById('tuto-character')?.classList.add('hidden');
        this.hideHint(); // Pas de hint sur le gameplay
        this.updateObjective(0, 1, 'G');

        this.initMiniGame();
        this.combo = 5; // Commencer avec un combo pour montrer l'enjeu
        this.updateComboDisplay();

        // Placer le ghost et le crane
        this.spawnRockPowerup();
        this.spawnSkull();
        this.spawnFood(); // Une pomme aussi

        this.startGameLoop();
    }

    spawnFood() {
        let pos, attempts = 0;
        do {
            pos = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize)
            };
            attempts++;
        } while (this.isOccupied(pos) && attempts < 50);

        this.food = pos;
    }

    spawnSkull() {
        let pos, attempts = 0;
        do {
            pos = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize)
            };
            attempts++;
        } while (this.isOccupied(pos) && attempts < 50);

        this.skulls = [pos];
    }

    spawnRockPowerup() {
        let pos, attempts = 0;
        do {
            pos = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize)
            };
            attempts++;
        } while (this.isOccupied(pos) && attempts < 50);

        this.powerup = pos;
    }

    isOccupied(pos) {
        if (this.snake.some(s => s.x === pos.x && s.y === pos.y)) return true;
        if (this.food && this.food.x === pos.x && this.food.y === pos.y) return true;
        if (this.skulls.some(s => s.x === pos.x && s.y === pos.y)) return true;
        if (this.powerup && this.powerup.x === pos.x && this.powerup.y === pos.y) return true;
        return false;
    }

    setDirection(dx, dy) {
        if (this.direction.x === -dx && this.direction.y === -dy) return;
        if (dx === 0 && dy === 0) return;
        this.nextDirection = { x: dx, y: dy };
    }

    startGameLoop() {
        this.stopGameLoop();
        this.gameLoop = setInterval(() => this.gameTick(), 280);
    }

    stopGameLoop() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
    }

    gameTick() {
        if (!this.isActive) {
            this.stopGameLoop();
            return;
        }

        this.direction = { ...this.nextDirection };

        // Move head
        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;

        // Wrap around
        if (head.x < 0) head.x = this.gridSize - 1;
        if (head.x >= this.gridSize) head.x = 0;
        if (head.y < 0) head.y = this.gridSize - 1;
        if (head.y >= this.gridSize) head.y = 0;

        // Check food
        let ate = false;
        if (this.food && head.x === this.food.x && head.y === this.food.y) {
            ate = true;
            this.sceneApplesEaten++;
            this.combo++;
            this.updateComboDisplay();
            this.spawnFood();
            if (window.audio?.eatApple) window.audio.eatApple();

            // Check movement objective
            this.checkMovementObjective();
        }

        // Check skull
        const hitSkull = this.skulls.some(s => s.x === head.x && s.y === head.y);
        if (hitSkull) {
            if (this.isRock) {
                // Ghost mode: traverse sans dégât - VICTOIRE
                this.skullHit = true;
                this.skulls = this.skulls.filter(s => !(s.x === head.x && s.y === head.y));
                if (window.audio?.powerup) window.audio.powerup();
                this.checkRockObjective();
            } else {
                // Pas de ghost = GAME OVER, restart le mini-jeu
                if (window.audio?.hitSkull) window.audio.hitSkull();
                // Message d'erreur affiche dans l'objectif
                this.updateObjective(0, 1, 'X');

                // Retirer le crâne touché
                this.skulls = [];

                // Reset après un court délai
                setTimeout(() => {
                    if (this.isActive) {
                        this.restartRockGame();
                    }
                }, 1200);
                return; // Stop ce tick
            }
        }

        // Check powerup
        if (this.powerup && head.x === this.powerup.x && head.y === this.powerup.y) {
            this.isRock = true;
            this.rockTimer = 15; // ~3 secondes
            this.powerup = null;
            if (window.audio?.powerup) window.audio.powerup();

            // Objectif change quand ghost attrape
            this.updateObjective(1, 1, 'G');
        }

        // Ghost timer
        if (this.isRock) {
            this.rockTimer--;
            if (this.rockTimer <= 0) {
                this.isRock = false;
            }
        }

        // Move snake
        this.snake.unshift(head);
        if (!ate) {
            this.snake.pop();
        }

        // Auto-collision check (reset si collision)
        const body = this.snake.slice(1);
        if (body.some(s => s.x === head.x && s.y === head.y)) {
            // Reset snake position
            this.snake = [
                { x: 5, y: 5 },
                { x: 4, y: 5 },
                { x: 3, y: 5 }
            ];
            this.direction = { x: 1, y: 0 };
            this.nextDirection = { x: 1, y: 0 };
        }

        this.drawMiniGame();
    }

    checkMovementObjective() {
        this.updateObjective(this.sceneApplesEaten, 3);

        if (this.sceneApplesEaten >= 3) {
            this.stopGameLoop();
            this.hideHint();

            setTimeout(() => {
                this.hideAllUI();
                this.showDialogueSequence('movement_success', () => {
                    this.runScene('combo_explain');
                });
            }, 500);
        }
    }

    checkRockObjective() {
        if (this.skullHit) {
            this.stopGameLoop();
            this.hideHint();

            setTimeout(() => {
                this.hideAllUI();
                this.showDialogueSequence('rock_success', () => {
                    this.runScene('upgrades');
                });
            }, 500);
        }
    }

    /**
     * Restart le mini-jeu ghost apres echec
     */
    restartRockGame() {
        this.stopGameLoop();

        // Reset complet
        this.initMiniGame();
        this.combo = 5;
        this.updateComboDisplay();

        // Replacer ghost, skull et food
        this.spawnRockPowerup();
        this.spawnSkull();
        this.spawnFood();

        // Reset objectif
        this.updateObjective(0, 1, 'G');

        // Redessiner et relancer
        this.drawMiniGame();
        this.startGameLoop();
    }

    updateObjective(current, total, icon = 'P') {
        const el = document.getElementById('tuto-objective');
        if (el) {
            el.textContent = `${icon} ${current}/${total}`;
        }
    }

    drawMiniGame() {
        const ctx = this.miniCtx;
        const cell = this.cellSize;

        // Clear
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, 300, 300);

        // Grid
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= this.gridSize; i++) {
            ctx.beginPath();
            ctx.moveTo(i * cell, 0);
            ctx.lineTo(i * cell, 300);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * cell);
            ctx.lineTo(300, i * cell);
            ctx.stroke();
        }

        ctx.font = `${cell - 4}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Food
        if (this.food) {
            ctx.fillText('🍎', this.food.x * cell + cell/2, this.food.y * cell + cell/2);
        }

        // Skulls
        this.skulls.forEach(skull => {
            ctx.fillText('💀', skull.x * cell + cell/2, skull.y * cell + cell/2);
        });

        // Powerup
        if (this.powerup) {
            ctx.fillText('👻', this.powerup.x * cell + cell/2, this.powerup.y * cell + cell/2);
        }

        // Snake
        this.snake.forEach((segment, i) => {
            const x = segment.x * cell + 2;
            const y = segment.y * cell + 2;
            const size = cell - 4;

            if (this.isRock) {
                ctx.globalAlpha = 0.6;
                ctx.fillStyle = '#9c27b0';
            } else {
                ctx.globalAlpha = 1;
                ctx.fillStyle = i === 0 ? '#4CAF50' : '#81C784';
            }

            ctx.beginPath();
            ctx.roundRect(x, y, size, size, 5);
            ctx.fill();

            // Eyes on head
            if (i === 0) {
                ctx.fillStyle = 'white';
                ctx.globalAlpha = 1;
                ctx.beginPath();
                ctx.arc(x + size/3, y + size/3, 4, 0, Math.PI * 2);
                ctx.arc(x + size*2/3, y + size/3, 4, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = 'black';
                ctx.beginPath();
                ctx.arc(x + size/3 + this.direction.x * 2, y + size/3 + this.direction.y * 2, 2, 0, Math.PI * 2);
                ctx.arc(x + size*2/3 + this.direction.x * 2, y + size/3 + this.direction.y * 2, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        ctx.globalAlpha = 1;
    }

    updateComboDisplay() {
        const el = document.getElementById('tuto-combo');
        if (el) {
            el.textContent = this.combo;
            el.classList.remove('combo-pulse');
            void el.offsetWidth;
            el.classList.add('combo-pulse');
        }
    }

    showHint(text) {
        const hint = document.getElementById('tuto-hint');
        const hintText = document.getElementById('tuto-hint-text');
        if (hint && hintText) {
            hintText.textContent = text;
            hint.classList.remove('hidden');
        }
    }

    hideHint() {
        document.getElementById('tuto-hint')?.classList.add('hidden');
    }

    /**
     * Démo upgrades
     */
    showUpgradesDemo() {
        document.getElementById('tuto-character')?.classList.remove('hidden');
        document.getElementById('tuto-upgrades-demo')?.classList.remove('hidden');

        setTimeout(() => {
            this.showDialogueSequence('upgrades', () => {
                this.hideAllUI();
                this.runScene('graduation');
            });
        }, 1000);
    }

    /**
     * Graduation finale
     */
    showGraduation() {
        document.getElementById('tuto-character')?.classList.remove('hidden');

        this.showDialogueSequence('graduation', () => {
            this.hideAllUI();

            // Achievement popup
            const achievement = document.getElementById('tuto-achievement');
            achievement?.classList.remove('hidden');

            if (window.audio?.levelComplete) window.audio.levelComplete();

            setTimeout(() => {
                this.complete();
            }, 2500);
        });
    }

    /**
     * Skip le tutoriel
     */
    skip() {
        if (confirm('Passer le tutoriel ?')) {
            this.stopGameLoop();
            this.markCompleted();
            this.cleanup();
            this.launchRoguelike();
        }
    }

    /**
     * Termine le tutoriel
     */
    complete() {
        this.markCompleted();
        this.stopGameLoop();
        this.cleanup();
        logger.log('[Tutorial] Complété !');
        this.launchRoguelike();
    }

    /**
     * Nettoie l'UI
     */
    cleanup() {
        this.isActive = false;

        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
        }

        if (this.tutorialContainer) {
            this.tutorialContainer.remove();
            this.tutorialContainer = null;
        }
    }

    /**
     * Lance le mode Roguelike (ou retourne au hub si lancé depuis Options)
     */
    launchRoguelike() {
        // Si lancé depuis Options, retourner au hub au lieu de lancer une partie
        if (!this.launchGameAfter) {
            logger.log('[Tutorial] Retour au hub (lancé depuis Options)');
            // Cacher le menu options s'il est visible
            const optionsMenu = document.getElementById('options-menu');
            if (optionsMenu) {
                optionsMenu.classList.add('hidden');
            }
            // Retourner au hub
            if (window.backToMain) {
                window.backToMain();
            } else if (window.screenManager) {
                window.screenManager.show('hub');
            }
            return;
        }

        // Lancer une nouvelle run
        if (window.roguelikeManager) {
            window.roguelikeManager.startNewRun();
        }
    }
}

// Singleton
const tutorialManager = new TutorialManager();
window.tutorialManager = tutorialManager;

export default tutorialManager;
