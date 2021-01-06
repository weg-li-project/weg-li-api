const wrapper = require('./assets/wrapper');
const User = require('../models/user');
const Authorization = require('../core/authorization');
const UserDatabaseHandle = require('../core/database/database-users');

/**
 * Controller function for the user creation endpoint.
 *
 * @author Lukas Trommer
 * @param {e.Request} request
 * @param {e.Response} response
 */
async function controller(request, response) {
  // eslint-disable-next-line no-use-before-define
  const helper = new _UserCreationHelper();
  helper.generate();
  await helper.store();

  response.json({
    user_id: helper.user.id,
    access_token: helper.access_token,
  });
}

exports.controller = wrapper(controller);

/**
 * Helper class for creating a new user.
 *
 * @private
 * @author Lukas Trommer
 * @class
 */
// eslint-disable-next-line no-underscore-dangle
function _UserCreationHelper() {}

_UserCreationHelper.prototype = {
  user: null,
  access_token: null,
};

/**
 * Generates new user data locally.
 *
 * @author Lukas Trommer
 */
_UserCreationHelper.prototype.generate = function () {
  this.user = User.generate();
  this.access_token = Authorization.generateAccessToken();
};

/**
 * Stores locally generated user data to the database.
 *
 * @author Lukas Trommer
 * @returns {Promise<void>}
 */
_UserCreationHelper.prototype.store = async function () {
  const dbHandle = new UserDatabaseHandle();
  const dbTransaction = await dbHandle.database.newTransaction();

  try {
    await dbHandle.insertUser(this.user, dbTransaction);
    await Authorization.storeAuthorization(
      this.user,
      this.access_token,
      dbTransaction
    );
    dbTransaction.commit();
  } catch (e) {
    dbTransaction.rollback();
    throw e;
  }
};
