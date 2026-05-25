const appJson = require("./app.json");

const apiBaseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL || "").trim();

module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    extra: {
      ...(appJson.expo?.extra || {}),
      apiBaseUrl,
      eas: {
        projectId: "3931261b-208e-4fd0-a30c-b8104bff880c",
      },
    },
  },
};
