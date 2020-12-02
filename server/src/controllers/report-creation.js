const uuid = require("uuid");
const { errors } = require("../core/error-response")
const Authorization = require("../core/authorization");
const ReportDatabaseHandle = require("../core/database/database-reports");
const User = require("../models/user");
const Report = require("../models/report");
const Location = require("../models/location");

/**
 * Controller function for the report creation endpoint.
 *
 * @param {e.Request} request - An express request object.
 * @param {e.Response} response - An express response object.
 */
async function createReport(request, response) {
    if (request.method !== "POST") {
        response.status(405).send();
        return;
    }

    let user = null;
    let userId = request.body.user_id;

    if (userId) {
        let access_token = Authorization.extractAccessToken(request.headers.authorization);

        if (!access_token) {
            response.status(401).send();
            return;
        }

        // Check for valid user data
        if (!User.validateID(userId)) {
            response.status(400).send();
            return;
        }

        user = new User(userId);

        // Check if request is authorized
        if (!(await Authorization.authorizeUser(user, access_token))) {
            response.status(401).send();
            return;
        }
    }

    let helper = new _ReportCreationHelper(user);
    let valid = true;
    let report = request.body.report;

    if (report) {
        valid &= helper.setTime(report.time);
        valid &= helper.setLocation(report.location);
        valid &= helper.setViolationType(report.violation_type);
        valid &= helper.setImageToken(report.image_token);
    } else {
        valid = false;
    }

    if (!valid) {
        response.status(400).send();
        return;
    }

    if (!helper.resolveImageToken()) {
        response.status(409).json(errors.UNKNOWN_IMAGE_TOKEN);
        return;
    }

    await helper.store();
    response.status(200).send();
}

/**
 * Helper class for creating a new violation report.
 *
 * @param user {User} The user who issues the report.
 * @private
 * @author Lukas Trommer
 */
function _ReportCreationHelper(user) {
    this.user = user;
}

_ReportCreationHelper.prototype = {
    user: null,
    time: null,
    violationType: null,
    location: null,
    imageToken: null,
}

/**
 * Validates and sets the time of the violation.
 *
 * @param time {Number} The date and time of the violation as Unix timestamp (in seconds since epoch).
 * @returns {boolean} <code>true</code> if the time is valid and was set, <code>false</code> otherwise.
 * @author Lukas Trommer
 */
_ReportCreationHelper.prototype.setTime = function (time) {
    if (Number.isInteger(time)) {
        this.time = time;
        return true;
    } else {
        return false;
    }
}

/**
 * Validates and sets the location of the violation.
 *
 * @param location {Object} The location of the violation, containing latitude and longitude values.
 * @returns {boolean} <code>true</code> if the location is valid and was set, <code>false</code> otherwise.
 * @author Lukas Trommer
 */
_ReportCreationHelper.prototype.setLocation = function (location) {
    if (location && Location.isLatitude(location.latitude) && Location.isLongitude(location.longitude)) {
        this.location = new Location(location.latitude, location.longitude);
        return true;
    }

    return false;
}

/**
 * Validates and sets the type of the violation.
 *
 * @param violationType {Number} The type code of the violation.
 * @returns {boolean} <code>true</code> if the violation type is valid and was set, <code>false</code> otherwise.
 * @author Lukas Trommer
 */
_ReportCreationHelper.prototype.setViolationType = function (violationType) {
    if (Number.isInteger(violationType)) {
        this.violationType = violationType;
        return true;
    } else {
        return false;
    }
}

/**
 * Validates and sets the image token referring to the provided images of the violation.
 * @param imageToken {String} The image token.
 * @returns {boolean} <code>true</code> if the image token is valid and was set, <code>false</code> otherwise.
 * @author Lukas Trommer
 */
_ReportCreationHelper.prototype.setImageToken = function (imageToken) {
    if (imageToken && uuid.validate(imageToken)) {
        this.imageToken = imageToken;
        return true;
    } else {
        return false;
    }
}

_ReportCreationHelper.prototype.resolveImageToken = function () {
    if (this.imageToken) {
        // TODO: Resolve image token in cloud storage?
        return true;
    } else {
        return false;
    }
}

_ReportCreationHelper.prototype.store = async function () {
    let report = Report.create(this.user, this.violationType, this.time, this.location, this.imageToken);
    let dbHandle = new ReportDatabaseHandle();
    await dbHandle.insertReport(report);
}

module.exports = createReport