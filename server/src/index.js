const express = require("express")
const createUser = require("./controllers/user-creation")
const deleteUser = require("./controllers/user-deletion")
const imageUpload = require("./controllers/image-upload")
const imagesAnalysisResult = require("./controllers/get-images-analysis-result")
const createDataAnalysis = require("./controllers/create-data-analysis")
const createReport = require("./controllers/report-creation")
const swaggerUi = require('swagger-ui-express');
const fs = require("fs");
const yaml = require("js-yaml");
const { Database, DatabaseConfiguration } = require("./core/database/database")

const router = express.Router()

// Only redirect to secure http route when in production environment
if (process.env.NODE_ENV === "production") {
  router.use((req, res, next) => {
    req.secure ? next() : res.redirect("https://" + req.headers.host + req.url)
  })
}

// Initialize database connection
let databaseConfig = DatabaseConfiguration.fromEnvironment()

if (!databaseConfig) {
  console.error("No database configuration was provided!")
} else {
  let database = new Database(databaseConfig)
  database.connect()
  Database.shared = database
}

router.use(express.json())
router.use("/user/:user_id", deleteUser.validator, deleteUser.controller)
router.use("/user", createUser.controller)
router.get("/analyze/image/upload", imageUpload.validator, imageUpload.controller)
router.get("/analyze/image/:imageToken", imagesAnalysisResult.validator, imagesAnalysisResult.controller)

router.post("/analyze/data", createDataAnalysis)
router.post("/report", createReport.validator, createReport.controller);

// Serving OpenAPI specification
const yamlSpec = './static/openapi-specification.yaml';
const swaggerDocument = yaml.load(fs.readFileSync(yamlSpec, {encoding: 'utf-8'}));
const options = {explorer: true};
router.use("/docs", swaggerUi.serve);
router.get("/docs", swaggerUi.setup(swaggerDocument, options));

router.use(function (req, res) {
  res.status(404).send()
})

router.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send();
});

exports.api = router
