const User = require("../models/user");
const Authorization = require("../core/authorization");
const UserDatabaseHandle = require("../core/database/database-users");
const ReportDatabaseHandle = require("../core/database/database-reports");

/**
 * Controller function for the user deletion endpoint.
 *
 * @param {e.Request} request
 * @param {e.Response} response
 */
async function deleteUser(request, response) {
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
    if (!(await Authorization.authorizeUser(user, access_token))) {
        response.status(401).send();
        return;
    }

    await _deleteUser(user);
    response.send();
}

/**
 * Helper function for deleting an existing user.
 *
 * @param user The User object for the user which should be deleted.
 * @returns {Promise<void>}
 * @private
 * @author Lukas Trommer
 */
async function _deleteUser(user) {
    let dbHandleUser = new UserDatabaseHandle();
    let dbHandleReport = new ReportDatabaseHandle();
    let dbTransaction = await dbHandleUser.database.newTransaction();

    try {
        // Retrieve images tokens from user's previous reports
        let reportImageTokens = await dbHandleReport.queryUserReportImageTokens(user, dbTransaction);

        // Delete images relating to image tokens ins Google Cloud Storage
        // TODO: Delete relating images from GCloud Storage

        // Delete user's previous reports
        await dbHandleReport.deleteUserReports(user, dbTransaction);

        // Delete users' authorization and actual user entry in database
        await Authorization.deleteAuthorization(user, dbTransaction);
        await dbHandleUser.deleteUser(user, dbTransaction);

        dbTransaction.commit();
    } catch (e) {
        dbTransaction.rollback();
        throw e;
    }
}

module.exports = deleteUser;