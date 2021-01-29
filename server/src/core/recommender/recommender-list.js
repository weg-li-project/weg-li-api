/**
 * Holds a list of recommendations.
 *
 * @author Niclas Kühnapfel
 */
class RecommenderList {
  constructor() {
    this.lst = [];
  }

  /**
   * Returns index of given violation type in list and creates a new entry if
   * the violation type is not in the list.
   *
   * @author Niclas Kühnapfel
   * @param violationType - Violation type to search for.
   * @returns {number} - Index of violation type in list.
   */
  getIndex(violationType) {
    const index = this.lst.findIndex((x) => x.violation_type === violationType);
    if (index === -1) {
      this.lst.push({ violation_type: violationType, score: 0, severity: 0 });
      return this.lst.length - 1;
    }
    return index;
  }

  /**
   * Adds scores to corresponding violation type in the list.
   *
   * @author Niclas Kühnapfel
   * @param scores - Scores to add.
   * @param multiplier - Multiplier for each score.
   */
  addScores(scores, multiplier) {
    scores.forEach((value, type) => {
      const index = this.getIndex(parseInt(type));
      if (value !== undefined) {
        this.lst[index].score += value * multiplier;
      }
    });
  }

  /**
   * Appends severities to each violation type in the list.
   *
   * @author Niclas Kühnapfel
   * @param severity - List of severities.
   */
  appendSeverity(severity) {
    severity.forEach((value, type) => {
      this.lst[this.getIndex(type)].severity = value;
    });
  }

  /**
   * Sort list by score.
   *
   * @author Niclas Kühnapfel
   * @returns {Array} - Sorted list of object containing violation type, score
   *     and severity.
   */
  sort() {
    this.lst.sort((a, b) => (a.score < b.score ? 1 : -1));
    return this.lst;
  }
}

module.exports = RecommenderList;
