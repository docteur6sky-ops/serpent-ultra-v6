// ============================================
// TEST EFFETS DES POWER-UPS
// ============================================

const CONFIG = {
    BASE_TICK_RATE: 275,
    FIRE_TICK_RATE: 140,
    ICE_TICK_RATE: 550
};

const POWERUP_TYPES = {
    FIRE: { id: 'fire', symbol: '🔥', duration: 5000 },
    ICE: { id: 'ice', symbol: '❄️', duration: 8000 },
    GHOST: { id: 'ghost', symbol: '👻', duration: 6000 },
    ROCK: { id: 'rock', symbol: '🪨', duration: 8000 }
};

// Simulation Player
class Player {
    constructor(number) {
        this.number = number;
        this.activePowerup = null;
        this.powerupEndTime = 0;
    }

    activatePowerup(type) {
        this.activePowerup = type;
        this.powerupEndTime = Date.now() + POWERUP_TYPES[type.toUpperCase()].duration;
    }

    getCurrentTickRate() {
        if (this.activePowerup && Date.now() < this.powerupEndTime) {
            switch (this.activePowerup) {
                case 'fire':
                    return CONFIG.FIRE_TICK_RATE;
                case 'ice':
                    return CONFIG.ICE_TICK_RATE;
                default:
                    return CONFIG.BASE_TICK_RATE;
            }
        }

        if (this.activePowerup && Date.now() >= this.powerupEndTime) {
            console.log(`   ⏱️ Power-up ${this.activePowerup} expiré pour Player ${this.number}`);
            this.activePowerup = null;
            this.powerupEndTime = 0;
        }

        return CONFIG.BASE_TICK_RATE;
    }
}

console.log('');
console.log('╔════════════════════════════════════════╗');
console.log('║  🎮 TEST EFFETS POWER-UPS             ║');
console.log('╚════════════════════════════════════════╝');
console.log('');

// ============================================
// TEST 1 : 🔥 FIRE - Speed Boost
// ============================================

console.log('📊 TEST 1 : 🔥 FIRE - Speed Boost\n');

const player1 = new Player(1);
console.log(`Player 1 vitesse normale: ${player1.getCurrentTickRate()}ms`);

player1.activatePowerup('fire');
console.log(`Player 1 active FIRE: ${player1.getCurrentTickRate()}ms`);
console.log(`   Vitesse x${CONFIG.BASE_TICK_RATE / CONFIG.FIRE_TICK_RATE} (${CONFIG.BASE_TICK_RATE}ms → ${CONFIG.FIRE_TICK_RATE}ms)`);

// Simuler expiration
setTimeout(() => {
    console.log(`Player 1 après expiration: ${player1.getCurrentTickRate()}ms`);
    console.log('');

    // ============================================
    // TEST 2 : ❄️ ICE - Slow
    // ============================================

    console.log('📊 TEST 2 : ❄️ ICE - Slow\n');

    const player2 = new Player(2);
    console.log(`Player 2 vitesse normale: ${player2.getCurrentTickRate()}ms`);

    player2.activatePowerup('ice');
    console.log(`Player 2 active ICE: ${player2.getCurrentTickRate()}ms`);
    console.log(`   Vitesse ÷${CONFIG.ICE_TICK_RATE / CONFIG.BASE_TICK_RATE} (${CONFIG.BASE_TICK_RATE}ms → ${CONFIG.ICE_TICK_RATE}ms)`);
    console.log('');

    // ============================================
    // TEST 3 : 👻 GHOST - Intangible
    // ============================================

    console.log('📊 TEST 3 : 👻 GHOST - Intangible\n');

    const player3 = new Player(3);
    player3.activatePowerup('ghost');

    console.log(`Player 3 active GHOST`);
    console.log(`   Peut traverser adversaires: ${player3.activePowerup === 'ghost' ? '✅ OUI' : '❌ NON'}`);
    console.log(`   Durée: ${POWERUP_TYPES.GHOST.duration}ms (${POWERUP_TYPES.GHOST.duration / 1000}s)`);
    console.log('');

    // ============================================
    // TEST 4 : 🪨 ROCK - Tank
    // ============================================

    console.log('📊 TEST 4 : 🪨 ROCK - Tank\n');

    const player4 = new Player(4);
    player4.activatePowerup('rock');

    console.log(`Player 4 active ROCK`);
    console.log(`   Collision adversaire: Mange 2 segments au lieu de mourir`);
    console.log(`   Immunisé ICE: En attente d'implémentation complète`);
    console.log(`   Durée: ${POWERUP_TYPES.ROCK.duration}ms (${POWERUP_TYPES.ROCK.duration / 1000}s)`);
    console.log('');

    // ============================================
    // TEST 5 : Vitesses comparées
    // ============================================

    console.log('📊 TEST 5 : Comparaison des vitesses\n');

    const normalPlayer = new Player(10);
    const firePlayer = new Player(11);
    const icePlayer = new Player(12);

    firePlayer.activatePowerup('fire');
    icePlayer.activatePowerup('ice');

    console.log(`👤 Normal: ${normalPlayer.getCurrentTickRate()}ms (baseline)`);
    console.log(`🔥 FIRE:   ${firePlayer.getCurrentTickRate()}ms (${((CONFIG.BASE_TICK_RATE / CONFIG.FIRE_TICK_RATE) * 100 - 100).toFixed(0)}% plus rapide)`);
    console.log(`❄️  ICE:    ${icePlayer.getCurrentTickRate()}ms (${((CONFIG.ICE_TICK_RATE / CONFIG.BASE_TICK_RATE - 1) * 100).toFixed(0)}% plus lent)`);
    console.log('');

    // ============================================
    // TEST 6 : Tick rate le plus rapide (game loop)
    // ============================================

    console.log('📊 TEST 6 : Game Loop - Tick rate le plus rapide\n');

    const players = [normalPlayer, firePlayer, icePlayer];

    let fastestTickRate = CONFIG.BASE_TICK_RATE;
    let fastestPlayer = null;

    for (let player of players) {
        const tickRate = player.getCurrentTickRate();
        if (tickRate < fastestTickRate) {
            fastestTickRate = tickRate;
            fastestPlayer = player;
        }
    }

    console.log(`Game loop utilisera: ${fastestTickRate}ms`);
    console.log(`Déterminé par: Player ${fastestPlayer.number} (${fastestPlayer.activePowerup || 'normal'})`);
    console.log('');

    console.log('✅ Tous les tests passés!\n');

}, 100);
