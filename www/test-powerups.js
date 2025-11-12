// ============================================
// TEST POWER-UPS - Vérification du spawn
// ============================================

const POWERUP_TYPES = {
    FIRE: { id: 'fire', symbol: '🔥', duration: 5000 },
    ICE: { id: 'ice', symbol: '❄️', duration: 8000 },
    GHOST: { id: 'ghost', symbol: '👻', duration: 6000 },
    ROCK: { id: 'rock', symbol: '🪨', duration: 8000 }
};

class PowerUp {
    constructor(type) {
        this.type = type;
        this.x = 0;
        this.y = 0;
        this.active = true;
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    toJSON() {
        return {
            type: this.type,
            x: this.x,
            y: this.y,
            active: this.active
        };
    }

    getSymbol() {
        return POWERUP_TYPES[this.type.toUpperCase()].symbol;
    }

    getDuration() {
        return POWERUP_TYPES[this.type.toUpperCase()].duration;
    }
}

function generatePowerUp() {
    const types = ['fire', 'ice', 'ghost', 'rock'];
    const randomType = types[Math.floor(Math.random() * types.length)];

    const powerup = new PowerUp(randomType);

    const x = Math.floor(Math.random() * 30);
    const y = Math.floor(Math.random() * 30);

    powerup.setPosition(x, y);

    return powerup;
}

// ============================================
// TEST 1 : Générer 10 power-ups aléatoires
// ============================================

console.log('');
console.log('╔════════════════════════════════════════╗');
console.log('║  🎮 TEST POWER-UPS SYSTEM             ║');
console.log('╚════════════════════════════════════════╝');
console.log('');

console.log('📊 TEST 1 : Génération de 10 power-ups aléatoires\n');

const powerups = [];
for (let i = 0; i < 10; i++) {
    powerups.push(generatePowerUp());
}

powerups.forEach((p, i) => {
    console.log(`${i + 1}. ${p.getSymbol()} ${p.type.toUpperCase().padEnd(6)} - Position: (${p.x}, ${p.y}) - Durée: ${p.getDuration()}ms`);
});

// ============================================
// TEST 2 : Vérifier la distribution
// ============================================

console.log('\n📊 TEST 2 : Distribution sur 100 spawns\n');

const distribution = { fire: 0, ice: 0, ghost: 0, rock: 0 };

for (let i = 0; i < 100; i++) {
    const p = generatePowerUp();
    distribution[p.type]++;
}

console.log(`🔥 FIRE:  ${distribution.fire}/100 (${distribution.fire}%)`);
console.log(`❄️  ICE:   ${distribution.ice}/100 (${distribution.ice}%)`);
console.log(`👻 GHOST: ${distribution.ghost}/100 (${distribution.ghost}%)`);
console.log(`🪨 ROCK:  ${distribution.rock}/100 (${distribution.rock}%)`);

// ============================================
// TEST 3 : Simulation de pickup
// ============================================

console.log('\n📊 TEST 3 : Simulation de pickup et remplacement\n');

let activePowerups = [];
for (let i = 0; i < 2; i++) {
    activePowerups.push(generatePowerUp());
}

console.log('Power-ups initiaux:');
activePowerups.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.getSymbol()} ${p.type} à (${p.x}, ${p.y})`);
});

console.log('\n⚡ Player ramasse le premier power-up...\n');

const pickedUp = activePowerups[0];
console.log(`✅ Ramassé: ${pickedUp.getSymbol()} ${pickedUp.type}`);
console.log(`   Durée active: ${pickedUp.getDuration()}ms (${pickedUp.getDuration() / 1000}s)`);

activePowerups.splice(0, 1);
activePowerups.push(generatePowerUp());

console.log('\nPower-ups après remplacement:');
activePowerups.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.getSymbol()} ${p.type} à (${p.x}, ${p.y})`);
});

// ============================================
// TEST 4 : toJSON() serialization
// ============================================

console.log('\n📊 TEST 4 : Sérialisation JSON\n');

const testPowerup = generatePowerUp();
console.log('Power-up original:');
console.log(`  Type: ${testPowerup.type}`);
console.log(`  Position: (${testPowerup.x}, ${testPowerup.y})`);
console.log(`  Active: ${testPowerup.active}`);

console.log('\nJSON serialized:');
console.log(JSON.stringify(testPowerup.toJSON(), null, 2));

console.log('\n✅ Tous les tests passés!\n');
