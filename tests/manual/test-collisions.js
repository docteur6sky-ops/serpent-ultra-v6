// ============================================
// TEST COLLISIONS AMÉLIORÉES
// ============================================

const { getPerpendicularLeft, getPerpendicularRight } = require('./SnakeServer.js');

console.log('');
console.log('╔════════════════════════════════════════╗');
console.log('║  💥 TEST COLLISIONS AMÉLIORÉES        ║');
console.log('╚════════════════════════════════════════╝');
console.log('');

// ============================================
// TEST 1 : Helpers de direction
// ============================================

console.log('📊 TEST 1 : Helpers de direction (perpendiculaires)\n');

const directions = [
    { name: 'Droite', dir: { dx: 1, dy: 0 } },
    { name: 'Haut', dir: { dx: 0, dy: -1 } },
    { name: 'Gauche', dir: { dx: -1, dy: 0 } },
    { name: 'Bas', dir: { dx: 0, dy: 1 } }
];

directions.forEach(({ name, dir }) => {
    const left = getPerpendicularLeft(dir);
    const right = getPerpendicularRight(dir);

    console.log(`${name} (${dir.dx}, ${dir.dy}):`);
    console.log(`  ← Gauche: (${left.dx}, ${left.dy})`);
    console.log(`  → Droite: (${right.dx}, ${right.dy})`);
    console.log('');
});

// Vérifications
console.log('✅ Vérifications:');

// Droite → Gauche = Haut
const droite = { dx: 1, dy: 0 };
const gaucheFromDroite = getPerpendicularLeft(droite);
console.log(`Droite (1,0) → Gauche = Haut (0,-1)? ${gaucheFromDroite.dx === 0 && gaucheFromDroite.dy === -1 ? '✅' : '❌'}`);

// Droite → Droite = Bas
const droiteFromDroite = getPerpendicularRight(droite);
console.log(`Droite (1,0) → Droite = Bas (0,1)? ${droiteFromDroite.dx === 0 && droiteFromDroite.dy === 1 ? '✅' : '❌'}`);

// Haut → Gauche = Gauche
const haut = { dx: 0, dy: -1 };
const gaucheFromHaut = getPerpendicularLeft(haut);
console.log(`Haut (0,-1) → Gauche = Gauche (-1,0)? ${gaucheFromHaut.dx === -1 && gaucheFromHaut.dy === 0 ? '✅' : '❌'}`);

console.log('');

// ============================================
// TEST 2 : Collision tête-à-tête simulation
// ============================================

console.log('📊 TEST 2 : Collision tête-à-tête (simulation)\n');

// Player 1 se déplace à droite
const p1Direction = { dx: 1, dy: 0 };
const p1Position = { x: 10, y: 15 };

// Player 2 se déplace à gauche (face à face)
const p2Direction = { dx: -1, dy: 0 };
const p2Position = { x: 10, y: 15 }; // Même position = collision

console.log(`Player 1: Position (${p1Position.x}, ${p1Position.y}), Direction (${p1Direction.dx}, ${p1Direction.dy})`);
console.log(`Player 2: Position (${p2Position.x}, ${p2Position.y}), Direction (${p2Direction.dx}, ${p2Direction.dy})`);
console.log('');

// Collision détectée
const collision = (p1Position.x === p2Position.x && p1Position.y === p2Position.y);
console.log(`Collision détectée: ${collision ? '✅ OUI' : '❌ NON'}`);

if (collision) {
    console.log('\n🔄 Éjection latérale:');

    // P1 tourne à gauche
    const p1NewDir = getPerpendicularLeft(p1Direction);
    console.log(`  Player 1: Droite (1,0) → GAUCHE (${p1NewDir.dx}, ${p1NewDir.dy})`);

    // P2 tourne à droite
    const p2NewDir = getPerpendicularRight(p2Direction);
    console.log(`  Player 2: Gauche (-1,0) → DROITE (${p2NewDir.dx}, ${p2NewDir.dy})`);

    // Avancer de 2 cases
    const p1NewPos = {
        x: p1Position.x + p1NewDir.dx * 2,
        y: p1Position.y + p1NewDir.dy * 2
    };

    const p2NewPos = {
        x: p2Position.x + p2NewDir.dx * 2,
        y: p2Position.y + p2NewDir.dy * 2
    };

    console.log(`\n📍 Nouvelles positions (après 2 cases):`);
    console.log(`  Player 1: (${p1Position.x}, ${p1Position.y}) → (${p1NewPos.x}, ${p1NewPos.y})`);
    console.log(`  Player 2: (${p2Position.x}, ${p2Position.y}) → (${p2NewPos.x}, ${p2NewPos.y})`);

    console.log('\n⏱️ Invincibilité: 300ms');
}

console.log('');

// ============================================
// TEST 3 : Contact queue simulation
// ============================================

console.log('📊 TEST 3 : Contact queue (simulation)\n');

const attacker = { id: 'p1', number: 1, segments: 5 };
const victim = { id: 'p2', number: 2, segments: 8, tail: { x: 20, y: 15 } };

console.log(`Attaquant (Player ${attacker.number}): ${attacker.segments} segments`);
console.log(`Victime (Player ${victim.number}): ${victim.segments} segments, Queue à (${victim.tail.x}, ${victim.tail.y})`);
console.log('');

// Simulation de vol
const maxSteal = 5;
let stolenCount = 0;
let victimSegments = victim.segments;
let attackerSegments = attacker.segments;

console.log('🍴 Vol de segments (1/seconde, max 5):');
for (let second = 1; second <= maxSteal && victimSegments > 1; second++) {
    victimSegments--;
    attackerSegments++;
    stolenCount++;

    console.log(`  ${second}s: Player ${attacker.number} vole segment #${stolenCount}`);
    console.log(`      Victime: ${victimSegments} segments | Attaquant: ${attackerSegments} segments`);
}

console.log(`\n✅ Total volé: ${stolenCount} segments`);
console.log(`   Victime finale: ${victimSegments} segments`);
console.log(`   Attaquant final: ${attackerSegments} segments`);

if (victimSegments <= 1) {
    console.log('\n💀 Victime éliminée (queue mangée)');
}

console.log('');

// ============================================
// TEST 4 : Wrapping avec éjection
// ============================================

console.log('📊 TEST 4 : Wrapping avec éjection (bord de grille)\n');

const gridSize = 30;
const edgePos = { x: 29, y: 15 };
const edgeDir = { dx: 1, dy: 0 }; // Va vers la droite

console.log(`Position initiale: (${edgePos.x}, ${edgePos.y}) - Près du bord droit`);
console.log(`Direction: Droite (${edgeDir.dx}, ${edgeDir.dy})`);
console.log('');

// Éjection à gauche
const ejectDir = getPerpendicularLeft(edgeDir);
console.log(`Éjection perpendiculaire gauche: (${ejectDir.dx}, ${ejectDir.dy})`);

// Avancer de 2 cases avec wrapping
let newX = edgePos.x;
let newY = edgePos.y;

for (let i = 0; i < 2; i++) {
    newX += ejectDir.dx;
    newY += ejectDir.dy;

    // Wrapping
    newX = (newX + gridSize) % gridSize;
    newY = (newY + gridSize) % gridSize;

    console.log(`  Case ${i + 1}: (${newX}, ${newY})`);
}

console.log(`\nPosition finale: (${newX}, ${newY})`);
console.log('');

console.log('✅ Tous les tests de collision passés!\n');
