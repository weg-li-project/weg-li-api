'use strict'

const ReportDatabaseHandle = require("./database/database-reports");

const RADIUS = 40;
const RECOMMENDATION_NUMBER = 3;

/**
 * Responsible for creating location based and user
 * data based recommendations.
 *
 * @author Niclas Kühnapfel
 */
class Recommender {
    /**
     * Retrieve reports for analysis.
     *
     * @param location The location of interest.
     * @returns {Promise<Array[]>} Reports in the range of given location.
     * @author Niclas Kühnapfel
     */
    static async queryReports(location) {
        let dbHandle = new ReportDatabaseHandle();
        return await dbHandle.queryNearReports(location, RADIUS);
    }

    /**
     * Return array keys with highest associated values.
     *
     * @param arr The array.
     * @param n Number of keys to return.
     * @returns {string[]}
     * @author Niclas Kühnapfel
     */
    static getKeysWithHighestValue(arr, n) {
        let keys = Object.keys(arr);
        keys.sort(function(a, b){
            return arr[b] - arr[a];
        })
        return keys.slice(0, n);
    }

    /**
     * Returns recommendations based on the location of given reports.
     *
     * @param reports The reports to consider during analysis.
     * @returns {string[]} Most probable violation types.
     * @author Niclas Kühnapfel
     */
    static async getLocationRecommendations(reports) {
        if (Object.keys(reports).length < 5) {
            // fallback
            let violations = {}
            reports.forEach(function(report) {
                if (report.violation_type in violations) {
                    violations[report.violation_type] += 1
                } else {
                    violations[report.violation_type] = 1
                }
            })
            return this.getKeysWithHighestValue(violations, RECOMMENDATION_NUMBER)
        } else {
            // sum over inverse of all distances
            let distanceSum = reports.reduce(function(sum, report) {
                return sum + (1 / report.distance);
            }, 0);

            // assign distance based weights to each report
            reports.forEach(function(report, index) {
                this[index].weight = (1 / distanceSum) * (1 / report.distance);
            }, reports);

            // sum up weights to determine most probable violation type
            let violations = {};
            reports.forEach(function(report) {
                if (report.violation_type in violations) {
                    violations[report.violation_type] += report.weight;
                } else {
                    violations[report.violation_type] = report.weight;
                }
            });

            // consider violations with highest weights
            return this.getKeysWithHighestValue(violations, RECOMMENDATION_NUMBER);
        }
    }
}

module.exports = Recommender;
