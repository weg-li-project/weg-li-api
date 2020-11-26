const express = require("express")
const createUser = require("./controllers/user-creation")
const deleteUser = require("./controllers/user-deletion")
const getSignedStorageUrls = require('./controllers/image-upload')

const router = express.Router();
router.use("/users/:user_id", deleteUser)
router.use("/users", createUser)
router.get('/analyze/image/upload', getSignedStorageUrls)
router.use(function (req, res) {
    res.status(404).send();
})

exports.api = router;
