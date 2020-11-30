const User = require("../models/user");
const Authorization = require("../core/authorization");
const UserDatabaseHandle = require("../core/database/database-users");

/**
 * Controller function for the user creation endpoint.
 *
 * @param {e.Request} request
 * @param {e.Response} response
 * @author Lukas Trommer
 */
async function createUser(request, response) {
    if (request.method !== "GET") {
        response.status(405).send();
        return;
    }

    let helper = new _UserCreationHelper();
    helper.generate();
    await helper.store();
    response.json({
        "user_id": helper.user.id,
        "access_token": helper.access_token
    })
}

/**
 * Helper class for creating a new user.
 * 
 * @constructor
 * @private
 * @author Lukas Trommer
 */
function _UserCreationHelper() { }

_UserCreationHelper.prototype = {
    user: null,
    access_token: null
}

/**
 * Generates new user data locally.
 *
 * @author Lukas Trommer
 */
_UserCreationHelper.prototype.generate = function () {
    this.user = User.generate();
    this.access_token = Authorization.generateAccessToken();
}

/**
 * Stores locally generated user data to the database.
 *
 * @returns {Promise<void>}
 * @author Lukas Trommer
 */
_UserCreationHelper.prototype.store = async function () {
    let dbHandle = new UserDatabaseHandle();
    let dbTransaction = await dbHandle.database.newTransaction();

    try {
        await dbHandle.insertUser(this.user, dbTransaction);
        await Authorization.storeAuthorization(this.user, this.access_token, dbTransaction);
        dbTransaction.commit();
    } catch (e) {
        dbTransaction.rollback();
        throw e;
    }
}

module.exports = createUser