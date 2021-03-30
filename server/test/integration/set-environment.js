const setEnvironment = () => {
  if (!process.env.DB_USER) {
    process.env.DB_USER = '_';
  }
  if (!process.env.DB_PASSWORD) {
    process.env.DB_PASSWORD = '_';
  }
  if (!process.env.DB_NAME) {
    process.env.DB_NAME = '_';
  }
};

module.exports = setEnvironment;
