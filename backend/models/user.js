const uuid = require("uuid");

function User(id) {
    if (!User.validateID(id)) {
        throw new Error("Invalid user ID")
    }

    this.id = id;
}

User.generate = function () {
    let id = uuid.v4();
    return new User(id);
}

User.validateID = function (id) {
    return uuid.validate(id)
}

module.exports = User