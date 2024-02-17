let whitelist = ["http://example2.com"];

let corsOptions = {
  origin: function (origin, callback) {
    if (process.env.DEV_MODE === "development") {
      // Allow requests from any origin during development
      callback(null, true);
    } else {
      if (whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    }
  },
  credentials: true
};

export {corsOptions}
