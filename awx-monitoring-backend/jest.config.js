export default {
    testEnvironment: 'node',
    transform: {
      '^.+\\.js$': 'babel-jest' // Usar Babel para transformar archivos JS
    },
    moduleFileExtensions: ['js', 'json', 'mjs'],
    clearMocks: true,
    setupFilesAfterEnv: ['./jest.setup.js'],
  };
  