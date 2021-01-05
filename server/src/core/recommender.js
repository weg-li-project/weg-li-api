const ReportDatabaseHandle = require('./database/database-reports');

const NEAR_RADIUS = 50;
const WIDE_RADIUS = 2000;
const REPORTS_AROUND = 200;

const USER_MULTIPLIER = 0.36;
const LOCATION_MULTIPLIER = 1.64;
const COMMON_MULTIPLIER = 0.01;

/** TODO - faster sum - faster getMostCommon() */

/**
 * Responsible for creating recommendations based on user history and location.
 *
 * @author Niclas Kühnapfel
 */
class Recommender {
  constructor() {
    this.dbHandle = new ReportDatabaseHandle();
  }

  /**
   * Returns ordered list of violation types. Most probable type on top.
   *
   * @param location The location of the new report.
   * @param userId The user identifier for the new report.
   * @returns {Promise<number[]>} Ordered list array of violation types.
   */
  async getRecommendations(location, userId = null) {
    let allScores = {};

    const commonScores = await this.computeMostCommonScores();
    allScores = this.constructor.addScores(
      allScores,
      commonScores,
      COMMON_MULTIPLIER
    );

    const locationScores = await this.computeLocationScores(location);
    allScores = this.constructor.addScores(
      allScores,
      locationScores,
      LOCATION_MULTIPLIER
    );

    if (userId !== null) {
      const userScores = await this.computeUserHistoryScores(userId);
      allScores = this.constructor.addScores(
        allScores,
        userScores,
        USER_MULTIPLIER
      );
    }

    return this.constructor.getSortedKeys(allScores);
  }

  /**
   * Computes scores based on most common violation types.
   *
   * @returns {Promise<{}>} List of violation types and their score
   */
  async computeMostCommonScores() {
    const mostCommon = await this.dbHandle.getMostCommonViolations();
    const len = Object.keys(mostCommon).length;

    const scores = {};
    mostCommon.forEach((type) => {
      scores[type] = (len - mostCommon.indexOf(type)) / ((len * (len + 1)) / 2);
    });

    return scores;
  }

  /**
   * Computes scores based on most common violation types in user's report history.
   *
   * @param userId The user's identifier.
   * @returns {Promise<{}>} List of violation types and their score.
   */
  async computeUserHistoryScores(userId) {
    const userHistory = await this.dbHandle.getUserReports(userId);

    let count = 0;
    userHistory.forEach((report) => {
      count += parseInt(report.count, 10);
    });

    const scores = {};
    userHistory.forEach((report) => {
      scores[report.violation_type] = report.count / count;
    });

    return scores;
  }

  /**
   * Computes scores based on location of the new report.
   *
   * @param location The location of the new report.
   * @returns {Promise<{}>} List of violation types and their score.
   */
  async computeLocationScores(location) {
    const count = await this.dbHandle.countNearReports(location, NEAR_RADIUS);
    const reports = await this.dbHandle.getKNN(
      location,
      count + REPORTS_AROUND,
      WIDE_RADIUS
    );

    // compute weights
    let sum = 0;
    reports.forEach(function (report, index) {
      const e = 0.1;
      const weight = 1 / (1 + e * e * report.distance * report.distance);
      this[index].weight = weight;
      sum += weight;
    }, reports);

    // sum up weights to determine most probable violation type
    const scores = {};
    reports.forEach((report) => {
      if (report.violation_type in scores) {
        scores[report.violation_type] += report.weight / sum;
      } else {
        scores[report.violation_type] = report.weight / sum;
      }
    });

    return scores;
  }

  /**
   * Combines scores and multiplies each score with specified multiplier.
   *
   * @param allScores Previous score list.
   * @param scores New score list.
   * @param multiplier Multiplier for new score list.
   * @returns {any} Combined score list.
   */
  static addScores(allScores, scores, multiplier) {
    const out = allScores;
    Object.entries(scores).forEach((entry) => {
      const [type, score] = entry;
      if (out[type]) {
        out[type] += score * multiplier;
      } else {
        out[type] = score * multiplier;
      }
    });
    return out;
  }

  /**
   * Sorts violation types based on their score.
   *
   * @param allScores Score list to sort.
   * @returns {number[]} Sorted list of violation types.
   */
  static getSortedKeys(allScores) {
    const keys = Object.keys(allScores);
    keys.sort((a, b) => allScores[b] - allScores[a]);
    return keys.map((x) => parseInt(x, 10));
  }
}

module.exports = Recommender;
