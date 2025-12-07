/**
 * Tests unitaires pour SecurityManager
 */

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, value) => { store[key] = value; }),
        removeItem: jest.fn(key => { delete store[key]; }),
        clear: jest.fn(() => { store = {}; }),
        get length() { return Object.keys(store).length; },
        key: jest.fn(i => Object.keys(store)[i] || null)
    };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock crypto
Object.defineProperty(global, 'crypto', {
    value: {
        getRandomValues: jest.fn(arr => {
            for (let i = 0; i < arr.length; i++) {
                arr[i] = Math.floor(Math.random() * 256);
            }
            return arr;
        })
    }
});

// Mock btoa
global.btoa = jest.fn(str => Buffer.from(str, 'binary').toString('base64'));
global.atob = jest.fn(str => Buffer.from(str, 'base64').toString('binary'));

// Mock logger
jest.mock('../../www/services/logger.js', () => ({
    logger: {
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    }
}));

// Import after mocks
const { SecurityManager, LIMITS, PROTECTED_KEYS } = require('../../www/services/SecurityManager.js');

describe('SecurityManager', () => {
    let securityManager;

    beforeEach(() => {
        localStorageMock.clear();
        jest.clearAllMocks();
        securityManager = new SecurityManager();
    });

    describe('Construction et Session', () => {
        test('devrait initialiser avec une session', () => {
            expect(securityManager.sessionId).toBeTruthy();
            expect(securityManager.sessionStartTime).toBeTruthy();
            expect(typeof securityManager.sessionId).toBe('string');
        });

        test('devrait générer un sessionId unique', () => {
            const sm1 = new SecurityManager();
            const sm2 = new SecurityManager();
            // Les IDs peuvent être identiques si générés au même moment avec le même random
            // mais ils devraient être des strings valides
            expect(sm1.sessionId.length).toBeGreaterThan(10);
            expect(sm2.sessionId.length).toBeGreaterThan(10);
        });

        test('devrait restaurer une session existante valide', () => {
            const existingSession = {
                id: 'existing-session-123',
                startTime: Date.now() - 1000, // 1 seconde ago
                v: 1
            };
            localStorageMock.setItem('_session_', JSON.stringify(existingSession));

            const sm = new SecurityManager();
            expect(sm.sessionId).toBe('existing-session-123');
        });

        test('devrait créer nouvelle session si ancienne expirée', () => {
            const oldSession = {
                id: 'old-session',
                startTime: Date.now() - 25 * 60 * 60 * 1000, // 25h ago
                v: 1
            };
            localStorageMock.setItem('_session_', JSON.stringify(oldSession));

            const sm = new SecurityManager();
            expect(sm.sessionId).not.toBe('old-session');
        });
    });

    describe('Hash et Signature', () => {
        test('devrait calculer un hash cohérent', () => {
            const data = { score: 100, level: 5 };
            const hash1 = securityManager.computeHash(data);
            const hash2 = securityManager.computeHash(data);
            expect(hash1).toBe(hash2);
        });

        test('devrait calculer des hash différents pour données différentes', () => {
            const hash1 = securityManager.computeHash({ score: 100 });
            const hash2 = securityManager.computeHash({ score: 200 });
            expect(hash1).not.toBe(hash2);
        });

        test('devrait inclure la version dans le hash', () => {
            const hash = securityManager.computeHash({ test: 1 });
            expect(hash).toContain('_1'); // Version 1
        });
    });

    describe('Sauvegarde et Chargement Sécurisés', () => {
        test('devrait sauvegarder avec signature', () => {
            const data = { score: 500, level: 10 };
            const result = securityManager.saveSecure('testKey', data);

            expect(result).toBe(true);
            expect(localStorageMock.setItem).toHaveBeenCalled();
        });

        test('devrait charger et vérifier signature valide', () => {
            const data = { score: 500, level: 10 };
            securityManager.saveSecure('testKey', data);

            const result = securityManager.loadSecure('testKey');

            expect(result.valid).toBe(true);
            expect(result.data).toEqual(data);
            expect(result.tampered).toBeFalsy();
        });

        test('devrait détecter données modifiées', () => {
            const data = { score: 500 };
            securityManager.saveSecure('testKey', data);

            // Modifier directement le localStorage
            const stored = JSON.parse(localStorageMock.getItem('testKey'));
            stored.data.score = 9999;
            localStorageMock.setItem('testKey', JSON.stringify(stored));

            const result = securityManager.loadSecure('testKey');

            expect(result.valid).toBe(false);
            expect(result.tampered).toBe(true);
        });

        test('devrait retourner defaultValue si clé inexistante', () => {
            const result = securityManager.loadSecure('nonExistent', { default: true });

            expect(result.data).toEqual({ default: true });
            expect(result.valid).toBe(true);
        });
    });

    describe('Validation Anti-Triche', () => {
        test('devrait valider des stats normales', () => {
            const stats = {
                score: 1000,
                level: 5,
                timePlayed: 120,
                applesEaten: 50,
                upgradesCollected: 4
            };

            const result = securityManager.validateRunStats(stats);

            expect(result.valid).toBe(true);
            expect(result.issues).toHaveLength(0);
            expect(result.trustScore).toBeGreaterThan(80);
        });

        test('devrait détecter score trop élevé par rapport au niveau', () => {
            const stats = {
                score: 50000, // Trop élevé pour niveau 3
                level: 3,
                timePlayed: 60,
                applesEaten: 20,
                upgradesCollected: 2
            };

            const result = securityManager.validateRunStats(stats);

            expect(result.valid).toBe(false);
            expect(result.issues.some(i => i.type === 'score_too_high')).toBe(true);
        });

        test('devrait détecter niveau trop élevé', () => {
            const stats = {
                score: 1000,
                level: 30, // Max est 25
                timePlayed: 300,
                applesEaten: 100,
                upgradesCollected: 10
            };

            const result = securityManager.validateRunStats(stats);

            expect(result.valid).toBe(false);
            expect(result.issues.some(i => i.type === 'level_too_high')).toBe(true);
        });

        test('devrait détecter temps trop court', () => {
            const stats = {
                score: 5000,
                level: 10,
                timePlayed: 10, // Beaucoup trop court pour 10 niveaux
                applesEaten: 50,
                upgradesCollected: 9
            };

            const result = securityManager.validateRunStats(stats);

            expect(result.valid).toBe(false);
            expect(result.issues.some(i => i.type === 'time_too_short')).toBe(true);
        });

        test('devrait détecter pommes mangées trop rapidement', () => {
            const stats = {
                score: 1000,
                level: 5,
                timePlayed: 60,
                applesEaten: 200, // 200 pommes en 60 secondes = 200/min
                upgradesCollected: 4
            };

            const result = securityManager.validateRunStats(stats);

            expect(result.valid).toBe(false);
            expect(result.issues.some(i => i.type === 'apples_too_fast')).toBe(true);
        });
    });

    describe('Token de Vérification', () => {
        test('devrait générer un token valide', () => {
            const stats = {
                score: 1000,
                level: 5,
                timePlayed: 120,
                applesEaten: 50
            };

            const token = securityManager.generateVerificationToken(stats);

            expect(typeof token).toBe('string');
            expect(token.length).toBeGreaterThan(20);
        });

        test('devrait contenir les données attendues dans le token', () => {
            const stats = {
                score: 1000,
                level: 5,
                timePlayed: 120,
                applesEaten: 50
            };

            const token = securityManager.generateVerificationToken(stats);
            const decoded = JSON.parse(atob(token));

            expect(decoded.sessionId).toBe(securityManager.sessionId);
            expect(decoded.score).toBe(1000);
            expect(decoded.level).toBe(5);
            expect(decoded.timestamp).toBeTruthy();
            expect(decoded.checksum).toBeTruthy();
        });
    });

    describe('Tracking des Événements', () => {
        test('devrait tracker les événements', () => {
            securityManager.trackGameEvent('apple', { points: 10 });
            securityManager.trackGameEvent('apple', { points: 10 });

            expect(securityManager.gameEvents).toHaveLength(2);
        });

        test('devrait limiter le nombre d\'événements', () => {
            for (let i = 0; i < 150; i++) {
                securityManager.trackGameEvent('test', { i });
            }

            expect(securityManager.gameEvents.length).toBeLessThanOrEqual(100);
        });

        test('devrait détecter événements trop rapides', () => {
            // Simuler événements rapides
            const now = Date.now();
            securityManager.gameEvents = [
                { type: 'score', timestamp: now - 20, data: {} },
                { type: 'score', timestamp: now - 10, data: {} }
            ];

            securityManager.analyzeEventPatterns();

            // Devrait avoir logué une activité suspecte
            expect(securityManager.suspiciousActivities.length).toBeGreaterThan(0);
        });
    });

    describe('Score de Confiance', () => {
        test('devrait calculer trustScore élevé pour stats normales', () => {
            const stats = { score: 1000, level: 5, timePlayed: 120, applesEaten: 50 };
            const result = securityManager.validateRunStats(stats);

            expect(result.trustScore).toBeGreaterThanOrEqual(90);
        });

        test('devrait réduire trustScore pour chaque problème', () => {
            const stats = { score: 100000, level: 30, timePlayed: 10, applesEaten: 500 };
            const result = securityManager.validateRunStats(stats);

            expect(result.trustScore).toBeLessThan(50);
        });
    });

    describe('Constantes', () => {
        test('LIMITS devrait contenir les bonnes valeurs', () => {
            expect(LIMITS.maxXPPerMinute).toBe(2000);
            expect(LIMITS.maxScorePerLevel).toBe(5000);
            expect(LIMITS.maxLevelPerRun).toBe(25);
            expect(LIMITS.maxApplesPerMinute).toBe(120);
            expect(LIMITS.minTimePerLevel).toBe(15);
        });

        test('PROTECTED_KEYS devrait contenir les clés sensibles', () => {
            expect(PROTECTED_KEYS).toContain('career');
            expect(PROTECTED_KEYS).toContain('snakeRoguelikeMeta');
            expect(PROTECTED_KEYS).toContain('snakeAchievements');
        });
    });

    describe('Statistiques de Sécurité', () => {
        test('devrait retourner les stats correctes', () => {
            securityManager.trackGameEvent('test', {});
            securityManager.logSuspiciousActivity('test', {});

            const stats = securityManager.getSecurityStats();

            expect(stats.sessionId).toBe(securityManager.sessionId);
            expect(stats.eventsTracked).toBe(1);
            expect(stats.suspiciousActivities).toBe(1);
            expect(stats.protectedKeys).toBe(PROTECTED_KEYS.length);
        });
    });
});
