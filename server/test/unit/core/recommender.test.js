const Bluebird = require("bluebird");

const Recommender = require("../../../src/core/recommender");
const ReportDatabaseHandle = require("../../../src/core/database/database-reports");
const Location = require("../../../src/models/location");
const {Database, DatabaseConfiguration} = require("../../../src/core/database/database");

function initDatabase() {
    let configuration = DatabaseConfiguration.forTCPSocket("postgres", "postgres", "wegli_user_random", "localhost", "5432");
    let database = new Database(configuration);
    database.connect();
    Database.shared = database;
}

async function analyzeData(reports) {
    let recommender = new Recommender();
    let matches = [0, 0, 0, 0, 0]
    let counter = 0;

    // check for each datapoint
    await Bluebird.map(reports, async (report) => {
        let location = new Location(report.st_y, report.st_x);
        let type = report.violation_type

        let recommendations = await recommender.getRecommendations(location);

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
    for (let i = 0; i < 5; i++) {
        console.log((i + 1).toString() + ". recommendation accuracy: " + matches[i].toFixed(2).toString() + " %")
    }
    console.log("3 recommendations accuracy: " + (sum).toFixed(2).toString() + " %")
    console.log("4 recommendations accuracy: " + (sum + matches[3]).toFixed(2).toString() + " %")
    console.log("5 recommendations accuracy: " + (sum + matches[3] + matches[4]).toFixed(2).toString() + " %")
}

describe(`Recommender`, function () {
    describe("#getLocationRecommendations", function () {
        it("shows overall accuracy", async function () {
            initDatabase();
            let dbHandle = new ReportDatabaseHandle();
            let testReports = await dbHandle.getTestReports();

            let analyzed = await analyzeData(testReports);

            console.log("Overall Accuracy:")
            printResults(analyzed[0], analyzed[1]);
        }).timeout(720000);
    })
})
