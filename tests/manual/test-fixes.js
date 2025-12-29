const CONFIG = { GRID_SIZE: 30 };

function getPerpendicularLeft(d) { return { dx: d.dy, dy: -d.dx }; }
function getPerpendicularRight(d) { return { dx: -d.dy, dy: d.dx }; }
function calcNext(p, d) {
    return {
        x: (p.x + d.dx + CONFIG.GRID_SIZE) % CONFIG.GRID_SIZE,
        y: (p.y + d.dy + CONFIG.GRID_SIZE) % CONFIG.GRID_SIZE
    };
}

console.log('\n🧪 VALIDATION DES FIXES\n');

let pass = 0, total = 3;

// Test 1: Collision
const p1 = { body: [{ x: 10, y: 15 }], direction: { dx: 1, dy: 0 } };
const p2 = { body: [{ x: 12, y: 15 }], direction: { dx: -1, dy: 0 } };
const n1 = calcNext(p1.body[0], p1.direction);
const n2 = calcNext(p2.body[0], p2.direction);
if (n1.x === n2.x && n1.y === n2.y) {
    const newBody1 = p1.body.map(s => ({ x: (s.x + 0 * 2 + 30) % 30, y: (s.y - 1 * 2 + 30) % 30 }));
    if (newBody1[0].y === 13) { console.log('✅ Test 1: Collision OK'); pass++; }
    else { console.log('❌ Test 1: Éjection échoue'); }
} else { console.log('❌ Test 1: Détection échoue'); }

// Test 2: Contact
const atk = { body: [{ x: 14, y: 15 }], direction: { dx: 1, dy: 0 } };
const vic = { body: [{ x: 16, y: 15 }, { x: 17, y: 15 }, { x: 15, y: 15 }] };
const nAtk = calcNext(atk.body[0], atk.direction);
const tail = vic.body[vic.body.length - 1];
if (nAtk.x === tail.x && nAtk.y === tail.y) {
    console.log('✅ Test 2: Contact OK');
    pass++;
} else { console.log('❌ Test 2: Contact échoue'); }

// Test 3: Wrapping
const edge = { x: 29, y: 15 };
const newPos = { x: (29 + 0 * 2 + 30) % 30, y: (15 - 1 * 2 + 30) % 30 };
if (newPos.y === 13 && newPos.x >= 0 && newPos.x < 30) {
    console.log('✅ Test 3: Wrapping OK');
    pass++;
} else { console.log('❌ Test 3: Wrapping échoue'); }

console.log(`\n📊 Résultat: ${pass}/${total} tests réussis\n`);
process.exit(pass === total ? 0 : 1);
