/**
 * PowerUpState.js - V2 - Système de Power-ups avec Débuffs
 * Utilisé par ai-game.js (Boss Rush) et multi-game.js/server.js (Multiplayer)
 */

import { logger } from '../services/logger.js';
import { POWERUP_EFFECTS, DEBUFF_TYPES } from '../config/constants.js';

export class PowerUpState {
    constructor(name = 'entity') {
        this.name = name;
        this.activePowerup = null;
        this.powerupTime = 0;
        this.contactUsed = false;
        this.storedPowerup = null;

        this.debuffs = {
            slowed: { active: false, until: 0, speedMultiplier: 1.0 },
            invertedControls: { active: false, until: 0 }
        };

        this.passiveEffects = {
            unlimitedBoost: false,
            boostSpeed: 125,
            selfInvertedControls: false,
            invincible: false,
            immuneToSteal: false,
            immuneToPowerupSteal: false,
            phaseThrough: false,
            throughWalls: false,
            throughEnemy: false
        };

        this.effects = {
            slow: false,
            double: false,
            invincible: false,
            ghost: false
        };
        
        this.ghostUsed = false;
    }

    activate(type) {
        this.disable();
        const config = POWERUP_EFFECTS[type];
        if (!config) {
            logger.warn('[PowerUpState:' + this.name + '] Power-up inconnu: ' + type);
            return;
        }
        this.activePowerup = type;
        this.powerupTime = performance.now();
        this.contactUsed = false;
        this._applyPassiveEffects(config);
        this._updateLegacyEffects(type);
        logger.log('[PowerUpState:' + this.name + '] Activé: ' + type + ' (' + config.icon + ')');
    }

    _applyPassiveEffects(config) {
        if (!config.passive) return;
        const passive = config.passive;
        switch (passive.type) {
            case 'UNLIMITED_BOOST':
                this.passiveEffects.unlimitedBoost = true;
                this.passiveEffects.boostSpeed = passive.boostSpeed || 125;
                break;
            case 'SELF_INVERTED_CONTROLS':
                this.passiveEffects.selfInvertedControls = true;
                break;
            case 'INVINCIBLE':
                this.passiveEffects.invincible = true;
                this.passiveEffects.immuneToSteal = passive.immuneToSteal || false;
                this.passiveEffects.immuneToPowerupSteal = passive.immuneToPowerupSteal || false;
                break;
            case 'PHASE_THROUGH':
                this.passiveEffects.phaseThrough = true;
                this.passiveEffects.throughWalls = passive.throughWalls || false;
                this.passiveEffects.throughEnemy = passive.throughEnemy || false;
                break;
        }
    }

    _updateLegacyEffects(type) {
        switch (type) {
            case 'ice': this.effects.slow = true; break;
            case 'fire': this.effects.double = true; break;
            case 'rock': this.effects.invincible = true; break;
            case 'ghost': this.effects.ghost = true; break;
        }
    }

    disable() {
        if (this.activePowerup) {
            logger.log('[PowerUpState:' + this.name + '] Expiré: ' + this.activePowerup);
        }
        this.activePowerup = null;
        this.contactUsed = false;
        this.passiveEffects = {
            unlimitedBoost: false, boostSpeed: 125, selfInvertedControls: false,
            invincible: false, immuneToSteal: false, immuneToPowerupSteal: false,
            phaseThrough: false, throughWalls: false, throughEnemy: false
        };
        this.effects = { slow: false, double: false, invincible: false, ghost: false };
    }

    // DÉBUFFS
    applySlowed(duration, speedMultiplier = 0.5) {
        if (this.passiveEffects.invincible) {
            logger.log('[PowerUpState:' + this.name + '] Immune au slow (Rock)');
            return;
        }
        this.debuffs.slowed.active = true;
        this.debuffs.slowed.until = Date.now() + duration;
        this.debuffs.slowed.speedMultiplier = speedMultiplier;
        logger.log('[PowerUpState:' + this.name + '] Ralenti ' + Math.round((1 - speedMultiplier) * 100) + '% pour ' + duration + 'ms');
    }

    applyInvertedControls(duration) {
        if (this.passiveEffects.invincible) {
            logger.log('[PowerUpState:' + this.name + '] Immune inversion (Rock)');
            return;
        }
        this.debuffs.invertedControls.active = true;
        this.debuffs.invertedControls.until = Date.now() + duration;
        logger.log('[PowerUpState:' + this.name + '] Contrôles inversés pour ' + duration + 'ms');
    }

    hasInvertedControls() {
        return this.debuffs.invertedControls.active || this.passiveEffects.selfInvertedControls;
    }

    isSlowed() { return this.debuffs.slowed.active; }
    
    getSpeedMultiplier() {
        return this.debuffs.slowed.active ? this.debuffs.slowed.speedMultiplier : 1.0;
    }

    // EFFETS CONTACT
    markContactUsed() {
        this.contactUsed = true;
        logger.log('[PowerUpState:' + this.name + '] Effet contact utilisé');
    }

    canUseContact() { return this.activePowerup && !this.contactUsed; }

    getContactEffect(targetPowerup = null) {
        if (!this.activePowerup || this.contactUsed) return null;
        const config = POWERUP_EFFECTS[this.activePowerup];
        if (!config || !config.onContact) return null;
        let effect = { ...config.onContact };
        if (config.exceptions && targetPowerup) {
            const key = 'vs' + targetPowerup.charAt(0).toUpperCase() + targetPowerup.slice(1);
            if (config.exceptions[key]) {
                effect = { ...effect, ...config.exceptions[key] };
            }
        }
        return effect;
    }

    // POWER-UP STOCKÉ
    storePowerup(type) {
        this.storedPowerup = type;
        logger.log('[PowerUpState:' + this.name + '] Power-up stocké: ' + type);
    }

    activateStored() {
        if (!this.storedPowerup) return false;
        const type = this.storedPowerup;
        this.storedPowerup = null;
        this.activate(type);
        logger.log('[PowerUpState:' + this.name + '] Power-up stocké activé: ' + type);
        return true;
    }

    stealStoredPowerup() {
        if (this.passiveEffects.immuneToPowerupSteal) {
            logger.log('[PowerUpState:' + this.name + '] Immune vol power-up (Rock)');
            return null;
        }
        const stolen = this.storedPowerup;
        this.storedPowerup = null;
        if (stolen) logger.log('[PowerUpState:' + this.name + '] Power-up stocké volé: ' + stolen);
        return stolen;
    }

    hasStoredPowerup() { return this.storedPowerup !== null; }

    // UTILITAIRES PASSIFS
    canBoostUnlimited() { return this.passiveEffects.unlimitedBoost; }
    getBoostSpeed() { return this.passiveEffects.boostSpeed; }
    isInvincible() { return this.passiveEffects.invincible; }
    canPhaseThrough() { return this.passiveEffects.phaseThrough; }
    canPhaseThroughWalls() { return this.passiveEffects.throughWalls; }
    canPhaseThroughEnemy() { return this.passiveEffects.throughEnemy; }
    isImmuneToSteal() { return this.passiveEffects.immuneToSteal; }

    // EXPIRATION
    isExpired(durations = null) {
        if (!this.activePowerup) return false;
        const elapsed = performance.now() - this.powerupTime;
        let duration;
        if (durations && durations[this.activePowerup] !== undefined) {
            duration = durations[this.activePowerup];
        } else {
            const config = POWERUP_EFFECTS[this.activePowerup];
            duration = config ? config.duration : 6000;
        }
        return elapsed > duration;
    }

    update(timestamp = Date.now(), durations = null) {
        const result = { powerupExpired: false, slowEnded: false, invertedEnded: false };
        
        if (this.activePowerup && this.isExpired(durations)) {
            this.disable();
            result.powerupExpired = true;
        }
        
        if (this.debuffs.slowed.active && timestamp > this.debuffs.slowed.until) {
            this.debuffs.slowed.active = false;
            this.debuffs.slowed.speedMultiplier = 1.0;
            result.slowEnded = true;
            logger.log('[PowerUpState:' + this.name + '] Plus ralenti');
        }
        
        if (this.debuffs.invertedControls.active && timestamp > this.debuffs.invertedControls.until) {
            this.debuffs.invertedControls.active = false;
            result.invertedEnded = true;
            logger.log('[PowerUpState:' + this.name + '] Contrôles rétablis');
        }
        
        return result;
    }

    getSpeed(baseSpeed, slowedSpeed = 500) {
        if (this.debuffs.slowed.active) {
            return baseSpeed / this.debuffs.slowed.speedMultiplier;
        }
        return baseSpeed;
    }

    reset() {
        this.activePowerup = null;
        this.powerupTime = 0;
        this.contactUsed = false;
        this.storedPowerup = null;
        this.debuffs = {
            slowed: { active: false, until: 0, speedMultiplier: 1.0 },
            invertedControls: { active: false, until: 0 }
        };
        this.passiveEffects = {
            unlimitedBoost: false, boostSpeed: 125, selfInvertedControls: false,
            invincible: false, immuneToSteal: false, immuneToPowerupSteal: false,
            phaseThrough: false, throughWalls: false, throughEnemy: false
        };
        this.effects = { slow: false, double: false, invincible: false, ghost: false };
        this.ghostUsed = false;
    }

    serialize() {
        return {
            activePowerup: this.activePowerup,
            storedPowerup: this.storedPowerup,
            contactUsed: this.contactUsed,
            debuffs: {
                slowed: this.debuffs.slowed.active,
                slowedMultiplier: this.debuffs.slowed.speedMultiplier,
                invertedControls: this.debuffs.invertedControls.active
            },
            passiveEffects: { ...this.passiveEffects }
        };
    }

    deserialize(data) {
        if (!data) return;
        if (data.activePowerup) this.activate(data.activePowerup);
        this.storedPowerup = data.storedPowerup || null;
        this.contactUsed = data.contactUsed || false;
        if (data.debuffs) {
            if (data.debuffs.slowed) {
                this.debuffs.slowed.active = true;
                this.debuffs.slowed.speedMultiplier = data.debuffs.slowedMultiplier || 0.5;
            }
            if (data.debuffs.invertedControls) {
                this.debuffs.invertedControls.active = true;
            }
        }
    }

    // RÉTRO-COMPATIBILITÉ
    markGhostUsed() { this.contactUsed = true; this.ghostUsed = true; }
    canGhostSteal() { return this.effects.ghost && !this.contactUsed && !this.ghostUsed; }
}
