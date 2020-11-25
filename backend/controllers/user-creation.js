const User = require("../models/user")
const Authorization = require("../core/authorization")

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

    let access_token = Authorization.generateAccessToken();

    helper.store().then(() => {
        let user = helper.user;

        response.send({
            "user_id": user.id,
            "access_token": access_token
        })
    })
}

function UserCreationHelper() { }

UserCreationHelper.prototype = {
    user: null,
    access_token: null
}

UserCreationHelper.prototype.generate = function () {
    this.user = User.generate();
    this.access_token = Authorization.generateAccessToken();
}

UserCreationHelper.prototype.store = async function () {
    // TODO: Implement user database insert
    await Authorization.storeAuthorization(this.user, this.access_token)
}

module.exports = createUser