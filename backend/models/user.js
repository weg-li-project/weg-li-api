const uuid = require("uuid");

function User(id, access_token) {
    this.id = id;
    this.access_token = access_token
}

User.generate = function () {
    let id = uuid.v4();
    let access_token = "TBD";
    return new User(id, access_token);
}

User.prototype.validate = function () {
    // TODO: Add value validation
    return true;
}

module.exports = User