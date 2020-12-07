'use strict';

const Location = require('../models/location');
const Recommender = require('../core/recommender');

/**
 * Controller function for the data analysis endpoint.
 *
 * @param {e.Request} request - An express request object.
 * @param {e.Response} response - An express response object.
 * @author Niclas Kühnapfel
 */
async function createDataAnalysis(request, response) {
    let location = new Location(request.body.location.latitude, request.body.location.longitude);

    if (!location) {
        throw new Error("Location is invalid");
    }

    let reports = await Recommender.queryReports(location);
    let recommendations = await Recommender.getLocationRecommendations(reports);

    response.json({'violation': recommendations});
}

module.exports = createDataAnalysis;
