const uuid = require("uuid");
const User = require("./user");
const Location = require("./location");

/**
 * Class representing a report.
 *
 * @param id {String} The report ID.
 * @param user {User} The user who issues the report.
 * @param violationType {Number} The type of the reported violation.
 * @param time {Number} The date and time of the violation as Unix timestamp (in milliseconds since epoch).
 * @param location {Location} The location (including the latitude and longitude values respectively) of the
 * violation.
 * @param imageToken {String} The image token referring to the provided images of the violation.
 * @constructor
 * @author Lukas Trommer
 */
function Report(id, user, violationType, time, location, imageToken) {
    this.id = id;
    this.user = user;
    this.violationType = violationType;
    this.time = time;
    this.location = location;
    this.imageToken = imageToken;
}

/**
 * Creates a new report based on the provided data.
 *
 * @param user
 * @param violationType
 * @param time
 * @param location
 * @param imageToken
 * @returns {Report}
 * @author Lukas Trommer
 */
Report.create = function (user, violationType, time, location, imageToken) {
    let id = uuid.v4();
    return new Report(id, user, violationType, time, location, imageToken);
}

module.exports = Report;