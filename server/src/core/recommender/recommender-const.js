module.exports = {
  NEAR_RADIUS: 50, // max radius for number of reports to add to k
  WIDE_RADIUS: 2000, // max. radius for k nearest neighbor search
  REPORTS_AROUND: 200, // number of reports to add to k

  USER_MULTIPLIER: 0.44, // multiplier for user history based recommender
  LOCATION_MULTIPLIER: 1.56, // multiplier for location based recommender
  COMMON_MULTIPLIER: 0.01, // multiplier for most common recommender

  LOC_E: 0.1, // shape parameter for location based recommender
  USER_E: 0.008, // shape parameter for user history based recommender
};
