const express = require("express")
const createUser = require("./controllers/user-creation")
const deleteUser = require("./controllers/user-deletion")
const getSignedStorageUrls = require('./controllers/image-upload')
const getImageAnalysisResults = require("./controllers/get-images-analysis-result");
const createDataAnalysis = require("./controllers/create-data-analysis");
const createReport = require("./controllers/report-creation");

const router = express.Router();

if (process.env.NODE_ENV === "production") {
    router.use((req, res, next) => {
        req.secure ? next() : res.redirect('https://' + req.headers.host + req.url)
    })
}
router.use("/users/:user_id", deleteUser)
router.use("/users", createUser)
router.get('/analyze/image/upload', getSignedStorageUrls)
router.get('/analyze/image/:imageToken', getImageAnalysisResults)
router.post('/analyze/data', createDataAnalysis)
router.put('/report', createReport)
router.use(function (req, res) {
    res.status(404).send();
})

exports.api = router;