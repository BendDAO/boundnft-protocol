const accounts = require(`./test-wallets.js`).accounts;

module.exports = {
  silent: true,
  measureStatementCoverage: true,
  measureFunctionCoverage: true,
  configureYulOptimizer: true,
  skipFiles: ["./mocks", "./interfaces", "./test"],
  mocha: {
    enableTimeouts: false,
  },
  providerOptions: {
    accounts,
  },
};
