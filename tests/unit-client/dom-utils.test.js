// ============================================
// TESTS UNITAIRES - DOM Utils
// Tests pour les utilitaires DOM
// ============================================

import {
  getElement,
  getElements,
  addClass,
  removeClass,
  toggleClass,
  hasClass,
  show,
  hide,
  createElement
} from '../../www/utils/dom-utils.js';

describe('DOM Utils - Utilitaires DOM', () => {

  beforeEach(() => {
    // Nettoyer le DOM
    document.body.innerHTML = '';
  });

  describe('getElement', () => {
    test('devrait récupérer un élément par ID', () => {
      document.body.innerHTML = '<div id="test-element">Contenu</div>';
      const element = getElement('test-element');
      expect(element).not.toBeNull();
      expect(element.id).toBe('test-element');
    });

    test('devrait retourner null si élément non trouvé', () => {
      const element = getElement('inexistant', false);
      expect(element).toBeNull();
    });

    test('devrait logger un warning si élément non trouvé (par défaut)', () => {
      const consoleWarn = jest.spyOn(console, 'warn');
      getElement('inexistant');
      expect(consoleWarn).toHaveBeenCalled();
    });

    test('ne devrait pas logger de warning si warnIfNotFound=false', () => {
      const consoleWarn = jest.spyOn(console, 'warn');
      getElement('inexistant', false);
      expect(consoleWarn).not.toHaveBeenCalled();
    });
  });

  describe('getElements', () => {
    test('devrait récupérer plusieurs éléments par sélecteur', () => {
      document.body.innerHTML = `
        <div class="test">Element 1</div>
        <div class="test">Element 2</div>
        <div class="test">Element 3</div>
      `;
      const elements = getElements('.test');
      expect(elements).toHaveLength(3);
      expect(Array.isArray(elements)).toBe(true);
    });

    test('devrait retourner un tableau vide si aucun élément trouvé', () => {
      const elements = getElements('.inexistant');
      expect(elements).toHaveLength(0);
      expect(Array.isArray(elements)).toBe(true);
    });
  });

  describe('addClass', () => {
    test('devrait ajouter une classe à un élément', () => {
      document.body.innerHTML = '<div id="test"></div>';
      const element = document.getElementById('test');

      addClass('test', 'ma-classe');
      expect(element.classList.contains('ma-classe')).toBe(true);
    });

    test('devrait accepter un HTMLElement directement', () => {
      document.body.innerHTML = '<div id="test"></div>';
      const element = document.getElementById('test');

      addClass(element, 'ma-classe');
      expect(element.classList.contains('ma-classe')).toBe(true);
    });

    test('ne devrait pas planter si élément inexistant', () => {
      expect(() => addClass('inexistant', 'classe')).not.toThrow();
    });
  });

  describe('removeClass', () => {
    test('devrait retirer une classe d\'un élément', () => {
      document.body.innerHTML = '<div id="test" class="ma-classe"></div>';
      const element = document.getElementById('test');

      removeClass('test', 'ma-classe');
      expect(element.classList.contains('ma-classe')).toBe(false);
    });

    test('devrait accepter un HTMLElement directement', () => {
      document.body.innerHTML = '<div id="test" class="ma-classe"></div>';
      const element = document.getElementById('test');

      removeClass(element, 'ma-classe');
      expect(element.classList.contains('ma-classe')).toBe(false);
    });

    test('ne devrait pas planter si élément inexistant', () => {
      expect(() => removeClass('inexistant', 'classe')).not.toThrow();
    });
  });

  describe('toggleClass', () => {
    test('devrait toggler une classe sur un élément', () => {
      document.body.innerHTML = '<div id="test"></div>';
      const element = document.getElementById('test');

      const added = toggleClass('test', 'active');
      expect(added).toBe(true);
      expect(element.classList.contains('active')).toBe(true);

      const removed = toggleClass('test', 'active');
      expect(removed).toBe(false);
      expect(element.classList.contains('active')).toBe(false);
    });

    test('devrait accepter un HTMLElement directement', () => {
      document.body.innerHTML = '<div id="test"></div>';
      const element = document.getElementById('test');

      toggleClass(element, 'active');
      expect(element.classList.contains('active')).toBe(true);
    });

    test('devrait retourner false si élément inexistant', () => {
      const result = toggleClass('inexistant', 'classe');
      expect(result).toBe(false);
    });
  });

  describe('hasClass', () => {
    test('devrait vérifier si un élément a une classe', () => {
      document.body.innerHTML = '<div id="test" class="ma-classe"></div>';

      expect(hasClass('test', 'ma-classe')).toBe(true);
      expect(hasClass('test', 'autre-classe')).toBe(false);
    });

    test('devrait accepter un HTMLElement directement', () => {
      document.body.innerHTML = '<div id="test" class="ma-classe"></div>';
      const element = document.getElementById('test');

      expect(hasClass(element, 'ma-classe')).toBe(true);
    });

    test('devrait retourner false si élément inexistant', () => {
      expect(hasClass('inexistant', 'classe')).toBe(false);
    });
  });

  describe('show', () => {
    test('devrait afficher un élément caché', () => {
      document.body.innerHTML = '<div id="test" class="hidden" style="display: none;"></div>';
      const element = document.getElementById('test');

      show('test');
      expect(element.style.display).toBe('');
      expect(element.classList.contains('hidden')).toBe(false);
    });

    test('devrait accepter un HTMLElement directement', () => {
      document.body.innerHTML = '<div id="test" class="hidden"></div>';
      const element = document.getElementById('test');

      show(element);
      expect(element.classList.contains('hidden')).toBe(false);
    });

    test('ne devrait pas planter si élément inexistant', () => {
      expect(() => show('inexistant')).not.toThrow();
    });
  });

  describe('hide', () => {
    test('devrait cacher un élément visible', () => {
      document.body.innerHTML = '<div id="test"></div>';
      const element = document.getElementById('test');

      hide('test');
      expect(element.classList.contains('hidden')).toBe(true);
    });

    test('devrait accepter un HTMLElement directement', () => {
      document.body.innerHTML = '<div id="test"></div>';
      const element = document.getElementById('test');

      hide(element);
      expect(element.classList.contains('hidden')).toBe(true);
    });

    test('ne devrait pas planter si élément inexistant', () => {
      expect(() => hide('inexistant')).not.toThrow();
    });
  });

  describe('createElement', () => {
    test('devrait créer un élément avec tag', () => {
      const element = createElement('div');
      expect(element.tagName).toBe('DIV');
    });

    test('devrait créer un élément avec attributs', () => {
      const element = createElement('div', { id: 'test', title: 'Mon titre' });
      expect(element.id).toBe('test');
      expect(element.getAttribute('title')).toBe('Mon titre');
    });

    test('devrait créer un élément avec className', () => {
      const element = createElement('div', { className: 'ma-classe autre-classe' });
      expect(element.className).toBe('ma-classe autre-classe');
    });

    test('devrait créer un élément avec dataset', () => {
      const element = createElement('div', { dataset: { foo: 'bar', test: '123' } });
      expect(element.dataset.foo).toBe('bar');
      expect(element.dataset.test).toBe('123');
    });

    test('devrait créer un élément avec contenu HTML', () => {
      const element = createElement('div', {}, '<span>Contenu</span>');
      expect(element.innerHTML).toBe('<span>Contenu</span>');
      expect(element.children.length).toBe(1);
    });

    test('devrait créer un élément complexe', () => {
      const element = createElement(
        'button',
        {
          id: 'mon-bouton',
          className: 'btn btn-primary',
          dataset: { action: 'submit' },
          type: 'button'
        },
        'Cliquez ici'
      );

      expect(element.tagName).toBe('BUTTON');
      expect(element.id).toBe('mon-bouton');
      expect(element.className).toBe('btn btn-primary');
      expect(element.dataset.action).toBe('submit');
      expect(element.getAttribute('type')).toBe('button');
      expect(element.innerHTML).toBe('Cliquez ici');
    });
  });
});
