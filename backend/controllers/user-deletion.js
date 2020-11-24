const User = require("../models/user");
const Authorization = require("../core/authorization");

/**
 * Controller function for the user deletion endpoint.
 *
 * @param request
 * @param response
 */
function deleteUser(request, response) {
    if (request.method !== "DELETE") {
        response.status(405).send();
        return;
    }

    let access_token = Authorization.extractAccessToken(request.headers.authorization);

    if (!access_token) {
        response.status(401).send();
        return;
    }

    let user = new User(request.params.user_id, access_token);

    // Check for valid user data
    if (!user.validate()) {
        response.status(400).send();
        return;
    }

    // Check if request is authorized
    if (!Authorization.authorizeUser(user)) {
        response.status(401).send();
    }

    let helper = new UserDeletionHelper(user);
    helper.deleteUserReportImages();
    helper.deleteUserReports();
    helper.deleteUser();

    response.send();
}

function UserDeletionHelper(user) {
    this.user = user;
}

UserDeletionHelper.prototype = {
    user: null
}

UserDeletionHelper.prototype.deleteUser = function () {
    if (this.user == null) {

    }
}

UserDeletionHelper.prototype.deleteUserReportImages = function () {
    if (this.user == null) {

    }
}

UserDeletionHelper.prototype.deleteUserReports = function () {
    if (this.user == null) {

    }
}

module.exports = deleteUser;