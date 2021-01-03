const uuid = require('uuid');

/**
 * Class representing a user.
 *
 * @author Lukas Trommer
 * @class
 * @param id {String} The unique user ID.
 */
function User(id) {
  if (!User.validateID(id)) {
    throw new Error(`Invalid user ID ${id}`);
  }

  this.id = id;
}

/**
 * Generates a new User object with a random user ID.
 *
 * @author Lukas Trommer
 * @returns {User}
 */
User.generate = function () {
  const id = uuid.v4();
  return new User(id);
};

/**
 * Validates a provided user ID.
 *
 * @author Lukas Trommer
 * @param id {String} The user ID which should be validated.
 * @returns {Boolean} <code>true</code> if the provided ID is valid,
 *     <code>false</code> otherwise.
 */
User.validateID = function (id) {
  return uuid.validate(id);
};

module.exports = User;
