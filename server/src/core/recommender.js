'use strict'

const ReportDatabaseHandle = require("./database/database-reports");

const NEAR_RADIUS = 50;
const WIDE_RADIUS = 2000;
const REPORTS_AROUND = 200;

/**
 * Responsible for creating location based and user
 * data based recommendations.
 *
 * @author Niclas Kühnapfel
 */
class Recommender {
    dbHandle = new ReportDatabaseHandle();

    async getRecommendations(location) {
        //let mostCommon = await this.dbHandle.getMostCommonViolations();
        let rec = new Recommendation(this.dbHandle);
        //await rec.assignMostCommonScores(mostCommon);
        await rec.assignLocationScores(location);
        return rec.getSortedKeys();
    }
}

class Recommendation {
    violations = {};

    constructor(dbHandle) {
        this.dbHandle = dbHandle;
    }

    async assignMostCommonScores(mostCommon) {
        //let mostCommon = await this.dbHandle.getMostCommonViolations();
        let len = Object.keys(mostCommon).length;
        let violations = {};
        mostCommon.forEach(type => {
            violations[type] = 1 - (1 / len * mostCommon.indexOf(type));
        });
        this.assignScores(violations, 0)
    }

    static inverseQuadratic(reports) {
        reports.forEach(function(report, index) {
            let e = 0.1;
            this[index].weight = 1 / (1 + (e * e * report.distance * report.distance));
        }, reports);
        return reports;
    }

    async assignLocationScores(location) {
        let c = await this.dbHandle.countNearReports(location, NEAR_RADIUS);
        let nearReports = await this.dbHandle.getKNN(location, c[0].count + REPORTS_AROUND, WIDE_RADIUS);
        let reports = this.constructor.inverseQuadratic(nearReports);

        // sum up weights to determine most probable violation type
        let violations = {};
        reports.forEach(function(report) {
            if (report.violation_type in violations) {
                violations[report.violation_type] += report.weight;
            } else {
                violations[report.violation_type] = report.weight;
            }
        });
        this.assignScores(violations, 1);
    }

    assignScores(violations, multiplier) {
        Object.keys(violations).forEach(key => {
            this.violations[key] = violations[key] + multiplier;
        })
    }

    getSortedKeys() {
        let keys = Object.keys(this.violations);
        keys.sort((a, b) => {
            return this.violations[b] - this.violations[a];
        })
        return keys.map(function (x) {
            return parseFloat(x);
        });
    }
}

module.exports = Recommender;
