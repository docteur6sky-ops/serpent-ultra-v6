// ============================================
// CLASSE SNAKE - SERVEUR MULTIJOUEUR
// Encapsulation de la logique du serpent
// ============================================

class Snake {
    constructor(x, y, playerId, initialLength = 1) {
        this.playerId = playerId;
        // Créer le serpent avec la longueur initiale selon le grade
        // Segments créés vers la gauche avec wrapping (grille 30x30)
        this.body = [];
        for (let i = 0; i < initialLength; i++) {
            let segX = x - i;
            if (segX < 0) segX += 30; // Wrapping pour positions négatives
            this.body.push({ x: segX, y });
        }
        this.direction = { dx: 1, dy: 0 };
        this.nextDirection = { dx: 1, dy: 0 };
        this.score = 0;
        this.alive = true;
        this.invincible = false;  // ✅ NOUVEAU - Pour éjection tête-à-tête
    }

    get length() {
        return this.body.length;
    }

    get head() {
        return this.body[0];
    }

    // Déplacer le serpent
    move() {
        if (!this.alive) return;

        // Appliquer le changement de direction
        this.direction = { ...this.nextDirection };

        // Calculer nouvelle position de la tête
        const newHead = {
            x: this.head.x + this.direction.dx,
            y: this.head.y + this.direction.dy
        };

        // Téléportation aux bords (wrapping)
        if (newHead.x < 0) newHead.x = 29; // GRID_SIZE - 1
        if (newHead.x >= 30) newHead.x = 0;
        if (newHead.y < 0) newHead.y = 29;
        if (newHead.y >= 30) newHead.y = 0;

        // Ajouter nouvelle tête
        this.body.unshift(newHead);

        // Retirer la queue (sauf si on vient de manger)
        // La croissance est gérée par grow() qui ne pop pas
        this.body.pop();
    }

    // Changer de direction (avec validation anti-retour)
    changeDirection(newDirection) {
        const opposites = {
            '0,-1': '0,1',   // up <-> down
            '0,1': '0,-1',
            '-1,0': '1,0',   // left <-> right
            '1,0': '-1,0'
        };

        const currentKey = `${this.direction.dx},${this.direction.dy}`;
        const newKey = `${newDirection.dx},${newDirection.dy}`;

        // Empêcher le demi-tour
        if (opposites[currentKey] !== newKey) {
            this.nextDirection = newDirection;
        }
    }

    // Grandir (manger une étoile)
    grow() {
        if (!this.alive) return;

        // Ajouter un segment à la queue
        const tail = this.body[this.body.length - 1];
        this.body.push({ ...tail });
    }

    // Rétrécir (perdre des segments)
    // Le serpent meurt quand il perd son dernier segment (passe à 0)
    shrink(amount) {
        if (!this.alive) return;

        for (let i = 0; i < amount; i++) {
            if (this.body.length > 1) {
                // Retirer un segment du corps (pas la tête)
                this.body.pop();
            } else if (this.body.length === 1) {
                // Retirer le dernier segment (la tête) et mourir
                this.body.pop();  // body devient vide (length = 0)
                this.die();
                return;
            } else {
                // Déjà à 0, juste mourir
                this.die();
                return;
            }
        }
    }

    // Ajouter des points
    addScore(points) {
        this.score = Math.max(0, this.score + points);
    }

    // Vérifier si la tête est à une position donnée
    headAt(x, y) {
        return this.head.x === x && this.head.y === y;
    }

    // Vérifier si le serpent occupe une position
    isAt(x, y) {
        return this.body.some(segment => segment.x === x && segment.y === y);
    }

    // Vérifier collision avec soi-même
    checkSelfCollision() {
        const head = this.head;
        // Vérifier si la tête touche le corps (ignorer la tête elle-même)
        for (let i = 1; i < this.body.length; i++) {
            if (this.body[i].x === head.x && this.body[i].y === head.y) {
                return true;
            }
        }
        return false;
    }

    // Vérifier collision avec un obstacle
    checkObstacleCollision(obstacles) {
        const head = this.head;
        return obstacles.some(obs => obs.x === head.x && obs.y === head.y);
    }

    // Vérifier collision avec un autre serpent
    collidesWithSnake(otherSnake) {
        const head = this.head;
        return otherSnake.body.some(segment =>
            segment.x === head.x && segment.y === head.y
        );
    }

    // Vérifier toutes les collisions
    checkCollision(gridSize, obstacles = []) {
        // Pas de collision avec les bords (wrapping)
        // Vérifier collision avec soi-même
        if (this.checkSelfCollision()) {
            return 'self';
        }
        // Vérifier collision avec obstacles
        if (this.checkObstacleCollision(obstacles)) {
            return 'obstacle';
        }
        return null;
    }

    // Mourir
    die() {
        this.alive = false;
    }

    // Réinitialiser le serpent (avec longueur initiale selon grade)
    reset(x, y, direction = { dx: 1, dy: 0 }, initialLength = null) {
        // Utiliser la longueur passée ou conserver la longueur actuelle
        const length = initialLength || this.body.length || 1;

        // Recréer le corps avec la bonne longueur
        this.body = [];
        for (let i = 0; i < length; i++) {
            let segX = x - i;
            if (segX < 0) segX += 30; // Wrapping pour positions négatives
            this.body.push({ x: segX, y });
        }

        this.direction = direction;
        this.nextDirection = direction;
        this.score = 0;
        this.alive = true;
    }

    // Sérialiser pour envoyer au client
    toJSON() {
        return {
            id: this.playerId,
            snake: this.body,
            direction: this.direction,
            score: this.score,
            alive: this.alive
        };
    }
}

// ============================================
// HELPERS DE DIRECTION
// ============================================

// Fonction helper pour tourner à gauche (perpendiculaire)
function getPerpendicularLeft(direction) {
    // Droite (1,0) → Haut (0,-1)
    // Haut (0,-1) → Gauche (-1,0)
    // Gauche (-1,0) → Bas (0,1)
    // Bas (0,1) → Droite (1,0)
    return { dx: direction.dy, dy: -direction.dx };
}

// Fonction helper pour tourner à droite (perpendiculaire)
function getPerpendicularRight(direction) {
    // Droite (1,0) → Bas (0,1)
    // Bas (0,1) → Gauche (-1,0)
    // Gauche (-1,0) → Haut (0,-1)
    // Haut (0,-1) → Droite (1,0)
    return { dx: -direction.dy, dy: direction.dx };
}

// Export pour Node.js (serveur)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Snake;
    module.exports.getPerpendicularLeft = getPerpendicularLeft;
    module.exports.getPerpendicularRight = getPerpendicularRight;
}
