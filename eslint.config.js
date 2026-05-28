module.exports = [
  ...require('eslint-config-next').flat(),
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
];
