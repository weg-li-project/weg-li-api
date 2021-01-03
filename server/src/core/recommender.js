const ReportDatabaseHandle = require('./database/database-reports');

const FIRST_STAGE_RADIUS = 50;
const SECOND_STAGE_RADIUS = 55;
const FILL_SECOND_STAGE_RADIUS = 75;
const OUTLIER_THRESHOLD = 2;
const RECOMMENDATION_NUMBER = 3;

/**
 * Responsible for creating location based and user data based recommendations.
 *
 * @author Niclas Kühnapfel
 */
class Recommender {
  constructor() {
    this.dbHandle = new ReportDatabaseHandle();
    this.mostCommon = undefined;
  }

  /**
   * Returns recommendations based on the location of given reports. This is the
   * first stage which uses a smaller radius and complements recommendations
   * with items from the second stage.
   *
   * @author Niclas Kühnapfel
   * @param location The location of a report in creation.
   * @param exclude The ID of point to be excluded from further analysis.
   * @returns {string[]} Most probable violation types.
   */
  async getLocationRecommendations(location, exclude = null) {
    const reports = await this.queryReports(
      location,
      FIRST_STAGE_RADIUS,
      exclude
    );
    if (this.constructor.isOutlier(reports)) {
      return this.secondStage(location, FILL_SECOND_STAGE_RADIUS, exclude);
    }
    const keys = this.constructor.analyzeArea(reports);
    return this.fillSecondStage(keys, location);
  }

  /**
   * Returns recommendations. The second stage is similar to to the first stage
   * but uses a greater radius and complements recommendations with the overall
   * most common ones.
   *
   * @author Niclas Kühnapfel
   * @param location The location of a report in creation.
   * @param radius The radius of the area to consider.
   * @param exclude The ID of point to be excluded from further analysis.
   * @returns {Promise<any>}
   */
  async secondStage(location, radius, exclude) {
    const reports = await this.dbHandle.queryNearReports(
      location,
      radius,
      exclude
    );
    const keys = this.constructor.analyzeArea(reports);
    return this.fillMostCommon(keys);
  }

  /**
   * Returns recommendations based on number and distance of reports that lay in
   * an area around the point of interest.
   *
   * @author Niclas Kühnapfel
   * @param reports The reports around POI.
   * @returns {number[]} The recommendations.
   *     Length can be less than RECOMMENDATION_NUMBER.
   */
  static analyzeArea(reports) {
    // assign distance based weights to each report
    reports.forEach(function (report, index) {
      if (report.distance === 0) {
        this[index].weight = Number.MAX_VALUE;
      } else {
        this[index].weight = 1 / report.distance;
      }
    }, reports);

    // sum up weights to determine most probable violation type
    const violations = {};
    reports.forEach((report) => {
      if (report.violation_type in violations) {
        violations[report.violation_type] += report.weight;
      } else {
        violations[report.violation_type] = report.weight;
      }
    });

    // consider violations with highest weights
    return this.getKeysWithHighestValue(violations, RECOMMENDATION_NUMBER);
  }

  /**
   * Complements array with values from another array.
   *
   * @author Niclas Kühnapfel
   * @param recommendations The array to complement.
   * @param filling The array that provides additional entries.
   * @returns {Promise<Number[]>}
   */
  static fillRecommendations(recommendations, filling) {
    const n = RECOMMENDATION_NUMBER - recommendations.length;
    const diff = filling.filter((e) => !recommendations.includes(e));
    for (let i = 0; i < n; i++) {
      recommendations.push(diff[i]);
    }
    return recommendations;
  }

  /**
   * Complements recommendations with items from the second stage.
   *
   * @author Niclas Kühnapfel
   * @param recommendations The array to complement.
   * @param location The location of a report in creation.
   * @returns {Promise<Number[]>}
   */
  async fillSecondStage(recommendations, location) {
    const secondStage = await this.secondStage(location, SECOND_STAGE_RADIUS);
    return this.fillRecommendations(recommendations, secondStage);
  }

  /**
   * Complements recommendations with most common ones.
   *
   * @author Niclas Kühnapfel
   * @param recommendations The array to complement.
   * @returns {Promise<Number[]>}
   */
  async fillMostCommon(recommendations) {
    if (!this.mostCommon) {
      this.mostCommon = await this.dbHandle.getMostCommonViolations(
        RECOMMENDATION_NUMBER
      );
    }
    return this.fillRecommendations(recommendations, this.mostCommon);
  }

  /**
   * Tries to determine if a point is a outlier or not.
   *
   * @author Niclas Kühnapfel
   * @param reports All reports around the point of interest.
   * @returns {boolean} True if outlier detected.
   */
  static isOutlier(reports) {
    return Object.keys(reports).length < OUTLIER_THRESHOLD;
  }

  /**
   * Retrieves reports for analysis.
   *
   * @author Niclas Kühnapfel
   * @param location The location of interest.
   * @param radius The radius of the area to consider.
   * @param exclude ID of report that should be excluded from query.
   * @returns {Promise<Object[]>} Reports in the range of given location.
   */
  async queryReports(location, radius, exclude = null) {
    return this.dbHandle.queryNearReports(location, radius, exclude);
  }

  /**
   * Returns array keys with highest associated values.
   *
   * @author Niclas Kühnapfel
   * @param arr The array.
   * @param n Number of keys to return.
   * @returns {number[]} The keys.
   */
  static getKeysWithHighestValue(arr, n) {
    const keys = Object.keys(arr);
    keys.sort((a, b) => arr[b] - arr[a]);
    return keys.slice(0, n).map((x) => parseFloat(x));
  }
}

module.exports = Recommender;
