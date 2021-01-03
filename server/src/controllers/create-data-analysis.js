const Location = require('../models/location');
const Recommender = require('../core/recommender');

/**
 * Controller function for the data analysis endpoint.
 *
 * @author Niclas Kühnapfel
 * @param {e.Request} request - An express request object.
 * @param {e.Response} response - An express response object.
 */
async function createDataAnalysis(request, response) {
  let location;
  try {
    location = new Location(
      request.body.location.latitude,
      request.body.location.longitude
    );
  } catch (e) {
    response.json(e.toString());
    return;
  }

  const recommender = new Recommender();
  const recommendations = await recommender.getLocationRecommendations(
    location
  );
  response.json({ violation: recommendations });
}

module.exports = createDataAnalysis;
