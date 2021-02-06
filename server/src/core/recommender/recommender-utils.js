/** Utilities for recommender core. */
class RecommenderUtils {
  /**
   * Inverse Multi Quadratic RBF. https://en.wikipedia.org/wiki/Radial_basis_function
   *
   * @param e The shape parameter.
   * @param r The distance.
   * @returns {number} Phi (or weight).
   */
  static inverseMultiQuadratic(e, r) {
    return 1 / Math.sqrt(1 + e * e * r * r);
  }

  /**
   * Inverse Quadratic RBF. https://en.wikipedia.org/wiki/Radial_basis_function
   *
   * @param e The shape parameter.
   * @param r The distance.
   * @returns {number} Phi (or weight).
   */
  static inverseQuadratic(e, r) {
    return 1 / (1 + e * e * r * r);
  }

  /**
   * Computes seconds from midnight of the current day.
   *
   * @param date The datetime object.
   * @returns {number} Seconds from midnight.
   */
  static getSecsMidnight(date) {
    return (
      date.getUTCSeconds()
      + 60 * (date.getUTCMinutes() + 60 * date.getUTCHours())
    );
  }
}

module.exports = RecommenderUtils;
