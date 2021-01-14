const { StatusCode } = require('status-code-enum');

const Location = require('../models/location');
const Recommender = require('../core/recommender');
const Authorization = require('../core/authorization');
const User = require('../models/user');
const wrapper = require('./assets/wrapper');

/**
 * Validator function the data analysis endpoint.
 *
 * @author Niclas Kühnapfel
 * @param request {e.Request}
 * @param response {e.Response}
 * @param next
 */
function validator(request, response, next) {
  let valid = true;
  const userId = request.body.user_id;

  if (userId) {
    if (!User.validateID(userId)) {
      valid = false;
    }
  }

  const { location } = request.body;

  if (location) {
    valid = valid
      && location
      && Location.isLatitude(location.latitude)
      && Location.isLongitude(location.longitude);
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
 * Controller function for the data analysis endpoint.
 *
 * @author Niclas Kühnapfel
 * @param {e.Request} request - An express request object.
 * @param {e.Response} response - An express response object.
 */
async function controller(request, response) {
  const location = new Location(
    request.body.location.latitude,
    request.body.location.longitude
  );

  const userId = request.body.user_id;
  const { authorization } = request.headers;

  if (userId) {
    const accessToken = Authorization.extractAccessToken(authorization);
    const user = new User(userId);

    if (!(await Authorization.authorizeUser(user, accessToken))) {
      response.status(StatusCode.ClientErrorUnauthorized).send();
      return;
    }
  }

  const recommender = new Recommender();
  const data = await recommender.getRecommendations(location, userId);
  response.json({ violation: data });
}

exports.controller = wrapper(controller);
