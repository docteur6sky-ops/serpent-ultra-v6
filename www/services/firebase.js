// ============================================
// FIREBASE SERVICE - SNAKE ULTRA
// Configuration et initialisation Firebase
// ============================================

import { initializeApp } from 'firebase/app';
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import {
    getFirestore,
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    query,
    orderBy,
    limit,
    getDocs,
    serverTimestamp,
    where
} from 'firebase/firestore';
import { logger } from './logger.js';

// ============================================
// CONFIGURATION FIREBASE
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyDh4ohOPgUkg7Zw-TcRd5faoTB-Jw9-HCI",
    authDomain: "snake-ultra.firebaseapp.com",
    projectId: "snake-ultra",
    storageBucket: "snake-ultra.firebasestorage.app",
    messagingSenderId: "395471982420",
    appId: "1:395471982420:web:96ae1c07ddbd28feef42c1"
};

// ============================================
// INITIALISATION
// ============================================

let app = null;
let auth = null;
let db = null;
let currentUser = null;

/**
 * Initialise Firebase
 */
export function initFirebase() {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);

        // Écouter les changements d'authentification
        onAuthStateChanged(auth, (user) => {
            currentUser = user;
            if (user) {
                logger.log('[Firebase] Utilisateur connecté:', user.displayName);
                // Créer/mettre à jour le profil
                createOrUpdateUserProfile(user);
                // Dispatch event pour l'UI
                window.dispatchEvent(new CustomEvent('firebase-auth-changed', {
                    detail: { user, isLoggedIn: true }
                }));
            } else {
                logger.log('[Firebase] Utilisateur déconnecté');
                window.dispatchEvent(new CustomEvent('firebase-auth-changed', {
                    detail: { user: null, isLoggedIn: false }
                }));
            }
        });

        logger.log('[Firebase] Initialisé avec succès');
        return true;
    } catch (error) {
        logger.error('[Firebase] Erreur initialisation:', error);
        return false;
    }
}

// ============================================
// AUTHENTIFICATION GOOGLE
// ============================================

/**
 * Connexion avec Google
 * @returns {Promise<object|null>} User object ou null
 */
export async function signInWithGoogle() {
    if (!auth) {
        logger.error('[Firebase] Auth non initialisé');
        return null;
    }

    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        logger.log('[Firebase] Connexion Google réussie:', result.user.displayName);
        return result.user;
    } catch (error) {
        // Ignorer si l'utilisateur ferme le popup
        if (error.code === 'auth/popup-closed-by-user') {
            logger.log('[Firebase] Popup fermé par l\'utilisateur');
            return null;
        }
        logger.error('[Firebase] Erreur connexion Google:', error.message);
        return null;
    }
}

/**
 * Déconnexion
 */
export async function logOut() {
    if (!auth) return;

    try {
        await signOut(auth);
        logger.log('[Firebase] Déconnexion réussie');
    } catch (error) {
        logger.error('[Firebase] Erreur déconnexion:', error);
    }
}

/**
 * Retourne l'utilisateur actuel
 */
export function getCurrentUser() {
    return currentUser;
}

/**
 * Vérifie si l'utilisateur est connecté
 */
export function isLoggedIn() {
    return currentUser !== null;
}

// ============================================
// PROFIL UTILISATEUR
// ============================================

/**
 * Crée ou met à jour le profil utilisateur
 */
async function createOrUpdateUserProfile(user) {
    if (!db || !user) return;

    try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            // Nouveau utilisateur
            await setDoc(userRef, {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                stats: {
                    totalGames: 0,
                    totalScore: 0,
                    bestScore: 0,
                    bestCombo: 0,
                    totalPlayTime: 0,
                    bossesDefeated: 0,
                    roguelikeWins: 0
                }
            });
            logger.log('[Firebase] Nouveau profil créé');
        } else {
            // Utilisateur existant - mettre à jour lastLogin
            await updateDoc(userRef, {
                lastLogin: serverTimestamp(),
                displayName: user.displayName,
                photoURL: user.photoURL
            });
        }
    } catch (error) {
        logger.error('[Firebase] Erreur profil:', error);
    }
}

/**
 * Récupère le profil utilisateur
 */
export async function getUserProfile() {
    if (!db || !currentUser) return null;

    try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return userSnap.data();
        }
        return null;
    } catch (error) {
        logger.error('[Firebase] Erreur récupération profil:', error);
        return null;
    }
}

/**
 * Met à jour les stats utilisateur
 */
export async function updateUserStats(newStats) {
    if (!db || !currentUser) return false;

    try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
            stats: newStats,
            lastUpdated: serverTimestamp()
        });
        return true;
    } catch (error) {
        logger.error('[Firebase] Erreur mise à jour stats:', error);
        return false;
    }
}

// ============================================
// LEADERBOARD
// ============================================

/**
 * Soumet un score au leaderboard
 * @param {string} mode - 'solo', 'roguelike', 'bossrush'
 * @param {number} score - Le score
 * @param {object} details - Détails supplémentaires (combo, niveau, etc.)
 */
export async function submitScore(mode, score, details = {}) {
    if (!db || !currentUser) {
        logger.warn('[Firebase] Impossible de soumettre: non connecté');
        return false;
    }

    try {
        const leaderboardRef = collection(db, 'leaderboards', mode, 'scores');
        const scoreDoc = doc(leaderboardRef, currentUser.uid);

        // Vérifier si c'est un nouveau record personnel
        const existingScore = await getDoc(scoreDoc);

        if (!existingScore.exists() || existingScore.data().score < score) {
            await setDoc(scoreDoc, {
                displayName: currentUser.displayName,
                photoURL: currentUser.photoURL,
                score: score,
                details: details,
                timestamp: serverTimestamp()
            });

            logger.log(`[Firebase] Nouveau record ${mode}: ${score}`);

            // Mettre à jour aussi le bestScore dans le profil
            const userRef = doc(db, 'users', currentUser.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const currentBest = userSnap.data().stats?.bestScore || 0;
                if (score > currentBest) {
                    await updateDoc(userRef, {
                        'stats.bestScore': score
                    });
                }
            }

            return true;
        }

        return false; // Pas un nouveau record
    } catch (error) {
        logger.error('[Firebase] Erreur soumission score:', error);
        return false;
    }
}

/**
 * Récupère le leaderboard
 * @param {string} mode - 'solo', 'roguelike', 'bossrush'
 * @param {number} limitCount - Nombre de scores à récupérer
 */
export async function getLeaderboard(mode, limitCount = 10) {
    if (!db) {
        logger.error('[Firebase] DB non initialisée');
        return [];
    }

    try {
        const leaderboardRef = collection(db, 'leaderboards', mode, 'scores');
        const q = query(leaderboardRef, orderBy('score', 'desc'), limit(limitCount));
        const snapshot = await getDocs(q);

        const scores = [];
        let rank = 1;
        snapshot.forEach((doc) => {
            scores.push({
                rank: rank++,
                displayName: doc.data().displayName || 'Anonyme',
                photoURL: doc.data().photoURL,
                score: doc.data().score,
                details: doc.data().details,
                isCurrentUser: doc.id === currentUser?.uid
            });
        });

        logger.log(`[Firebase] Leaderboard ${mode}: ${scores.length} scores`);
        return scores;
    } catch (error) {
        logger.error('[Firebase] Erreur récupération leaderboard:', error);
        return [];
    }
}

/**
 * Récupère le rang de l'utilisateur actuel
 */
export async function getUserRank(mode) {
    if (!db || !currentUser) return null;

    try {
        const leaderboardRef = collection(db, 'leaderboards', mode, 'scores');
        const userScoreRef = doc(leaderboardRef, currentUser.uid);
        const userScoreSnap = await getDoc(userScoreRef);

        if (!userScoreSnap.exists()) return null;

        const userScore = userScoreSnap.data().score;

        // Compter combien de scores sont supérieurs
        const q = query(leaderboardRef, where('score', '>', userScore));
        const snapshot = await getDocs(q);

        return snapshot.size + 1; // +1 car le rang commence à 1
    } catch (error) {
        logger.error('[Firebase] Erreur récupération rang:', error);
        return null;
    }
}

// ============================================
// SAUVEGARDE CLOUD
// ============================================

/**
 * Sauvegarde la progression dans le cloud
 */
export async function saveProgressToCloud(progressData) {
    if (!db || !currentUser) return false;

    try {
        const progressRef = doc(db, 'users', currentUser.uid, 'progress', 'current');
        await setDoc(progressRef, {
            ...progressData,
            lastSaved: serverTimestamp()
        });

        logger.log('[Firebase] Progression sauvegardée');
        return true;
    } catch (error) {
        logger.error('[Firebase] Erreur sauvegarde:', error);
        return false;
    }
}

/**
 * Charge la progression depuis le cloud
 */
export async function loadProgressFromCloud() {
    if (!db || !currentUser) return null;

    try {
        const progressRef = doc(db, 'users', currentUser.uid, 'progress', 'current');
        const progressSnap = await getDoc(progressRef);

        if (progressSnap.exists()) {
            logger.log('[Firebase] Progression chargée');
            return progressSnap.data();
        }
        return null;
    } catch (error) {
        logger.error('[Firebase] Erreur chargement:', error);
        return null;
    }
}

// ============================================
// EXPORTS
// ============================================

export default {
    initFirebase,
    signInWithGoogle,
    logOut,
    getCurrentUser,
    isLoggedIn,
    getUserProfile,
    updateUserStats,
    submitScore,
    getLeaderboard,
    getUserRank,
    saveProgressToCloud,
    loadProgressFromCloud
};
