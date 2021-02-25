const express = require('express');

const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const createUser = require('./controllers/user-creation');
const deleteUser = require('./controllers/user-deletion');
const uploadImage = require('./controllers/image-upload');
const analyzeImage = require('./controllers/image-analysis');
const analyzeData = require('./controllers/data-analysis');
const createReport = require('./controllers/report-creation');
const queryDistrict = require('./controllers/district-query');
const exploreSwagger = require('./controllers/swagger-explorer');
const { Database, DatabaseConfiguration } = require('./core/database/database');

const router = express.Router();

// Restrict CORS to localhost and weg.li
const corsOptions = { origin: ['localhost', /\.weg-li.de$/, /\.weg.li$/] };
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
  uploadImage.validator,
  uploadImage.controller
);
router.get(
  '/analyze/image/:imageToken',
  analyzeImage.validator,
  analyzeImage.controller
);

router.post('/analyze/data', analyzeData.validator, analyzeData.controller);

router.post('/report', createReport.validator, createReport.controller);
router.get(
  '/report/district/:zipcode',
  queryDistrict.validator,
  queryDistrict.controller
);

router.use('/docs', swaggerUi.serve);
router.get('/docs', exploreSwagger.controller);

router.use((req, res) => {
  res.status(404).send();
});

// eslint-disable-next-line no-unused-vars
router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send();
});

exports.api = router;
