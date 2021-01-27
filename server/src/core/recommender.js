const ReportDatabaseHandle = require('./database/database-reports');

const NEAR_RADIUS = 50;
const WIDE_RADIUS = 2000;
const REPORTS_AROUND = 200;

const USER_MULTIPLIER = 0.44;
const LOCATION_MULTIPLIER = 1.56;
const COMMON_MULTIPLIER = 0.01;

const LOC_E = 0.1;
const USER_E = 0.008;

/** TODO - faster sum - faster getMostCommon() - database trigger */

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
   * @param time
   * @returns {Promise<number[]>} Ordered list array of violation types.
   */
  async getRecommendations(location, userId = null, time = null) {
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

    if (userId && time) {
      const userScores = await this.computeUserHistoryScores(userId, time);
      allScores = this.constructor.addScores(
        allScores,
        userScores,
        USER_MULTIPLIER
      );
    }

    return this.appendSeverity(allScores);
  }

  /**
   * Appends most common severity to recommendations.
   *
   * @param allScores Recommendation scores.
   * @returns {Promise<[]>} Recommendations (violation type, score, severity).
   */
  async appendSeverity(allScores) {
    const sortedKeys = this.constructor.getSortedKeys(allScores);
    const out = [];
    const severity = await this.dbHandle.getMostCommonSeverities();

    sortedKeys.forEach((key) => {
      const o = {};
      o.violation_type = parseInt(key, 10);
      o.score = allScores[key];
      o.severity = severity[key].severity;
      out.push(o);
    });
    return out;
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
   * @param time Datetime string of new report.
   * @returns {Promise<{}>} List of violation types and their score.
   */
  async computeUserHistoryScores(userId, time) {
    const { getSecsMidnight } = this.constructor;
    const { inverseMultiQuadratic } = this.constructor;

    const userHistory = await this.dbHandle.getAllUserReports(userId);
    const newSeconds = getSecsMidnight(new Date(time));

    let sum = 0;
    userHistory.forEach(function (report, index) {
      const oldSeconds = getSecsMidnight(new Date(report.time));
      const timeDiff = Math.abs(newSeconds - oldSeconds);
      const weight = inverseMultiQuadratic(USER_E, timeDiff);
      this[index].weight = weight;
      sum += weight;
    }, userHistory);

    return this.constructor.sumWeights(userHistory, sum);
  }

  /**
   * Computes scores based on location of the new report.
   *
   * @param location The location of the new report.
   * @returns {Promise<{}>} List of violation types and their score.
   */
  async computeLocationScores(location) {
    const { inverseQuadratic } = this.constructor;

    const count = await this.dbHandle.countNearReports(location, NEAR_RADIUS);
    const reports = await this.dbHandle.getKNN(
      location,
      count + REPORTS_AROUND,
      WIDE_RADIUS
    );

    // compute weights
    let sum = 0;
    reports.forEach(function (report, index) {
      const weight = inverseQuadratic(LOC_E, report.distance);
      this[index].weight = weight;
      sum += weight;
    }, reports);

    return this.constructor.sumWeights(reports, sum);
  }

  static sumWeights(reports, sum) {
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
   * @returns {{}} Sorted list of violation types.
   */
  static getSortedKeys(allScores) {
    return Object.keys(allScores).sort((a, b) => allScores[b] - allScores[a]);
  }

  /**
   * Inverse Multi Quadratic RBF. See https://en.wikipedia.org/wiki/Radial_basis_function
   *
   * @param e Shape parameter
   * @param r Distance
   * @returns {number} Phi (or weight)
   */
  static inverseMultiQuadratic(e, r) {
    return 1 / Math.sqrt(1 + e * e * r * r);
  }

  /**
   * Inverse Quadratic RBF. See https://en.wikipedia.org/wiki/Radial_basis_function
   *
   * @param e Shape parameter
   * @param r Distance
   * @returns {number} Phi (or weight)
   */
  static inverseQuadratic(e, r) {
    return 1 / (1 + e * e * r * r);
  }

  /**
   * Computes seconds from midnight of the current day.
   *
   * @param date Datetime object.
   * @returns {number} Seconds from midnight.
   */
  static getSecsMidnight(date) {
    return (
      date.getUTCSeconds()
      + 60 * (date.getUTCMinutes() + 60 * date.getUTCHours())
    );
  }
}

module.exports = Recommender;
