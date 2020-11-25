const express = require("express")
const createUser = require("./controllers/user-creation")
const deleteUser = require("./controllers/user-deletion")

const application = express();
application.use("/users/:user_id", deleteUser)
application.use("/users", createUser)
application.use(function (req, res) {
    res.status(404).send();
})

exports.userStub = application;