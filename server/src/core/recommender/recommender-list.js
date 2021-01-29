class RecommenderList {
  constructor() {
    this.lst = [];
  }

  getIndex(violationType) {
    const index = this.lst.findIndex((x) => x.violation_type === violationType);
    if (index === -1) {
      this.lst.push({ violation_type: violationType, score: 0, severity: 0 });
      return this.lst.length - 1;
    }
    return index;
  }

  addScores(scores, multiplier) {
    scores.forEach((value, type) => {
      const index = this.getIndex(parseInt(type));
      if (value !== undefined) {
        this.lst[index].score += value * multiplier;
      }
    });
  }

  appendSeverity(severity) {
    severity.forEach((value, type) => {
      this.lst[this.getIndex(type)].severity = value;
    });
  }

  sort() {
    this.lst.sort((a, b) => (a.score < b.score ? 1 : -1));
    return this.lst;
  }
}

module.exports = RecommenderList;
