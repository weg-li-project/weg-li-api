const uuid = require("uuid");
const User = require("src/models/user")

/**
 * Class representing a report.
 *
 * @param id {String} The report ID.
 * @param user {User} The user who issues the report.
 * @param violation_type {Number} The type of the reported violation.
 * @param time {Number} The date and time of the violation as Unix timestamp (in milliseconds since epoch).
 * @param location {Coordinates} The coordinates (including the latitude and longitude values respectively) of the
 * violation.
 * @param image_token {String} The image token referring to the provided images for this report.
 * @constructor
 * @author Lukas Trommer
 */
function Report(id, user, violation_type, time, location, image_token) {
    this.id = id;
    this.user = user;
    this.violation_type = violation_type;
    this.time = time;
    this.location = location;
    this.image_token = image_token;
}

/**
 * Creates a new report based on the provided data.
 *
 * @param user
 * @param violation_type
 * @param time
 * @param location
 * @param image_token
 * @returns {Report}
 * @author Lukas Trommer
 */
Report.create = function (user, violation_type, time, location, image_token) {
    let id = uuid.v4();
    return new Report(id, user, violation_type, time, location, image_token);
}

module.exports = Report;