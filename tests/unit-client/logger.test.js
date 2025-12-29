// ============================================
// TESTS UNITAIRES - Logger
// Tests pour le service de logging
// ============================================

import { logger } from '../../www/services/logger.js';

describe('Logger - Service de logging', () => {

  beforeEach(() => {
    // Reset tous les mocks
    jest.clearAllMocks();

    // Mock console (déjà fait dans setup.js mais on s'assure)
    global.console = {
      ...console,
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      group: jest.fn(),
      groupEnd: jest.fn(),
      table: jest.fn(),
      time: jest.fn(),
      timeEnd: jest.fn()
    };
  });

  describe('Méthodes de logging', () => {
    test('devrait avoir toutes les méthodes requises', () => {
      expect(logger).toHaveProperty('log');
      expect(logger).toHaveProperty('warn');
      expect(logger).toHaveProperty('error');
      expect(logger).toHaveProperty('debug');
      expect(logger).toHaveProperty('group');
      expect(logger).toHaveProperty('groupEnd');
      expect(logger).toHaveProperty('table');
      expect(logger).toHaveProperty('time');
      expect(logger).toHaveProperty('timeEnd');
    });

    test('devrait être des fonctions', () => {
      expect(typeof logger.log).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });
  });

  describe('Comportement des méthodes', () => {
    test('logger.log devrait accepter plusieurs arguments', () => {
      expect(() => logger.log('test')).not.toThrow();
      expect(() => logger.log('test', 1, 2, 3)).not.toThrow();
      expect(() => logger.log('test', { foo: 'bar' })).not.toThrow();
    });

    test('logger.error devrait toujours logger (même en prod)', () => {
      logger.error('Erreur critique');
      // L'erreur devrait toujours être loggée
      expect(console.error).toHaveBeenCalled();
    });

    test('logger.warn devrait logger les warnings', () => {
      logger.warn('Attention !');
      expect(console.warn).toHaveBeenCalled();
    });

    test('logger.debug devrait logger en mode debug', () => {
      logger.debug('Debug info');
      // Le comportement dépend de IS_DEV dans le logger
      // On vérifie juste que ça ne plante pas
      expect(console.debug).toHaveBeenCalled();
    });
  });

  describe('Méthodes de groupement', () => {
    test('logger.group et groupEnd devraient fonctionner ensemble', () => {
      logger.group('Mon groupe');
      logger.log('Élément 1');
      logger.log('Élément 2');
      logger.groupEnd();

      expect(console.group).toHaveBeenCalledWith('[Snake Ultra] Mon groupe');
      expect(console.groupEnd).toHaveBeenCalled();
    });

    test('logger.table devrait afficher un tableau', () => {
      const data = [
        { id: 1, nom: 'Test' },
        { id: 2, nom: 'Test2' }
      ];
      logger.table(data);
      expect(console.table).toHaveBeenCalledWith(data);
    });
  });

  describe('Méthodes de timing', () => {
    test('logger.time et timeEnd devraient fonctionner ensemble', () => {
      logger.time('operation');
      // ... opération ...
      logger.timeEnd('operation');

      expect(console.time).toHaveBeenCalledWith('[Snake Ultra] operation');
      expect(console.timeEnd).toHaveBeenCalledWith('[Snake Ultra] operation');
    });
  });

  describe('Sécurité et robustesse', () => {
    test('ne devrait pas planter avec des arguments undefined', () => {
      expect(() => logger.log(undefined)).not.toThrow();
      expect(() => logger.warn(undefined)).not.toThrow();
      expect(() => logger.error(undefined)).not.toThrow();
    });

    test('ne devrait pas planter avec des objets circulaires', () => {
      const obj = { a: 1 };
      obj.self = obj; // Référence circulaire

      // Ne devrait pas planter
      expect(() => logger.log('Objet:', obj)).not.toThrow();
    });

    test('devrait gérer des tableaux vides', () => {
      expect(() => logger.log([])).not.toThrow();
      expect(() => logger.table([])).not.toThrow();
    });
  });
});
