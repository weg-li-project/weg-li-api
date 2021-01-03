const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const yaml = require('js-yaml');
const createUser = require('./controllers/user-creation');
const deleteUser = require('./controllers/user-deletion');
const imageUpload = require('./controllers/image-upload');
const imagesAnalysisResult = require('./controllers/get-images-analysis-result');
const createDataAnalysis = require('./controllers/create-data-analysis');
const createReport = require('./controllers/report-creation');
const { Database, DatabaseConfiguration } = require('./core/database/database');

const router = express.Router();

// Restrict CORS to localhost and weg-li.de
const corsOptions = { origin: ['localhost', /\.weg-li.de$/] };
router.use(cors(corsOptions));

// Only redirect to secure http route when in production environment
if (process.env.NODE_ENV === 'production') {
  router.use((req, res, next) => {
    if (req.secure) {
      next();
    } else {
      res.redirect(`https://${req.headers.host}${req.url}`);
    }
  });
}

// Initialize database connection
const databaseConfig = DatabaseConfiguration.fromEnvironment();

if (!databaseConfig) {
  console.error('No database configuration was provided!');
} else {
  const database = new Database(databaseConfig);
  database.connect();
  Database.shared = database;
}

router.use(express.json());

// Define endpoints
router.delete('/user/:user_id', deleteUser.validator, deleteUser.controller);
router.post('/user', createUser.controller);
router.get(
  '/analyze/image/upload',
  imageUpload.validator,
  imageUpload.controller
);
router.get(
  '/analyze/image/:imageToken',
  imagesAnalysisResult.validator,
  imagesAnalysisResult.controller
);

router.post('/analyze/data', createDataAnalysis);
router.post('/report', createReport.validator, createReport.controller);

// Serving OpenAPI specification
const yamlSpec = './static/openapi-specification.yaml';
const swaggerDocument = yaml.load(
  fs.readFileSync(yamlSpec, { encoding: 'utf-8' })
);
const options = { explorer: true };
router.use('/docs', swaggerUi.serve);
router.get('/docs', swaggerUi.setup(swaggerDocument, options));

router.use((req, res) => {
  res.status(404).send();
});

// eslint-disable-next-line no-unused-vars
router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send();
});

exports.api = router;
