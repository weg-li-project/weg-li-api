const { StatusCode } = require("status-code-enum")

const wrapper = require("./assets/wrapper");
const User = require("../models/user");
const Authorization = require("../core/authorization");
const UserDatabaseHandle = require("../core/database/database-users");
const ReportDatabaseHandle = require("../core/database/database-reports");
const FileStorage = require("../core/file-storage");

const REQUEST_PARAM_USER_ID = "user_id";

/**
 * Validator function the user deletion endpoint.
 *
 * @param request {e.Request}
 * @param response {e.Response}
 * @param next
 * @author Lukas Trommer
 */
function validator(request, response, next) {
    // Check if access token authorization is present
    if (!Authorization.validateAuthorizationHeader(request.headers.authorization)) {
        response.status(StatusCode.ClientErrorUnauthorized).send();
        return;
    }

    let userID = request.params[REQUEST_PARAM_USER_ID];

    // Check for valid user data
    if (!User.validateID(userID)) {
        response.status(StatusCode.ClientErrorBadRequest).send();
    }

    next();
}

exports.validator = wrapper(validator);

/**
 * Controller function for the user deletion endpoint.
 *
 * @param request {e.Request}
 * @param response {e.Response}
 * @author Lukas Trommer
 */
async function controller(request, response) {
    let access_token = Authorization.extractAccessToken(request.headers.authorization);
    let userID = request.params[REQUEST_PARAM_USER_ID];
    let user = new User(userID);

    // Check if request is authorized
    if (!(await Authorization.authorizeUser(user, access_token))) {
        response.status(StatusCode.ClientErrorUnauthorized).send();
        return;
    }

    await _deleteUser(user);
    response.send();
}

exports.controller = wrapper(controller);

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
        await FileStorage.deleteImagesByTokens(reportImageTokens)

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