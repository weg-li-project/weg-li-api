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
 * @param severityType The severity of the violation.
 */
function Report(
  id,
  user,
  violationType,
  time,
  location,
  imageToken,
  severityType
) {
  if (!Report.validateID(id)) {
    throw new Error(`Invalid report ID ${id}`);
  }

  // eslint-disable-next-line no-restricted-globals
  if (
    Number.isNaN(Number(violationType))
    || Number.isNaN(Number(time))
    || Number.isNaN(Number(severityType))
    || !location
    || !imageToken
  ) {
    throw new Error();
  }

  this.id = id;
  this.user = user;
  this.violationType = violationType;
  this.time = time;
  this.severityType = severityType;
  this.location = location;
  this.imageToken = imageToken;
}

/**
 * Creates a new report based on the provided data.
 *
 * @author Lukas Trommer
 * @param user {String}
 * @param violationType {Number}
 * @param time {Number}
 * @param location {Location}
 * @param imageToken {String}
 * @param severityType {Number}
 * @returns {Report}
 */
Report.create = function (
  user,
  violationType,
  time,
  location,
  imageToken,
  severityType
) {
  const id = uuid.v4();
  return new Report(
    id,
    user,
    violationType,
    time,
    location,
    imageToken,
    severityType
  );
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
