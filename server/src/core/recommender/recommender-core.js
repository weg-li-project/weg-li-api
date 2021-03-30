const ReportDatabaseHandle = require('../database/database-reports');
const RecommendationList = require('./recommender-list');
const Utils = require('./recommender-utils');
const recConst = require('./recommender-const');

/**
 * Responsible for creating recommendations based on user history and location.
 *
 * @author Niclas Kühnapfel
 */
class RecommenderCore {
  constructor() {
    this.dbHandle = new ReportDatabaseHandle();
  }

  /**
   * Computes ordered list of violation types, their score and the most common
   * severity for this type. Most probable type on top.
   *
   * @author Niclas Kühnapfel
   * @param location - The location of the new report.
   * @param userId - The user identifier for the new report.
   * @param time - The time of the new report.
   * @returns {Array} - Ordered list of violation types.
   */
  async getRecommendations(location, userId = null, time = null) {
    const recs = new RecommendationList();

    const severity = await this.dbHandle.getMostCommonSeverities();
    recs.appendSeverity(severity);

    const commonScores = await this.computeMostCommonScores();
    recs.addScores(commonScores, recConst.COMMON_MULTIPLIER);

    const locationScores = await this.computeLocationScores(location);
    recs.addScores(locationScores, recConst.LOCATION_MULTIPLIER);

    if (userId && time) {
      const userScores = await this.computeUserHistoryScores(userId, time);
      recs.addScores(userScores, recConst.USER_MULTIPLIER);
    }

    return recs.sort();
  }

  /**
   * Computes normalized scores based on most common violation types.
   *
   * @author Niclas Kühnapfel
   * @returns {Array} - List of violation types and their scores.
   */
  async computeMostCommonScores() {
    const mostCommon = await this.dbHandle.getMostCommonViolations();
    const len = mostCommon.length;

    const scores = [];
    mostCommon.forEach((item, index) => {
      scores[item.violation_type] = (len - index) / ((len * (len + 1)) / 2);
    });

    return scores;
  }

  /**
   * Computes scores based on number and time of reports in user's history.
   *
   * @author Niclas Kühnapfel
   * @param userId - The user's identifier.
   * @param time - The datetime string of new report.
   * @returns {Promise<{}>} - List of violation types and their score.
   */
  async computeUserHistoryScores(userId, time) {
    const userHistory = await this.dbHandle.getAllUserReports(userId);
    const newSeconds = Utils.getSecsMidnight(new Date(time));

    let sum = 0;
    // eslint-disable-next-line func-names
    userHistory.forEach(function (report, index) {
      const oldSeconds = Utils.getSecsMidnight(new Date(report.time));
      const timeDiff = Math.abs(newSeconds - oldSeconds);
      const weight = Utils.inverseMultiQuadratic(recConst.USER_E, timeDiff);
      this[index].weight = weight;
      sum += weight;
    }, userHistory);

    return this.constructor.sumUpWeights(userHistory, sum);
  }

  /**
   * Computes scores based on location of the new report.
   *
   * @author Niclas Kühnapfel
   * @param location - The location of the new report.
   * @returns {Promise<{}>} - List of violation types and their score.
   */
  async computeLocationScores(location) {
    const count = await this.dbHandle.countNearReports(
      location,
      recConst.NEAR_RADIUS
    );
    const reports = await this.dbHandle.getKNN(
      location,
      count + recConst.REPORTS_AROUND,
      recConst.WIDE_RADIUS
    );

    let sum = 0;
    // eslint-disable-next-line func-names
    reports.forEach(function (report, index) {
      const weight = Utils.inverseQuadratic(recConst.LOC_E, report.distance);
      this[index].weight = weight;
      sum += weight;
    }, reports);

    return this.constructor.sumUpWeights(reports, sum);
  }

  /**
   * Computes list containing violation types and their normalized score based
   * on the weights of each report.
   *
   * @author Niclas Kühnapfel
   * @param reports - List of reports and corresponding weights.
   * @param sum - Sum over all weights.
   * @returns {Array} - List of violation types and their score.
   */
  static sumUpWeights(reports, sum) {
    const out = [];
    reports.forEach((report) => {
      if (out[report.violation_type] === undefined) {
        out[report.violation_type] = report.weight / sum;
      } else {
        out[report.violation_type] += report.weight / sum;
      }
    });
    return out;
  }
}

module.exports = RecommenderCore;
