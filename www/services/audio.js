// ============================================
// SERVICE AUDIO - BRIDGE VERS SOUNDEFFECTS
// Interface de compatibilité + Sons haute qualité
// ============================================

import { logger } from './logger.js';
import { soundEffects } from './SoundEffects.js';

/**
 * AudioService - Interface de compatibilité
 * Délègue au nouveau SoundEffectsService pour les sons haute qualité
 */
class AudioService {
    constructor() {
        this.enabled = true;
        this._initialized = false;
    }

    /**
     * Initialise le service audio
     */
    init() {
        if (this._initialized) return;

        try {
            soundEffects.init();
            this._initialized = true;
            logger.log('AudioService initialisé (SoundEffects HQ)');
        } catch (error) {
            logger.error('Impossible d\'initialiser l\'audio:', error);
        }
    }

    /**
     * Active ou désactive les sons
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        soundEffects.setEnabled(enabled);
    }

    /**
     * Définit le volume des SFX (0-1)
     * @param {number} volume
     */
    setVolume(volume) {
        soundEffects.setVolume(volume);
    }

    // ============================================
    // SONS D'INTERFACE (délégués à SoundEffects)
    // ============================================

    buttonClick() { soundEffects.buttonClick(); }
    dpadClick() { soundEffects.dpadClick(); }
    buttonHover() { soundEffects.buttonHover(); }
    confirm() { soundEffects.confirm(); }
    cancel() { soundEffects.cancel(); }
    error() { soundEffects.error(); }

    // ============================================
    // SONS DE JEU (délégués à SoundEffects)
    // ============================================

    eat() { soundEffects.eat(); }
    eatGolden() { soundEffects.eatGolden(); }
    bad() { soundEffects.bad(); }
    obstacle() { soundEffects.obstacle(); }
    breakWall() { soundEffects.breakWall(); }
    die() { soundEffects.die(); }

    // ============================================
    // SONS DE PROGRESSION
    // ============================================

    lvlup() { soundEffects.lvlup(); }
    xpGain() { soundEffects.xpGain(); }
    combo(level = 1) { soundEffects.combo(level); }

    // ============================================
    // SONS DE POWER-UPS
    // ============================================

    powerup() { soundEffects.powerup(); }
    powerupFire() { soundEffects.powerupFire(); }
    powerupIce() { soundEffects.powerupIce(); }
    powerupGhost() { soundEffects.powerupGhost(); }
    powerupLightning() { soundEffects.powerupLightning(); }
    powerupSword() { soundEffects.powerupSword(); }
    powerupEnd() { soundEffects.powerupEnd(); }

    // ============================================
    // SONS DE COMBAT
    // ============================================

    swordSwing() { soundEffects.swordSwing(); }
    swordHit() { soundEffects.swordHit(); }
    takeDamage() { soundEffects.takeDamage(); }
    block() { soundEffects.block(); }

    // ============================================
    // SONS DE BOSS
    // ============================================

    bossAppear() { soundEffects.bossAppear(); }
    bossAttack() { soundEffects.bossAttack(); }
    bossHurt() { soundEffects.bossHurt(); }
    bossDefeat() { soundEffects.bossDefeat(); }

    // ============================================
    // SONS D'AMBIANCE / ALERTES
    // ============================================

    danger() { soundEffects.danger(); }
    countdownTick() { soundEffects.countdownTick(); }
    countdownGo() { soundEffects.countdownGo(); }

    // ============================================
    // SONS DE VICTOIRE / DÉFAITE
    // ============================================

    victory() { soundEffects.victory(); }
    defeat() { soundEffects.defeat(); }
    newRecord() { soundEffects.newRecord(); }

    // ============================================
    // SONS DE COFFRE
    // ============================================

    chestPulse() { soundEffects.chestPulse(); }
    chestOpen() { soundEffects.chestOpen(); }
    rewardCommon() { soundEffects.rewardCommon(); }
    rewardRare() { soundEffects.rewardRare(); }
    rewardEpic() { soundEffects.rewardEpic(); }
    rewardLegendary() { soundEffects.rewardLegendary(); }
    chestCollect() { soundEffects.chestCollect(); }

    // ============================================
    // SONS ROGUELIKE
    // ============================================

    selectUpgrade() { soundEffects.selectUpgrade(); }
    newFloor() { soundEffects.newFloor(); }
    achievementUnlock() { soundEffects.achievementUnlock(); }

    // ============================================
    // SONS MULTIJOUEUR
    // ============================================

    playerJoin() { soundEffects.playerJoin(); }
    playerLeave() { soundEffects.playerLeave(); }
    matchFound() { soundEffects.matchFound(); }
    notification() { soundEffects.notification(); }
}

// Instance singleton
export const audioService = new AudioService();

// Exposer aussi le SoundEffects pour accès direct aux nouvelles fonctionnalités
export { soundEffects };

// Export pour compatibilité avec l'ancien code
export default audioService;
