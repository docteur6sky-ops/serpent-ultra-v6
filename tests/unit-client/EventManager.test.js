// ============================================
// TESTS UNITAIRES - EventManager
// Tests pour le gestionnaire d'événements
// ============================================

import { EventManager, eventManager } from '../../www/managers/EventManager.js';

describe('EventManager - Gestionnaire d\'événements', () => {

  let manager;
  let target;

  beforeEach(() => {
    // Créer une nouvelle instance pour chaque test
    manager = new EventManager();

    // Créer un élément DOM pour les tests
    document.body.innerHTML = '<button id="test-button">Test</button>';
    target = document.getElementById('test-button');
  });

  afterEach(() => {
    // Nettoyer tous les listeners
    if (manager) {
      manager.cleanup();
    }
  });

  describe('Construction', () => {
    test('devrait créer une instance avec les propriétés correctes', () => {
      expect(manager.listeners).toBeInstanceOf(Map);
      expect(manager.listenerId).toBe(0);
    });

    test('eventManager devrait être un singleton', () => {
      expect(eventManager).toBeInstanceOf(EventManager);
    });
  });

  describe('add - Ajout d\'événements', () => {
    test('devrait ajouter un event listener et retourner un ID', () => {
      const handler = jest.fn();
      const id = manager.add(target, 'click', handler);

      expect(id).toBe(1);
      expect(typeof id).toBe('number');
    });

    test('devrait exécuter le handler quand l\'événement est déclenché', () => {
      const handler = jest.fn();
      manager.add(target, 'click', handler);

      target.click();
      expect(handler).toHaveBeenCalledTimes(1);
    });

    test('devrait passer l\'objet Event au handler', () => {
      const handler = jest.fn();
      manager.add(target, 'click', handler);

      target.click();
      expect(handler).toHaveBeenCalledWith(expect.any(Event));
    });

    test('devrait supporter plusieurs listeners sur le même élément', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      const id1 = manager.add(target, 'click', handler1);
      const id2 = manager.add(target, 'click', handler2);

      expect(id1).not.toBe(id2);

      target.click();
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    test('devrait supporter différents types d\'événements', () => {
      const clickHandler = jest.fn();
      const mouseoverHandler = jest.fn();

      manager.add(target, 'click', clickHandler);
      manager.add(target, 'mouseover', mouseoverHandler);

      target.click();
      expect(clickHandler).toHaveBeenCalled();
      expect(mouseoverHandler).not.toHaveBeenCalled();

      target.dispatchEvent(new Event('mouseover'));
      expect(mouseoverHandler).toHaveBeenCalled();
    });

    test('devrait accepter des options addEventListener', () => {
      const handler = jest.fn();
      manager.add(target, 'click', handler, { once: true });

      target.click();
      target.click();

      // Devrait n'être appelé qu'une fois grâce à { once: true }
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove - Retrait d\'événements', () => {
    test('devrait retirer un event listener par ID', () => {
      const handler = jest.fn();
      const id = manager.add(target, 'click', handler);

      const removed = manager.remove(id);
      expect(removed).toBe(true);

      target.click();
      expect(handler).not.toHaveBeenCalled();
    });

    test('devrait retourner false si ID inexistant', () => {
      const removed = manager.remove(999);
      expect(removed).toBe(false);
    });

    test('ne devrait pas affecter les autres listeners', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      const id1 = manager.add(target, 'click', handler1);
      manager.add(target, 'click', handler2);

      manager.remove(id1);

      target.click();
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    test('devrait nettoyer la Map si plus de handlers', () => {
      const handler = jest.fn();
      const id = manager.add(target, 'click', handler);

      manager.remove(id);
      expect(manager.listeners.has(target)).toBe(false);
    });
  });

  describe('removeAll - Retrait de tous les listeners d\'une target', () => {
    test('devrait retirer tous les listeners d\'un élément', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      manager.add(target, 'click', handler1);
      manager.add(target, 'mouseover', handler2);

      manager.removeAll(target);

      target.click();
      target.dispatchEvent(new Event('mouseover'));

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    test('ne devrait pas planter si target n\'a pas de listeners', () => {
      const otherElement = document.createElement('div');
      expect(() => manager.removeAll(otherElement)).not.toThrow();
    });

    test('ne devrait pas affecter les autres targets', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const otherTarget = document.createElement('button');

      manager.add(target, 'click', handler1);
      manager.add(otherTarget, 'click', handler2);

      manager.removeAll(target);

      target.click();
      otherTarget.click();

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });

  describe('removeByType - Retrait par type d\'événement', () => {
    test('devrait retirer tous les listeners d\'un type spécifique', () => {
      const clickHandler1 = jest.fn();
      const clickHandler2 = jest.fn();
      const mouseoverHandler = jest.fn();

      manager.add(target, 'click', clickHandler1);
      manager.add(target, 'click', clickHandler2);
      manager.add(target, 'mouseover', mouseoverHandler);

      manager.removeByType('click');

      target.click();
      target.dispatchEvent(new Event('mouseover'));

      expect(clickHandler1).not.toHaveBeenCalled();
      expect(clickHandler2).not.toHaveBeenCalled();
      expect(mouseoverHandler).toHaveBeenCalled();
    });

    test('devrait fonctionner sur plusieurs targets', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const otherTarget = document.createElement('button');

      manager.add(target, 'click', handler1);
      manager.add(otherTarget, 'click', handler2);

      manager.removeByType('click');

      target.click();
      otherTarget.click();

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('cleanup - Nettoyage complet', () => {
    test('devrait retirer tous les listeners', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const handler3 = jest.fn();
      const otherTarget = document.createElement('button');

      manager.add(target, 'click', handler1);
      manager.add(target, 'mouseover', handler2);
      manager.add(otherTarget, 'click', handler3);

      manager.cleanup();

      target.click();
      target.dispatchEvent(new Event('mouseover'));
      otherTarget.click();

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
      expect(handler3).not.toHaveBeenCalled();
    });

    test('devrait vider la Map des listeners', () => {
      manager.add(target, 'click', jest.fn());
      manager.add(target, 'mouseover', jest.fn());

      manager.cleanup();
      expect(manager.listeners.size).toBe(0);
    });
  });

  describe('getStats - Statistiques', () => {
    test('devrait retourner des stats vides au départ', () => {
      const stats = manager.getStats();

      expect(stats.targets).toBe(0);
      expect(stats.totalListeners).toBe(0);
      expect(stats.byType).toEqual({});
    });

    test('devrait compter correctement les listeners', () => {
      const otherTarget = document.createElement('button');

      manager.add(target, 'click', jest.fn());
      manager.add(target, 'click', jest.fn());
      manager.add(target, 'mouseover', jest.fn());
      manager.add(otherTarget, 'click', jest.fn());

      const stats = manager.getStats();

      expect(stats.targets).toBe(2);
      expect(stats.totalListeners).toBe(4);
      expect(stats.byType).toEqual({
        click: 3,
        mouseover: 1
      });
    });

    test('devrait mettre à jour les stats après retrait', () => {
      const id1 = manager.add(target, 'click', jest.fn());
      manager.add(target, 'click', jest.fn());

      manager.remove(id1);

      const stats = manager.getStats();
      expect(stats.totalListeners).toBe(1);
    });
  });

  describe('Prévention des memory leaks', () => {
    test('devrait permettre le garbage collection des targets supprimées', () => {
      let tempTarget = document.createElement('button');
      const handler = jest.fn();

      const id = manager.add(tempTarget, 'click', handler);

      // Retirer le listener
      manager.remove(id);

      // La target ne devrait plus être dans la Map
      expect(manager.listeners.has(tempTarget)).toBe(false);

      // Permettre le GC
      tempTarget = null;
    });

    test('cleanup devrait permettre le GC de toutes les targets', () => {
      let tempTarget1 = document.createElement('button');
      let tempTarget2 = document.createElement('button');

      manager.add(tempTarget1, 'click', jest.fn());
      manager.add(tempTarget2, 'click', jest.fn());

      manager.cleanup();

      expect(manager.listeners.size).toBe(0);

      tempTarget1 = null;
      tempTarget2 = null;
    });
  });
});
