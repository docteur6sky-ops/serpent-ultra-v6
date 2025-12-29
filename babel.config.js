// Configuration Babel pour Jest
// Transforme les imports ES6 en CommonJS pour les tests

module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        node: 'current'
      }
    }]
  ]
};
