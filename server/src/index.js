const express = require("express")
const createUser = require("./controllers/user-creation")
const deleteUser = require("./controllers/user-deletion")
const getSignedStorageUrls = require("./controllers/image-upload")
const getImageAnalysisResults = require("./controllers/get-images-analysis-result")
const createDataAnalysis = require("./controllers/create-data-analysis")
const createReport = require("./controllers/report-creation")

const { query, param } = require("express-validator")
const { validate } = require("./core/validate")

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
router.use("/users/:user_id", deleteUser)
router.use("/users", createUser)
router.get(
  "/analyze/image/upload",
  [query("quantity").exists().isInt({ min: 1, max: 5 })],
  validate,
  getSignedStorageUrls
)
router.get(
  "/analyze/image/:imageToken",
  [param("imageToken").exists().isUUID("4")],
  validate,
  getImageAnalysisResults
)
router.post("/analyze/data", createDataAnalysis)
router.post("/report", createReport)

router.use(function (req, res) {
  res.status(404).send()
})

exports.api = router
