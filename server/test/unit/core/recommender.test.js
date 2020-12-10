const Bluebird = require("bluebird");

const Recommender = require("../../../src/core/recommender");
const ReportDatabaseHandle = require("../../../src/core/database/database-reports");
const Location = require("../../../src/models/location");
const {Database, DatabaseConfiguration} = require("../../../src/core/database/database");

function initDatabase() {
    let configuration = DatabaseConfiguration.forTCPSocket("postgres", "postgres", "wegli", "localhost", "5432");
    let database = new Database(configuration);
    database.connect();
    Database.shared = database;
}

function isOutlier(reports, type) {
    return reports.every(function (report) {
        return report.violation_type !== type;
    });
}

async function analyzeData(reports) {
    let recommender = new Recommender();
    let matches = [0, 0, 0, 0, 0]
    let counter = 0;

    // check for each datapoint
    await Bluebird.map(reports, async (report) => {
        let location = new Location(report.st_y, report.st_x);
        let type = report.violation_type

        let recommendations = await recommender.getLocationRecommendations(location, report.id);

        if (recommendations.includes(type)) {
            matches[recommendations.indexOf(type)] += 1;
        }
        counter += 1;

    }, {concurrency: 1500});

    return [counter, matches];
}

function printResults(counter, matches) {
    matches.forEach(function (item, index) {
        this[index] = 100 / counter * item;
    }, matches);
    let sum = matches[0] + matches[1] + matches[2];

    console.log("Analyzed " + counter.toString() + " data points.")
    for (let i = 0; i < matches.length; i++) {
        console.log((i + 1).toString() + ". recommendation accuracy: " + matches[i].toFixed(2).toString() + " %")
    }
    console.log("3 recommendations accuracy: " + (sum).toFixed(2).toString() + " %")
    console.log("4 recommendations accuracy: " + (sum + matches[3]).toFixed(2).toString() + " %")
    console.log("5 recommendations accuracy: " + (sum + matches[3] + matches[4]).toFixed(2).toString() + " %")
}

describe(`Recommender`, function () {
    describe.skip("#getLocationRecommendations", function () {
        it("shows overall accuracy", async function () {
            initDatabase();
            let dbHandle = new ReportDatabaseHandle();
            let allReports = await dbHandle.queryAllReports();

            let analyzed = await analyzeData(allReports);

            console.log("Overall Accuracy:")
            printResults(analyzed[0], analyzed[1]);
        }).timeout(720000);

        it("shows overall accuracy of Berlin", async function () {
            initDatabase();
            let dbHandle = new ReportDatabaseHandle();

            // Hackescher Markt
            let berlin = new Location(52.52306, 13.40173);
            let reportsBerlin = await dbHandle.queryNearReports(berlin, 8000);

            let analyzed = await analyzeData(reportsBerlin);

            console.log("Berlin Accuracy:")
            printResults(analyzed[0], analyzed[1]);
        }).timeout(360000);

        it("shows overall accuracy of Hamburg", async function () {
            initDatabase();
            let dbHandle = new ReportDatabaseHandle();

            // Hamburg Hauptbahnhof
            let hamburg = new Location(53.55298, 10.00518);
            let reportsHamburg = await dbHandle.queryNearReports(hamburg, 6000);

            let analyzed = await analyzeData(reportsHamburg);

            console.log("Hamburg Accuracy:")
            printResults(analyzed[0], analyzed[1]);
        }).timeout(180000);

        it("shows accuracy of outlier detection in Berlin", async function () {
            initDatabase();
            let dbHandle = new ReportDatabaseHandle();

            // Hackescher Markt
            let berlin = new Location(52.52306, 13.40173);
            let reportsBerlin = await dbHandle.queryNearReports(berlin, 8000);

            let realOutliers = 0;
            let falsePositiveOutliers = 0;
            let detectedOutliers = 0;

            // check for each datapoint
            await Promise.all(reportsBerlin.map(async (report) => {
                let location = new Location(report.st_y, report.st_x);
                let type = report.violation_type;
                let recommender = new Recommender();
                let reports = await recommender.queryReports(location, 50, report.id);

                if (isOutlier(reports, type)) {
                    //console.log(report)
                    realOutliers += 1;
                    if (Recommender.isOutlier(reports)) {
                        detectedOutliers += 1;
                    }
                } else {
                    if (Recommender.isOutlier(reports)) {
                        falsePositiveOutliers += 1;
                    }
                }
            }));

            console.log("Real outliers: " + realOutliers.toString());
            console.log("Detected outliers: " + (detectedOutliers + falsePositiveOutliers).toString());
            console.log("True positives: " + detectedOutliers.toString());
            console.log("False positives: " + falsePositiveOutliers.toString());
            console.log("Not/wrong detected: " + (falsePositiveOutliers + (realOutliers - detectedOutliers)).toString());
        }).timeout(180000);
    })
})
