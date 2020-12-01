'use strict';

const ReportDatabaseHandle = require("../core/database/database-reports")

/**
 * Controller function for the data analysis endpoint.
 *
 * @param {e.Request} request - An express request object.
 * @param {e.Response} response - An express response object.
 */
async function createDataAnalysis(request, response) {
    let latitude = request.body.location.latitude
    let longitude = request.body.location.longitude

    let dbHandle = new ReportDatabaseHandle()
    let records = await dbHandle.queryNearReports(latitude.toString(), longitude.toString())

    let resp = []
    records.forEach(function (record) {
        resp.push(record.violation_type)
    });

    response.json({"violation": resp})
}

module.exports = createDataAnalysis