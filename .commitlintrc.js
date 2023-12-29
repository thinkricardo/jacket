const generalScopes = ["config", "deps", "repo", "workspace"];
const packageScopes = [];

const allowedScopes = [...generalScopes, ...packageScopes];

module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-empty": [2, "never"],
    "scope-enum": [2, "always", [...allowedScopes].sort()],
  },
};
