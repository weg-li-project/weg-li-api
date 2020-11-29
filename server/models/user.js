const uuid = require("uuid");

/**
 * Class representing a user.
 *
 * @param id The unique user ID.
 * @constructor
 * @author Lukas Trommer
 */
function User(id) {
    if (!User.validateID(id)) {
        throw new Error("Invalid user ID")
    }

    this.id = id;
}

/**
 * Generates a new User object with a random user ID.
 *
 * @returns {User}
 * @author Lukas Trommer
 */
User.generate = function () {
    let id = uuid.v4();
    return new User(id);
}

/**
 * Validates a provided user ID.
 *
 * @param id {String} The user ID which should be validated.
 * @returns {Boolean} <code>true</code> if the provided ID is valid, <code>false</code> otherwise.
 * @author Lukas Trommer
 */
User.validateID = function (id) {
    return uuid.validate(id)
}

module.exports = User