function Location(latitude, longitude) {
  if (!Location.isLatitude(latitude) || !Location.isLongitude(longitude)) {
    throw new Error('Invalid coordinate data');
  }

  this.latitude = latitude;
  this.longitude = longitude;
}

Location.isLatitude = function (latitude) {
  // eslint-disable-next-line no-restricted-globals
  return !isNaN(latitude) && latitude >= -90 && latitude <= 90;
};

Location.isLongitude = function (longitude) {
  // eslint-disable-next-line no-restricted-globals
  return !isNaN(longitude) && longitude >= -180 && longitude <= 180;
};

module.exports = Location;
