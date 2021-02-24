/* eslint-disable no-bitwise */
/* eslint-disable no-use-before-define */
/* eslint-disable no-underscore-dangle */
const uuid = require('uuid');
const { StatusCode } = require('status-code-enum');

const wrapper = require('./assets/wrapper');
const { UNKNOWN_IMAGE_TOKEN } = require('../models/error-response');
const Authorization = require('../core/authorization');
const ReportDatabaseHandle = require('../core/database/database-reports');
const User = require('../models/user');
const Report = require('../models/report');
const Location = require('../models/location');
const FileStorage = require('../core/file-storage').shared;

/**
 * Validator function the report creation endpoint.
 *
 * @author Lukas Trommer
 * @param request {e.Request}
 * @param response {e.Response}
 * @param next {*=}
 */
function validator(request, response, next) {
  let valid = true;
  const userId = request.body.user_id;

  if (userId) {
    if (
      !Authorization.validateAuthorizationHeader(request.headers.authorization)
    ) {
      response.status(StatusCode.ClientErrorUnauthorized).send();
      return;
    }

    if (!User.validateID(userId)) {
      valid = false;
    }
  }

  const { report } = request.body;

  if (report) {
    valid &= Number.isInteger(report.time);

    const { location } = report;
    valid
      &= location
      && Location.isLatitude(location.latitude)
      && Location.isLongitude(location.longitude);

    valid &= Number.isInteger(report.violation_type);
    valid &= Number.isInteger(report.severity_type);

    const imageToken = report.image_token;
    valid &= imageToken && uuid.validate(imageToken);
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
 * @author Lukas Trommer
 * @param {e.Request} request - An express request object.
 * @param {e.Response} response - An express response object.
 */
async function controller(request, response) {
  let user = null;
  const userId = request.body.user_id;

  if (userId) {
    const accessToken = Authorization.extractAccessToken(
      request.headers.authorization
    );
    user = new User(userId);

    // Check if request is authorized
    if (!(await Authorization.authorizeUser(user, accessToken))) {
      response.status(StatusCode.ClientErrorForbidden).send();
      return;
    }
  }

  const helper = new _ReportCreationHelper(user);

  const { report } = request.body;
  helper.violationType = report.violation_type;
  helper.time = report.time;
  helper.location = new Location(
    report.location.latitude,
    report.location.longitude
  );
  helper.imageToken = report.image_token;
  helper.severityType = report.severity_type;

  if (!(await helper.resolveImageToken())) {
    response.status(StatusCode.ClientErrorConflict).json(UNKNOWN_IMAGE_TOKEN);
    return;
  }

  await helper.store();
  response.status(200).end();
}

exports.controller = wrapper(controller);

/**
 * Helper class for creating a new violation report.
 *
 * @private
 * @author Lukas Trommer
 */
function _ReportCreationHelper(user) {
  this.user = user;
}

/**
 * @type {{
 *   violationType: number;
 *   location: Location;
 *   time: number;
 *   user: User;
 *   imageToken: string;
 *   severityType: number;
 * }}
 */
_ReportCreationHelper.prototype = {
  user: null,
  violationType: null,
  time: null,
  location: null,
  imageToken: null,
  severityType: null,
};

/**
 * Resolve the provided image token by checking if the corresponding file
 * storage reference contains image files.
 *
 * @author Lukas Trommer
 * @returns {Promise<boolean>} <code>true</code> if associated files could be
 *     found, <code>false</code> otherwise.
 */
_ReportCreationHelper.prototype.resolveImageToken = async function () {
  if (this.imageToken) {
    return (
      Array.from(await FileStorage.getFilesByToken(this.imageToken)).length > 0
    );
  }
  throw new Error('No image token specified');
};

/**
 * Create and store a new report from the provided data.
 *
 * @author Lukas Trommer
 * @returns {Promise<void>}
 */
_ReportCreationHelper.prototype.store = async function () {
  const report = Report.create(
    this.user,
    this.violationType,
    this.time,
    this.location,
    this.imageToken,
    this.severityType
  );
  const dbHandle = new ReportDatabaseHandle();
  await dbHandle.insertReport(report);
};
