const nextJest = require("next/jest");

const createJestConfig = nextJest({
    dir: "./",
});

const config = {
    coverageProvider: "v8",
    testEnvironment: "node",
};

module.exports = createJestConfig(config);
