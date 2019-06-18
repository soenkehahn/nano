module.exports = {
  roots: ["src"],
  setupFiles: ["./src/test/setup.jsx"],
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },
};
