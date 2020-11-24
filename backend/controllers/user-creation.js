const User = require("../models/user")

/**
 * Controller function for the user creation endpoint.
 *
 * @param request
 * @param response
 */
function createUser(request, response) {
    if (request.method !== "GET") {
        response.status(405).send();
        return;
    }

    let helper = new UserCreationHelper();
    helper.generate();
    helper.store();

    let user = helper.user;

    response.send({
        "user_id": user.id,
        "access_token": user.access_token
    })
}

function UserCreationHelper() {
    this.user = null;
}

UserCreationHelper.prototype.generate = function () {
    this.user = User.generate();
}

UserCreationHelper.prototype.store = function () {
    // TODO: Implement database insert
}

module.exports = createUser