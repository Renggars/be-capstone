// src/index.js - Entry point

import prisma from "../prisma/index.js";
import app from "./app.js";
import config from "./config/config.js";
import logger from "./config/logger.js";

let server;

prisma
  .$connect()
  .then(() => {
    logger.info("Connected to Database");
    server = app.listen(config.port, () => {
      logger.info(`Server is running on http://localhost:${config.port}`);
      logger.info(`Docs available at http://localhost:${config.port}/api-docs`);
    });
  })
  .catch((error) => {
    logger.error("Failed to connect to Database", error);
    process.exit(1);
  });

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info("Server closed");
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error("Unexpected Error", error);
  exitHandler();
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);

process.on("SIGTERM", () => {
  logger.info("SIGTERM received");
  if (server) {
    server.close();
  }
});

export default app;
