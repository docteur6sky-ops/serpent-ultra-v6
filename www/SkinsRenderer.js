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

    snake.forEach((segment, index) => {
        const x = segment.x * gridSize;
        const y = segment.y * gridSize;
        const centerX = x + gridSize / 2;
        const centerY = y + gridSize / 2;

        // Effet Scanner: calculer l'intensité lumineuse pour ce segment
        let scanIntensity = 0;
        if (skinEffect === 'scan') {
            const segmentRatio = index / snake.length;
            const distance = Math.abs(segmentRatio - animationState.scanPosition);
            scanIntensity = Math.max(0, 1 - distance * 5); // Rayon de lumière
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

    // Taille d'un segment
    const segmentSize = size / 4;
    const centerY = size / 2;

    // Dessiner 3 segments horizontaux centrés
    const segments = [
        { x: size * 0.7, isHead: true },   // Tête (droite)
        { x: size * 0.45, isHead: false }, // Corps
        { x: size * 0.2, isHead: false }   // Queue
    ];

    segments.forEach((seg, index) => {
        const ratio = index / segments.length;

        if (seg.isHead) {
            // Tête avec dégradé
            const gradient = ctx.createRadialGradient(
                seg.x, centerY, 0,
                seg.x, centerY, segmentSize / 2
            );
            gradient.addColorStop(0, skin.colors.head.light);
            gradient.addColorStop(1, skin.colors.head.dark);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(seg.x, centerY, segmentSize / 2, 0, Math.PI * 2);
            ctx.fill();

            // Contour
            ctx.strokeStyle = skin.colors.outline;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Yeux
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(seg.x + segmentSize * 0.15, centerY - segmentSize * 0.15, segmentSize * 0.1, 0, Math.PI * 2);
            ctx.arc(seg.x + segmentSize * 0.15, centerY + segmentSize * 0.15, segmentSize * 0.1, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(seg.x + segmentSize * 0.15, centerY - segmentSize * 0.15, segmentSize * 0.05, 0, Math.PI * 2);
            ctx.arc(seg.x + segmentSize * 0.15, centerY + segmentSize * 0.15, segmentSize * 0.05, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Corps/Queue avec dégradé progressif
            const color = interpolateColorSimple(skin.colors.body.from, skin.colors.body.to, ratio);
            const radius = index === segments.length - 1 ? segmentSize / 3 : segmentSize / 2 * 0.9;

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(seg.x, centerY, radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = skin.colors.outline;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    });
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

logger.log('✅ SkinsRenderer chargé');
