// src/middlewares/error.js

import httpStatus from "http-status";
import { Prisma } from "@prisma/client";
import config from "../config/config.js";
import logger from "../config/logger.js";
import ApiError from "../utils/ApiError.js";

const errorConverter = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    if (error.response) {
      // Error dari axios / HTTP request eksternal
      const message = err.response.data?.message || err.response.data;
      const statusCode = error.response.status;
      error = new ApiError(statusCode, message, false, err.stack);
    } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
      // Error dari Prisma
      error = handlePrismaError(err);
    } else {
      const statusCode = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
      const message = error.message || httpStatus[statusCode];
      error = new ApiError(statusCode, message, false, err.stack);
    }
  }
  next(error);
};

const handlePrismaError = (err) => {
  switch (err.code) {
    case "P2002":
      return new ApiError(400, `Duplicate field value: ${err.meta?.target}`, false, err.stack);
    case "P2014":
      return new ApiError(400, `Invalid ID: ${err.meta?.target}`, false, err.stack);
    case "P2003":
      return new ApiError(400, `Invalid input data: ${err.meta?.target}`, false, err.stack);
    case "P2025":
      return new ApiError(404, "Record not found", false, err.stack);
    default:
      return new ApiError(500, `Something went wrong: ${err.message}`, false, err.stack);
  }
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;
  if (config.env === "production" && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
  }

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
    ...(config.env === "development" && { stack: err.stack }),
  };

  if (config.env === "development") {
    logger.error(err);
  }

  res.status(statusCode).send(response);
};

export { errorConverter, errorHandler };
