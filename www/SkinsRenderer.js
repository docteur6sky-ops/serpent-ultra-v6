/**
 * SKINS RENDERER - Système de rendu avancé des skins
 *
 * Dessine le serpent avec :
 * - Tête ronde avec yeux animés qui suivent la direction
 * - Corps avec dégradé progressif
 * - Queue effilée et transparente
 * - Effets de glow lumineux
 * - Effets spéciaux : Scanner, Caméléon, Couronne
 */

import { logger } from './services/logger.js';
import { getItemById } from './data/items.js';

// État des animations pour effets spéciaux
const animationState = {
    scanPosition: 0,        // Position du scan (0-1)
    scanDirection: 1,       // Direction du scan (1 ou -1)
    chameleonHue: 0,        // Teinte du caméléon (0-360)
    pulsePhase: 0,          // Phase de pulsation (0-2π)
    glitchOffset: 0,        // Offset du glitch
    sparklePhase: 0,        // Phase des particules
    flamePhase: 0,          // Phase des flammes
    voidPhase: 0,           // Phase du void
    lastUpdate: Date.now()
};

/**
 * Met à jour l'état des animations (appelé à chaque frame)
 */
function updateAnimations() {
    const now = Date.now();
    const delta = (now - animationState.lastUpdate) / 1000; // Delta en secondes
    animationState.lastUpdate = now;

    // Scanner: va-et-vient de 0 à 1
    animationState.scanPosition += animationState.scanDirection * delta * 0.5; // 0.5 = vitesse
    if (animationState.scanPosition >= 1) {
        animationState.scanPosition = 1;
        animationState.scanDirection = -1;
    } else if (animationState.scanPosition <= 0) {
        animationState.scanPosition = 0;
        animationState.scanDirection = 1;
    }

    // Caméléon: rotation de teinte (0-360°)
    animationState.chameleonHue = (animationState.chameleonHue + delta * 60) % 360; // 60°/s

    // Pulse: pulsation sinusoïdale
    animationState.pulsePhase = (animationState.pulsePhase + delta * 3) % (Math.PI * 2);

    // Glitch: offset aléatoire périodique
    if (Math.random() < delta * 5) { // ~5 glitches par seconde
        animationState.glitchOffset = (Math.random() - 0.5) * 4;
    } else {
        animationState.glitchOffset *= 0.9; // Retour progressif à 0
    }

    // Sparkle: phase des particules
    animationState.sparklePhase = (animationState.sparklePhase + delta * 2) % 1;

    // Flame: ondulation des flammes
    animationState.flamePhase = (animationState.flamePhase + delta * 4) % (Math.PI * 2);

    // Void: pulsation sombre
    animationState.voidPhase = (animationState.voidPhase + delta * 1.5) % (Math.PI * 2);
}

/**
 * Dessiner le serpent en version professionnelle AAA
 * @param {CanvasRenderingContext2D} ctx - Contexte du canvas
 * @param {Array} snake - Tableau des segments [{x, y}, ...]
 * @param {string} direction - Direction actuelle ('right', 'left', 'up', 'down')
 * @param {number} gridSize - Taille d'une cellule de la grille
 * @param {object} skinColors - Couleurs du skin (optionnel, utilise le skin équipé si non fourni)
 */
export function drawSnakeEnhanced(ctx, snake, direction, gridSize, skinColors = null) {
    // Mettre à jour les animations
    updateAnimations();

    // Récupérer le skin équipé
    let equippedSkin = null;
    if (!skinColors && window.boxManager) {
        equippedSkin = window.boxManager.getEquippedSkin();
        if (equippedSkin && equippedSkin.colors) {
            skinColors = equippedSkin.colors;
        }
    }

    // Couleurs par défaut (vert classique) si aucun skin n'est trouvé
    if (!skinColors) {
        skinColors = {
            head: { light: '#00FF87', dark: '#00AA55' },
            body: { from: '#00FF87', to: '#006633' },
            tail: { color: '#006633' },
            outline: '#004422',
            glow: '#00FF87'
        };
    }

    // Appliquer les effets spéciaux selon le skin
    const skinEffect = equippedSkin ? equippedSkin.effect : null;

    // Effet Caméléon: modifier les couleurs en temps réel
    if (skinEffect === 'color-shift') {
        skinColors = applyChameleonEffect(skinColors);
    }

    // Effet Glitch: décalage des couleurs
    if (skinEffect === 'glitch') {
        skinColors = applyGlitchEffect(skinColors);
    }

    // Effet Pulse: intensité variable
    const pulseIntensity = skinEffect === 'pulse' ? 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(animationState.pulsePhase)) : 1;

    // Effet Void: aura sombre pulsante
    const voidAura = skinEffect === 'void' ? 0.5 + 0.5 * Math.sin(animationState.voidPhase) : 0;

    snake.forEach((segment, index) => {
        const x = segment.x * gridSize;
        const y = segment.y * gridSize;
        let centerX = x + gridSize / 2;
        let centerY = y + gridSize / 2;

        // Effet Glitch: décalage de position aléatoire
        if (skinEffect === 'glitch' && index > 0) {
            centerX += animationState.glitchOffset * (Math.random() > 0.5 ? 1 : -1);
        }

        // Effet Scanner: calculer l'intensité lumineuse pour ce segment
        let scanIntensity = 0;
        if (skinEffect === 'scan') {
            const segmentRatio = index / snake.length;
            const distance = Math.abs(segmentRatio - animationState.scanPosition);
            scanIntensity = Math.max(0, 1 - distance * 5); // Rayon de lumière
        }

        // Effet Flame: ondulation
        let flameOffset = 0;
        if (skinEffect === 'flame') {
            flameOffset = Math.sin(animationState.flamePhase + index * 0.5) * 2;
        }

        if (index === 0) {
            // ==========================================
            // TÊTE avec yeux animés
            // ==========================================

            // Dégradé radial pour la tête
            const gradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, gridSize / 2
            );
            gradient.addColorStop(0, skinColors.head.light);  // Centre clair
            gradient.addColorStop(1, skinColors.head.dark);   // Bord foncé

            // Cercle principal
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, gridSize / 2, 0, Math.PI * 2);
            ctx.fill();

            // Contour
            ctx.strokeStyle = skinColors.outline;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Glow (effet lumineux) - amplifié par Scanner
            const glowIntensity = skinEffect === 'scan' ? 10 + scanIntensity * 20 : 10;
            ctx.shadowColor = skinColors.glow;
            ctx.shadowBlur = glowIntensity;
            ctx.beginPath();
            ctx.arc(centerX, centerY, gridSize / 2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0; // Reset shadow

            // Effet Couronne: dessiner la couronne sur la tête
            if (skinEffect === 'crown') {
                drawCrown(ctx, centerX, centerY, gridSize, direction);
            }

            // ==========================================
            // YEUX selon la direction
            // ==========================================

            let eyeX1, eyeY1, eyeX2, eyeY2;

            switch(direction) {
                case 'up':
                    eyeX1 = centerX - gridSize * 0.2;
                    eyeX2 = centerX + gridSize * 0.2;
                    eyeY1 = eyeY2 = centerY - gridSize * 0.15;
                    break;

                case 'down':
                    eyeX1 = centerX - gridSize * 0.2;
                    eyeX2 = centerX + gridSize * 0.2;
                    eyeY1 = eyeY2 = centerY + gridSize * 0.15;
                    break;

                case 'left':
                    eyeX1 = eyeX2 = centerX - gridSize * 0.15;
                    eyeY1 = centerY - gridSize * 0.2;
                    eyeY2 = centerY + gridSize * 0.2;
                    break;

                case 'right':
                    eyeX1 = eyeX2 = centerX + gridSize * 0.15;
                    eyeY1 = centerY - gridSize * 0.2;
                    eyeY2 = centerY + gridSize * 0.2;
                    break;

                default:
                    eyeX1 = eyeX2 = centerX + gridSize * 0.15;
                    eyeY1 = centerY - gridSize * 0.2;
                    eyeY2 = centerY + gridSize * 0.2;
            }

            // Blanc des yeux
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(eyeX1, eyeY1, gridSize * 0.12, 0, Math.PI * 2);
            ctx.arc(eyeX2, eyeY2, gridSize * 0.12, 0, Math.PI * 2);
            ctx.fill();

            // Pupilles noires
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(eyeX1, eyeY1, gridSize * 0.06, 0, Math.PI * 2);
            ctx.arc(eyeX2, eyeY2, gridSize * 0.06, 0, Math.PI * 2);
            ctx.fill();

        } else if (index === snake.length - 1) {
            // ==========================================
            // QUEUE effilée et transparente
            // ==========================================

            const gradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, gridSize / 3
            );

            // Utiliser la couleur de la queue du skin
            const tailColor = skinColors.tail.color;
            const rgb = hexToRgb(tailColor);

            gradient.addColorStop(0, tailColor);
            gradient.addColorStop(0.7, tailColor);
            gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`); // Transparent au bord

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, gridSize / 3, 0, Math.PI * 2);
            ctx.fill();

        } else {
            // ==========================================
            // CORPS avec dégradé progressif
            // ==========================================

            // Calculer le ratio de position (0 = près tête, 1 = près queue)
            const ratio = index / snake.length;

            // Interpoler les couleurs
            let color1 = interpolateColor(skinColors.body.from, skinColors.body.to, ratio);
            let color2 = interpolateColor(skinColors.body.to, skinColors.tail.color, ratio);

            // Effet Scanner: éclaircir le segment si la lumière passe dessus
            if (skinEffect === 'scan' && scanIntensity > 0) {
                color1 = lightenColor(color1, scanIntensity * 0.5);
                color2 = lightenColor(color2, scanIntensity * 0.5);
            }

            const gradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, gridSize / 2 * 0.9
            );
            gradient.addColorStop(0, color1);
            gradient.addColorStop(1, color2);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, gridSize / 2 * 0.9, 0, Math.PI * 2);
            ctx.fill();

            // Contour subtil
            ctx.strokeStyle = skinColors.outline;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Glow pour Scanner
            if (skinEffect === 'scan' && scanIntensity > 0.3) {
                ctx.shadowColor = skinColors.glow;
                ctx.shadowBlur = scanIntensity * 15;
                ctx.beginPath();
                ctx.arc(centerX, centerY, gridSize / 2 * 0.9, 0, Math.PI * 2);
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        }
    });
}

/**
 * Helper: Interpoler entre deux couleurs
 * @param {string} color1 - Couleur de départ (hex)
 * @param {string} color2 - Couleur d'arrivée (hex)
 * @param {number} ratio - Ratio d'interpolation (0-1)
 * @returns {string} Couleur interpolée en RGB
 */
function interpolateColor(color1, color2, ratio) {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);

    const r = Math.round(c1.r + (c2.r - c1.r) * ratio);
    const g = Math.round(c1.g + (c2.g - c1.g) * ratio);
    const b = Math.round(c1.b + (c2.b - c1.b) * ratio);

    return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Helper: Convertir hex en RGB
 * @param {string} hex - Couleur en hexadécimal
 * @returns {object} {r, g, b}
 */
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 255, b: 135 }; // Fallback vert
}

/**
 * Convertir une direction en chaîne de caractères
 * @param {number} dx - Déplacement X
 * @param {number} dy - Déplacement Y
 * @returns {string} Direction ('up', 'down', 'left', 'right')
 */
export function getDirectionString(dx, dy) {
    if (dx === 1 && dy === 0) return 'right';
    if (dx === -1 && dy === 0) return 'left';
    if (dx === 0 && dy === -1) return 'up';
    if (dx === 0 && dy === 1) return 'down';
    return 'right'; // Défaut
}

/**
 * Applique l'effet caméléon (changement de teinte)
 * @param {object} skinColors - Couleurs originales du skin
 * @returns {object} Couleurs modifiées
 */
function applyChameleonEffect(skinColors) {
    const hue = animationState.chameleonHue;

    return {
        head: {
            light: hslToHex(hue, 80, 70),
            dark: hslToHex(hue, 80, 50)
        },
        body: {
            from: hslToHex(hue, 80, 60),
            to: hslToHex(hue, 80, 35)
        },
        tail: {
            color: hslToHex(hue, 80, 25)
        },
        outline: hslToHex(hue, 80, 15),
        glow: hslToHex(hue, 100, 60)
    };
}

/**
 * Dessine une couronne sur la tête du serpent
 * @param {CanvasRenderingContext2D} ctx - Contexte canvas
 * @param {number} centerX - Centre X de la tête
 * @param {number} centerY - Centre Y de la tête
 * @param {number} gridSize - Taille de la grille
 * @param {string} direction - Direction du serpent
 */
function drawCrown(ctx, centerX, centerY, gridSize, direction) {
    const crownSize = gridSize * 0.35;

    // Position de la couronne selon la direction
    let crownX = centerX;
    let crownY = centerY - gridSize * 0.45;

    switch(direction) {
        case 'up':
            crownY = centerY - gridSize * 0.45;
            break;
        case 'down':
            crownY = centerY + gridSize * 0.45;
            break;
        case 'left':
            crownX = centerX - gridSize * 0.45;
            crownY = centerY - gridSize * 0.2;
            break;
        case 'right':
            crownX = centerX + gridSize * 0.45;
            crownY = centerY - gridSize * 0.2;
            break;
    }

    // Dessiner la couronne (forme simplifiée)
    ctx.fillStyle = '#FFD700'; // Or
    ctx.strokeStyle = '#B8860B'; // Or foncé
    ctx.lineWidth = 1;

    // Base de la couronne
    ctx.beginPath();
    ctx.arc(crownX, crownY, crownSize * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pointes de la couronne (3 triangles)
    for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        const angle = (Math.PI / 3) * i;
        const px = crownX + Math.sin(angle) * crownSize * 0.5;
        const py = crownY - Math.cos(angle) * crownSize * 0.5;

        ctx.moveTo(px, py);
        ctx.lineTo(px - crownSize * 0.15, py);
        ctx.lineTo(px, py - crownSize * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    // Bijoux sur la couronne (petits points brillants)
    ctx.fillStyle = '#FF69B4'; // Rose vif
    for (let i = -1; i <= 1; i++) {
        const angle = (Math.PI / 3) * i;
        const px = crownX + Math.sin(angle) * crownSize * 0.35;
        const py = crownY - Math.cos(angle) * crownSize * 0.35;

        ctx.beginPath();
        ctx.arc(px, py, crownSize * 0.12, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * Éclaircit une couleur RGB
 * @param {string} color - Couleur RGB ou hex
 * @param {number} factor - Facteur d'éclaircissement (0-1)
 * @returns {string} Couleur éclaircie en RGB
 */
function lightenColor(color, factor) {
    // Extraire RGB
    let rgb;
    if (color.startsWith('#')) {
        rgb = hexToRgb(color);
    } else {
        const match = color.match(/\d+/g);
        rgb = { r: parseInt(match[0]), g: parseInt(match[1]), b: parseInt(match[2]) };
    }

    // Éclaircir vers le blanc
    const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * factor));
    const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * factor));
    const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * factor));

    return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Convertit HSL en hexadécimal
 * @param {number} h - Teinte (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Luminosité (0-100)
 * @returns {string} Couleur hex
 */
function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;

    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) {
        r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
        r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
        r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
        r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
        r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
        r = c; g = 0; b = x;
    }

    const toHex = (val) => {
        const hex = Math.round((val + m) * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Dessiner un aperçu miniature du skin (pour la Box)
 * Forme en S élégante avec plus de segments
 * @param {CanvasRenderingContext2D} ctx - Contexte du canvas
 * @param {string} skinId - ID du skin
 * @param {number} size - Taille du canvas
 */
export function drawSkinPreview(ctx, skinId, size = 100) {
    const skin = getItemById(skinId);
    if (!skin || !skin.colors) {
        logger.warn(`[SkinsRenderer] Skin ${skinId} introuvable ou sans couleurs`);
        return;
    }

    // Effacer le canvas
    ctx.clearRect(0, 0, size, size);

    // Taille d'un segment - plus petit pour un look plus élégant
    const segmentSize = size / 8;
    const centerX = size / 2;
    const centerY = size / 2;

    // Forme en S avec 7 segments - plus joli et dynamique
    const snakeShape = [
        { x: 0.72, y: 0.35 },  // Tête
        { x: 0.58, y: 0.38 },
        { x: 0.45, y: 0.45 },
        { x: 0.38, y: 0.55 },
        { x: 0.42, y: 0.65 },
        { x: 0.55, y: 0.68 },
        { x: 0.68, y: 0.65 },  // Queue
    ];

    // Dessiner le glow d'abord (arrière-plan)
    ctx.shadowColor = skin.colors.glow;
    ctx.shadowBlur = 8;

    // Dessiner les segments de la queue vers la tête
    for (let i = snakeShape.length - 1; i >= 0; i--) {
        const pos = snakeShape[i];
        const x = pos.x * size;
        const y = pos.y * size;
        const ratio = i / (snakeShape.length - 1);

        // Taille décroissante vers la queue
        let radius = segmentSize * (0.6 + 0.4 * (1 - ratio));

        if (i === 0) {
            // TÊTE - légèrement plus grosse
            radius = segmentSize * 1.1;

            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, skin.colors.head.light);
            gradient.addColorStop(1, skin.colors.head.dark);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();

            // Contour tête
            ctx.shadowBlur = 0;
            ctx.strokeStyle = skin.colors.outline;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Yeux - direction vers la droite-haut
            const eyeOffset = radius * 0.35;
            const eyeSize = radius * 0.22;
            const pupilSize = radius * 0.12;

            // Oeil gauche (haut)
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(x + eyeOffset * 0.7, y - eyeOffset, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(x + eyeOffset * 0.9, y - eyeOffset, pupilSize, 0, Math.PI * 2);
            ctx.fill();

            // Oeil droit (bas)
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(x + eyeOffset, y + eyeOffset * 0.3, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(x + eyeOffset * 1.1, y + eyeOffset * 0.3, pupilSize, 0, Math.PI * 2);
            ctx.fill();

        } else if (i === snakeShape.length - 1) {
            // QUEUE - plus petite et pointue
            radius = segmentSize * 0.4;
            const color = skin.colors.tail.color;

            ctx.fillStyle = color;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;

        } else {
            // CORPS - dégradé progressif
            const color = interpolateColorSimple(skin.colors.body.from, skin.colors.body.to, ratio);

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();

            // Contour léger
            ctx.shadowBlur = 0;
            ctx.strokeStyle = skin.colors.outline;
            ctx.lineWidth = 0.5;
            ctx.globalAlpha = 0.5;
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        ctx.shadowBlur = 4; // Réactiver pour le segment suivant
    }

    ctx.shadowBlur = 0;
}

/**
 * Helper simple pour interpoler les couleurs (pour preview)
 */
function interpolateColorSimple(color1, color2, ratio) {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    const r = Math.round(c1.r + (c2.r - c1.r) * ratio);
    const g = Math.round(c1.g + (c2.g - c1.g) * ratio);
    const b = Math.round(c1.b + (c2.b - c1.b) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Applique l'effet Glitch (décalage de couleurs RGB)
 */
function applyGlitchEffect(colors) {
    const offset = animationState.glitchOffset * 20;
    const hue = (animationState.chameleonHue + offset) % 360;

    // Alterner entre cyan et magenta de façon glitchée
    const glitchColor1 = hslToHex(hue, 100, 50);
    const glitchColor2 = hslToHex((hue + 180) % 360, 100, 50);

    return {
        head: { light: glitchColor1, dark: glitchColor2 },
        body: { from: glitchColor1, to: glitchColor2 },
        tail: { color: glitchColor2 },
        outline: '#000000',
        glow: '#FFFFFF'
    };
}

/**
 * Applique l'effet Pulse (pulsation verte toxique)
 */
function applyPulseIntensity(color, intensity) {
    const rgb = hexToRgb(color);
    const factor = 0.5 + 0.5 * intensity;
    return `rgb(${Math.round(rgb.r * factor)}, ${Math.round(rgb.g * factor)}, ${Math.round(rgb.b * factor)})`;
}

/**
 * Dessine l'aura void (effet sombre autour du serpent)
 */
function drawVoidAura(ctx, centerX, centerY, radius, intensity) {
    const gradient = ctx.createRadialGradient(
        centerX, centerY, radius * 0.8,
        centerX, centerY, radius * 2
    );
    gradient.addColorStop(0, `rgba(75, 0, 130, ${0.5 * intensity})`);
    gradient.addColorStop(0.5, `rgba(139, 0, 255, ${0.3 * intensity})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 2, 0, Math.PI * 2);
    ctx.fill();
}

/**
 * Dessine des particules sparkle (effet doré)
 */
function drawSparkles(ctx, centerX, centerY, radius, count = 3) {
    const phase = animationState.sparklePhase;

    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + phase * Math.PI * 2;
        const distance = radius * (0.8 + 0.4 * Math.sin(phase * Math.PI * 4 + i));
        const sparkleX = centerX + Math.cos(angle) * distance;
        const sparkleY = centerY + Math.sin(angle) * distance;
        const sparkleSize = 2 + Math.sin(phase * Math.PI * 6 + i) * 1.5;

        ctx.fillStyle = `rgba(255, 215, 0, ${0.5 + 0.5 * Math.sin(phase * Math.PI * 4 + i)})`;
        ctx.beginPath();
        ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * Dessine l'effet flamme
 */
function drawFlameEffect(ctx, centerX, centerY, radius) {
    const phase = animationState.flamePhase;

    // Dessiner plusieurs "flammes" autour du segment
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const flameHeight = radius * 0.5 * (0.7 + 0.3 * Math.sin(phase + i));
        const flameX = centerX + Math.cos(angle) * radius;
        const flameY = centerY + Math.sin(angle) * radius;

        const gradient = ctx.createRadialGradient(
            flameX, flameY, 0,
            flameX, flameY - flameHeight, flameHeight
        );
        gradient.addColorStop(0, 'rgba(255, 69, 0, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 140, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(flameX, flameY - flameHeight / 2, radius * 0.3, flameHeight, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * Dessine l'effet circuit (lignes tech)
 */
function drawCircuitEffect(ctx, snake, gridSize) {
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    ctx.beginPath();
    snake.forEach((segment, index) => {
        const x = segment.x * gridSize + gridSize / 2;
        const y = segment.y * gridSize + gridSize / 2;

        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();
    ctx.setLineDash([]);
}

logger.log('✅ SkinsRenderer chargé');
