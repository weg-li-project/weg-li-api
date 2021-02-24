function skip(testContext) {
  return {
    if: (condition) => {
      if (condition) testContext.skip();
    },
  };
}

const needsGoogleIntegration = (testContext) => skip(testContext).if(
  !process.env.GOOGLE_APPLICATION_CREDENTIALS || !process.env.INTEGRATION_TEST
);

const needsPerformanceTestFlag = (testContext) => skip(testContext).if(!process.env.PERFORMANCE_TEST);

module.exports = { skip, needsGoogleIntegration, needsPerformanceTestFlag };
