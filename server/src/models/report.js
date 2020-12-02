const uuid = require("uuid");
const User = require("./user");
const Location = require("./location");

/**
 * Class representing a report.
 *
 * @param id {String} The report ID.
 * @param user {User} The user who issues the report.
 * @param violationType {Number} The type of the reported violation.
 * @param time {Number} The date and time of the violation as Unix timestamp (in seconds since epoch).
 * @param location {Location} The location (including the latitude and longitude values respectively) of the
 * violation.
 * @param imageToken {String} The image token referring to the provided images of the violation.
 * @constructor
 * @author Lukas Trommer
 */
function Report(id, user, violationType, time, location, imageToken) {
    if (!Report.validateID(id)) {
        throw new Error("Invalid report ID");
    }

    if (isNaN(violationType)) {
        throw new Error("Violation type must be a numeric identifier");
    }

    if (!location) {
        throw new Error("Location not provided");
    }

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

/**
 * Validates a provided report ID.
 *
 * @param id {String} The report ID which should be validated.
 * @returns {boolean} <code>true</code> if the provided ID is valid, <code>false</code> otherwise.
 */
Report.validateID = function (id) {
    return uuid.validate(id);
}

module.exports = Report;