/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const swaggerAutogen = require('swagger-autogen')({ openapi: '3.0.0' });

const projectRoot = path.join(__dirname, '..');
const outputFile = path.join(projectRoot, 'build', 'openapi.json');
const endpointsFiles = [
  path.join(projectRoot, 'src', 'server.js'),
  path.join(projectRoot, 'src', 'routes', 'hello.route.js'),
  path.join(projectRoot, 'src', 'routes', 'riot.route.js'),
];

const doc = {
  info: {
    title: 'FIT.LOL LolAPIService',
    version: '1.0.2',
    description: 'Riot API proxy with OIDC',
  },
  servers: [{ url: `http://localhost:${process.env.PORT || 3001}` }],
  components: {
    securitySchemes: {
      BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  security: [{ BearerAuth: [] }],
  tags: [
    { name: 'Health', description: 'Health check' },
    { name: 'Riot', description: 'Riot API endpoints' },
  ],
};

fs.mkdirSync(path.dirname(outputFile), { recursive: true });

swaggerAutogen(outputFile, endpointsFiles, doc)
  .then(({ success }) => {
    console.log(`✅ swagger-autogen done (success: ${success}) -> ${outputFile}`);
  })
  .catch((err) => {
    console.error('❌ swagger-autogen failed:', err);
    process.exit(1);
  });
