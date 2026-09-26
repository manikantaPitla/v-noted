require('tsx/cjs');
const { setupSwagger } = require('./backend/src/swagger');

// The exported setupSwagger doesn't return the spec, let me just read the options
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'v-noted API', version: '2.0.0' },
  },
  apis: ['./backend/src/routes/*.ts'], // relative to CWD
};

const spec = swaggerJsdoc(options);
console.log('Swagger spec paths count:', Object.keys(spec.paths || {}).length);
console.log('Available paths:', Object.keys(spec.paths || {}));
