/* eslint-disable @typescript-eslint/no-require-imports -- next/jest's own docs use require() here, config file isn't bundled */
const nextJest = require("next/jest");

const createJestConfig = nextJest({
    dir: "./",
});

const config = {
    coverageProvider: "v8",
    testEnvironment: "node",
};

module.exports = createJestConfig(config);
