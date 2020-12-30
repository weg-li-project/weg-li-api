const uuid = require("uuid");
const { StatusCode } = require("status-code-enum")

const wrapper = require("./assets/wrapper");
const errors = require("./assets/errors")
const Authorization = require("../core/authorization");
const ReportDatabaseHandle = require("../core/database/database-reports");
const User = require("../models/user");
const Report = require("../models/report");
const Location = require("../models/location");
const FileStorage = require("../core/file-storage");

/**
 * Validator function the report creation endpoint.
 *
 * @param request {e.Request}
 * @param response {e.Response}
 * @param next
 * @author Lukas Trommer
 */
function validator(request, response, next) {
    let valid = true;
    let userId = request.body.user_id;

    if (userId) {
        if (!Authorization.validateAuthorizationHeader(request.headers.authorization)) {
            response.status(StatusCode.ClientErrorUnauthorized).send();
            return;
        }

        if (!User.validateID(userId)) {
            valid = false;
        }
    }

    let report = request.body.report;

    if (report) {
        valid &= Number.isInteger(report.time);

        let location = report.location;
        valid &= location && Location.isLatitude(location.latitude) && Location.isLongitude(location.longitude);

        valid &= Number.isInteger(report.violation_type);

        let imageToken = report.image_token;
        valid &= imageToken && uuid.validate(imageToken)
    } else {
        valid = false;
    }

    if (!valid) {
        response.status(StatusCode.ClientErrorBadRequest).send();
        return;
    }

    next();
}

exports.validator = wrapper(validator);

/**
 * Controller function for the report creation endpoint.
 *
 * @param {e.Request} request - An express request object.
 * @param {e.Response} response - An express response object.
 * @author Lukas Trommer
 */
async function controller(request, response) {
    let user = null;
    let userId = request.body.user_id;

    if (userId) {
        let access_token = Authorization.extractAccessToken(request.headers.authorization);
        user = new User(userId);

        // Check if request is authorized
        if (!(await Authorization.authorizeUser(user, access_token))) {
            response.status(StatusCode.ClientErrorForbidden).send();
            return;
        }
    }

    let helper = new _ReportCreationHelper(user);

    let report = request.body.report;
    helper.violationType = report.violation_type;
    helper.time = report.time;
    helper.location = new Location(report.location.latitude, report.location.longitude);
    helper.imageToken = report.image_token;

    if (!(await helper.resolveImageToken())) {
        response.status(StatusCode.ClientErrorConflict).json(errors.UNKNOWN_IMAGE_TOKEN);
        return;
    }

    await helper.store();
    response.status(200).send();
}

exports.controller = wrapper(controller);

/**
 * Helper class for creating a new violation report.
 *
 * @private
 * @author Lukas Trommer
 */
function _ReportCreationHelper() {
    this.report = null;
}

_ReportCreationHelper.prototype = {
    user: null,
    violationType: null,
    time: null,
    location: null,
    imageToken: null
}

/**
 * Resolve the provided image token by checking if the corresponding file storage reference contains image files.
 *
 * @returns {Promise<boolean>} <code>true</code> if associated files could be found, <code>false</code> otherwise.
 * @author Lukas Trommer
 */
_ReportCreationHelper.prototype.resolveImageToken = async function () {
    if (this.imageToken) {
        return Array.from(await FileStorage.getFilesByToken(this.imageToken)).length > 0;
    } else {
        throw new Error("No image token specified");
    }
}

/**
 * Create and store a new report from the provided data.
 *
 * @returns {Promise<void>}
 * @author Lukas Trommer
 */
_ReportCreationHelper.prototype.store = async function () {
    let report = Report.create(this.user, this.violationType, this.time, this.location, this.imageToken);
    let dbHandle = new ReportDatabaseHandle();
    await dbHandle.insertReport(report);
}