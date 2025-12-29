/**
 * SECURITY MANAGER - Sécurisation des données et anti-triche
 *
 * Responsabilités :
 * - Signature/hash des données localStorage
 * - Validation d'intégrité des données
 * - Détection de comportements suspects
 * - Génération de tokens de session
 */

import { logger } from './logger.js';

// ============================================
// CONSTANTES DE SÉCURITÉ
// ============================================

const SECURITY_VERSION = 1;
const SIGNATURE_KEY_PREFIX = '_sig_';
const SESSION_KEY = '_session_';

// Clés localStorage sensibles à protéger
const PROTECTED_KEYS = [
    'career',
    'snakeRoguelikeMeta',
    'snakeAchievements',
    'tr',
    'leaderboard',
    'boxData'
];

// Limites anti-triche
const LIMITS = {
    maxXPPerMinute: 2000,        // XP max gagnable par minute
    maxScorePerLevel: 5000,      // Score max par niveau
    maxLevelPerRun: 25,          // Niveau max atteignable
    maxApplesPerMinute: 120,     // Pommes max par minute
    minTimePerLevel: 15,         // Temps minimum par niveau (secondes)
    maxUpgradesPerRun: 20        // Upgrades max par run
};

// ============================================
// CLASSE SECURITY MANAGER
// ============================================

class SecurityManager {
    constructor() {
        this.sessionId = null;
        this.sessionStartTime = null;
        this.gameEvents = [];
        this.suspiciousActivities = [];

        try {
            this.initSession();
            logger.log('[SecurityManager] Initialisé');
        } catch (e) {
            // Fallback si localStorage pas encore disponible
            this.sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
            this.sessionStartTime = Date.now();
            logger.warn('[SecurityManager] Init fallback:', e.message);
        }
    }

    // ============================================
    // GESTION DE SESSION
    // ============================================

    /**
     * Initialise ou récupère une session
     */
    initSession() {
        try {
            const existingSession = localStorage.getItem(SESSION_KEY);
            if (existingSession) {
                const session = JSON.parse(existingSession);
                // Session valide si moins de 24h
                if (Date.now() - session.startTime < 24 * 60 * 60 * 1000) {
                    this.sessionId = session.id;
                    this.sessionStartTime = session.startTime;
                    return;
                }
            }
        } catch (e) {
            // Session corrompue, créer une nouvelle
        }

        // Nouvelle session
        this.sessionId = this.generateSessionId();
        this.sessionStartTime = Date.now();

        localStorage.setItem(SESSION_KEY, JSON.stringify({
            id: this.sessionId,
            startTime: this.sessionStartTime,
            v: SECURITY_VERSION
        }));
    }

    /**
     * Génère un ID de session unique
     */
    generateSessionId() {
        // Utiliser crypto si disponible, sinon fallback Math.random
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            const array = new Uint8Array(16);
            crypto.getRandomValues(array);
            return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
        }
        // Fallback pour environnements sans crypto
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9) + Math.random().toString(36).substr(2, 9);
    }

    // ============================================
    // SIGNATURE ET VÉRIFICATION
    // ============================================

    /**
     * Calcule un hash simple pour les données
     * Note: Pas cryptographiquement sûr, mais suffisant pour détecter modifications manuelles
     */
    computeHash(data, salt = '') {
        const str = JSON.stringify(data) + salt + this.sessionId;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        // Ajouter un second pass avec seed différent
        let hash2 = 5381;
        for (let i = 0; i < str.length; i++) {
            hash2 = ((hash2 << 5) + hash2) + str.charCodeAt(i);
        }
        return `${(hash >>> 0).toString(36)}_${(hash2 >>> 0).toString(36)}_${SECURITY_VERSION}`;
    }

    /**
     * Sauvegarde des données avec signature
     */
    saveSecure(key, data) {
        try {
            const timestamp = Date.now();
            const envelope = {
                data: data,
                t: timestamp,
                v: SECURITY_VERSION
            };

            // Calculer et stocker la signature
            const signature = this.computeHash(envelope);

            localStorage.setItem(key, JSON.stringify(envelope));
            localStorage.setItem(SIGNATURE_KEY_PREFIX + key, signature);

            return true;
        } catch (e) {
            logger.error('[SecurityManager] Erreur sauvegarde sécurisée:', e);
            return false;
        }
    }

    /**
     * Charge des données avec vérification de signature
     */
    loadSecure(key, defaultValue = null) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return { data: defaultValue, valid: true, reason: 'not_found' };

            const envelope = JSON.parse(raw);
            const storedSignature = localStorage.getItem(SIGNATURE_KEY_PREFIX + key);

            // Vérifier la signature
            const expectedSignature = this.computeHash(envelope);

            if (storedSignature !== expectedSignature) {
                this.logSuspiciousActivity('signature_mismatch', { key });
                return {
                    data: envelope.data || defaultValue,
                    valid: false,
                    reason: 'signature_invalid',
                    tampered: true
                };
            }

            return {
                data: envelope.data,
                valid: true,
                timestamp: envelope.t,
                version: envelope.v
            };
        } catch (e) {
            logger.error('[SecurityManager] Erreur chargement sécurisé:', e);
            return { data: defaultValue, valid: false, reason: 'parse_error' };
        }
    }

    /**
     * Migre une clé existante vers le format sécurisé
     */
    migrateToSecure(key) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return false;

            // Vérifier si déjà au format sécurisé
            const parsed = JSON.parse(raw);
            if (parsed.v && parsed.t && parsed.data !== undefined) {
                // Déjà migré, juste recalculer la signature
                const signature = this.computeHash(parsed);
                localStorage.setItem(SIGNATURE_KEY_PREFIX + key, signature);
                return true;
            }

            // Migrer vers format sécurisé
            return this.saveSecure(key, parsed);
        } catch (e) {
            logger.error(`[SecurityManager] Erreur migration ${key}:`, e);
            return false;
        }
    }

    // ============================================
    // VALIDATION ANTI-TRICHE
    // ============================================

    /**
     * Valide les statistiques d'une run avant soumission
     */
    validateRunStats(stats) {
        const issues = [];

        // Vérifier le score par rapport au niveau
        if (stats.score > stats.level * LIMITS.maxScorePerLevel) {
            issues.push({ type: 'score_too_high', expected: stats.level * LIMITS.maxScorePerLevel, actual: stats.score });
        }

        // Vérifier le niveau maximum
        if (stats.level > LIMITS.maxLevelPerRun) {
            issues.push({ type: 'level_too_high', max: LIMITS.maxLevelPerRun, actual: stats.level });
        }

        // Vérifier le temps minimum
        const minExpectedTime = stats.level * LIMITS.minTimePerLevel;
        if (stats.timePlayed < minExpectedTime * 0.5) {
            issues.push({ type: 'time_too_short', expected: minExpectedTime, actual: stats.timePlayed });
        }

        // Vérifier les pommes par minute
        const applesPerMinute = (stats.applesEaten / stats.timePlayed) * 60;
        if (applesPerMinute > LIMITS.maxApplesPerMinute) {
            issues.push({ type: 'apples_too_fast', max: LIMITS.maxApplesPerMinute, actual: applesPerMinute });
        }

        // Vérifier les upgrades
        if (stats.upgradesCollected > LIMITS.maxUpgradesPerRun) {
            issues.push({ type: 'too_many_upgrades', max: LIMITS.maxUpgradesPerRun, actual: stats.upgradesCollected });
        }

        // Log les problèmes détectés
        if (issues.length > 0) {
            this.logSuspiciousActivity('invalid_stats', { stats, issues });
        }

        return {
            valid: issues.length === 0,
            issues: issues,
            trustScore: this.calculateTrustScore(stats, issues)
        };
    }

    /**
     * Calcule un score de confiance (0-100)
     */
    calculateTrustScore(stats, issues) {
        let score = 100;

        // Réduire pour chaque problème
        for (const issue of issues) {
            switch (issue.type) {
                case 'score_too_high':
                    score -= 30;
                    break;
                case 'level_too_high':
                    score -= 40;
                    break;
                case 'time_too_short':
                    score -= 25;
                    break;
                case 'apples_too_fast':
                    score -= 20;
                    break;
                case 'too_many_upgrades':
                    score -= 15;
                    break;
            }
        }

        // Bonus pour session longue (joueur légitime)
        const sessionDuration = (Date.now() - this.sessionStartTime) / 1000 / 60; // minutes
        if (sessionDuration > 30) score += 5;
        if (sessionDuration > 60) score += 5;

        // Malus pour activités suspectes précédentes
        score -= this.suspiciousActivities.length * 5;

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Génère un token de vérification pour le serveur
     */
    generateVerificationToken(stats) {
        const payload = {
            sessionId: this.sessionId,
            timestamp: Date.now(),
            score: stats.score,
            level: stats.level,
            time: Math.floor(stats.timePlayed),
            checksum: this.computeHash({
                s: stats.score,
                l: stats.level,
                t: Math.floor(stats.timePlayed),
                a: stats.applesEaten
            }, 'verify')
        };

        // Encoder en base64
        return btoa(JSON.stringify(payload));
    }

    /**
     * Enregistre un événement de jeu pour analyse
     */
    trackGameEvent(eventType, data = {}) {
        const event = {
            type: eventType,
            timestamp: Date.now(),
            data: data
        };

        this.gameEvents.push(event);

        // Garder seulement les 100 derniers événements
        if (this.gameEvents.length > 100) {
            this.gameEvents.shift();
        }

        // Analyser les patterns suspects
        this.analyzeEventPatterns();
    }

    /**
     * Analyse les patterns d'événements pour détecter des anomalies
     */
    analyzeEventPatterns() {
        const recentEvents = this.gameEvents.slice(-20);

        // Détecter les événements trop rapprochés
        for (let i = 1; i < recentEvents.length; i++) {
            const timeDiff = recentEvents[i].timestamp - recentEvents[i-1].timestamp;

            // Score events avec moins de 50ms d'écart = suspect
            if (recentEvents[i].type === 'score' && timeDiff < 50) {
                this.logSuspiciousActivity('events_too_fast', {
                    timeDiff,
                    events: [recentEvents[i-1], recentEvents[i]]
                });
            }
        }

        // Détecter les gains de score anormaux
        const scoreEvents = recentEvents.filter(e => e.type === 'score');
        for (const event of scoreEvents) {
            if (event.data.gained > 500) {
                this.logSuspiciousActivity('abnormal_score_gain', event.data);
            }
        }
    }

    /**
     * Enregistre une activité suspecte
     */
    logSuspiciousActivity(type, details) {
        const activity = {
            type,
            details,
            timestamp: Date.now(),
            sessionId: this.sessionId
        };

        this.suspiciousActivities.push(activity);
        logger.warn('[SecurityManager] Activité suspecte détectée:', type, details);

        // Garder les 50 dernières
        if (this.suspiciousActivities.length > 50) {
            this.suspiciousActivities.shift();
        }
    }

    // ============================================
    // INTÉGRITÉ DES DONNÉES
    // ============================================

    /**
     * Vérifie l'intégrité de toutes les données protégées
     */
    verifyAllData() {
        const results = {};

        for (const key of PROTECTED_KEYS) {
            const result = this.loadSecure(key);
            results[key] = {
                valid: result.valid,
                reason: result.reason,
                tampered: result.tampered || false
            };
        }

        // Compter les problèmes
        const tamperedKeys = Object.entries(results)
            .filter(([k, v]) => v.tampered)
            .map(([k]) => k);

        if (tamperedKeys.length > 0) {
            logger.warn('[SecurityManager] Données potentiellement modifiées:', tamperedKeys);
        }

        return {
            allValid: tamperedKeys.length === 0,
            results,
            tamperedKeys
        };
    }

    /**
     * Initialise la protection sur les clés existantes
     */
    initializeProtection() {
        logger.log('[SecurityManager] Initialisation de la protection...');

        for (const key of PROTECTED_KEYS) {
            if (localStorage.getItem(key)) {
                this.migrateToSecure(key);
            }
        }

        logger.log('[SecurityManager] Protection initialisée');
    }

    // ============================================
    // UTILITAIRES
    // ============================================

    /**
     * Obtient les statistiques de sécurité
     */
    getSecurityStats() {
        return {
            sessionId: this.sessionId,
            sessionDuration: Date.now() - this.sessionStartTime,
            eventsTracked: this.gameEvents.length,
            suspiciousActivities: this.suspiciousActivities.length,
            protectedKeys: PROTECTED_KEYS.length
        };
    }

    /**
     * Reset les données de session (pour debug)
     */
    resetSession() {
        localStorage.removeItem(SESSION_KEY);
        this.gameEvents = [];
        this.suspiciousActivities = [];
        this.initSession();
        logger.log('[SecurityManager] Session réinitialisée');
    }
}

// ============================================
// INSTANCE SINGLETON
// ============================================

const securityManager = new SecurityManager();

// Exposer globalement
window.securityManager = securityManager;

logger.log('✅ SecurityManager chargé');

export { securityManager, SecurityManager, PROTECTED_KEYS, LIMITS };
