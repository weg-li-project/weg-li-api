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

    let user_id = request.params.user_id;

    // Check for valid user data
    if (!User.validateID(user_id)) {
        response.status(400).send();
        return;
    }

    let user = new User(user_id);

    // Check if request is authorized
    Authorization.authorizeUser(user, access_token).then(authorized => {
        if (!authorized) {
            response.status(401).send();
            return;
        }

        let helper = new UserDeletionHelper(user);
        helper.deleteUserReportImages();
        helper.deleteUserReports();
        helper.deleteUser();

        response.send();
    })
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