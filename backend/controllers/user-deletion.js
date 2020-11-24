let authorizeUser = require("../core/authorization")

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

    let user_id = request.params.user_id

    // Check if request is authorized
    if (!authorizeUser(user_id, request.headers.authorization)) {
        response.status(401).send();
    }

    let helper = new UserDeletionHelper(user_id);
    helper.deleteUserReportImages();
    helper.deleteUserReports();
    helper.deleteUser();

    response.send();
}

function UserDeletionHelper(user_id) {
    this.user_id = user_id;
}

UserDeletionHelper.prototype = {
    user_id: null
}

UserDeletionHelper.prototype.deleteUser = function () {
    if (this.user_id == null) {
        throw new Error("No user ID was set")
    }
}

UserDeletionHelper.prototype.deleteUserReportImages = function () {
    if (this.user_id == null) {
        throw new Error("No user ID was set")
    }
}

UserDeletionHelper.prototype.deleteUserReports = function () {
    if (this.user_id == null) {
        throw new Error("No user ID was set")
    }
}

module.exports = deleteUser;