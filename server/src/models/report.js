const uuid = require('uuid');

/**
 * Class representing a report.
 *
 * @author Lukas Trommer
 * @class
 * @param id {String} The report ID.
 * @param user {User} The user who issues the report.
 * @param violationType {Number} The type of the reported violation.
 * @param time {Number} The date and time of the violation as Unix timestamp (in
 *     seconds since epoch).
 * @param location {Location} The location (including the latitude and longitude
 *     values respectively) of the violation.
 * @param imageToken {String} The image token referring to the provided images
 *     of the violation.
 */
function Report(id, user, violationType, time, location, imageToken) {
  if (!Report.validateID(id)) {
    throw new Error('Invalid report ID');
  }

  // eslint-disable-next-line no-restricted-globals
  if (isNaN(violationType)) {
    throw new Error('Violation type must be a numeric identifier');
  }

  if (!location) {
    throw new Error('Location not provided');
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
 * @author Lukas Trommer
 * @param user
 * @param violationType
 * @param time
 * @param location
 * @param imageToken
 * @returns {Report}
 */
Report.create = function (user, violationType, time, location, imageToken) {
  const id = uuid.v4();
  return new Report(id, user, violationType, time, location, imageToken);
};

/**
 * Validates a provided report ID.
 *
 * @param id {String} The report ID which should be validated.
 * @returns {boolean} <code>true</code> if the provided ID is valid,
 *     <code>false</code> otherwise.
 */
Report.validateID = function (id) {
  return uuid.validate(id);
};

module.exports = Report;
