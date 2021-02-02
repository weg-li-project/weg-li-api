/**
 * Class representing a geolocation.
 *
 * @author Lukas Trommer
 * @class
 * @param latitude The latitude value of that location.
 * @param longitude The longitude value of that location.
 */
function Location(latitude, longitude) {
  if (!Location.isLatitude(latitude) || !Location.isLongitude(longitude)) {
    throw new Error('Invalid coordinate data');
  }

  this.latitude = latitude;
  this.longitude = longitude;
}

/**
 * Checks a number if it is a valid latitude value.
 *
 * @param latitude {Number} The latitude value to check.
 * @returns {boolean} <code>true</code> if the value represents a valid
 *     latitude, <code>false</code> otherwise.
 */
Location.isLatitude = function (latitude) {
  // eslint-disable-next-line no-restricted-globals
  return !isNaN(latitude) && latitude >= -90 && latitude <= 90;
};

/**
 * Checks a number if it is a valid longitude value.
 *
 * @param longitude {Number} The longitude value to check.
 * @returns {boolean} <code>true</code> if the value represents a valid
 *     longitude, <code>false</code> otherwise.
 */
Location.isLongitude = function (longitude) {
  // eslint-disable-next-line no-restricted-globals
  return !isNaN(longitude) && longitude >= -180 && longitude <= 180;
};

module.exports = Location;
