// src/utils/multer.js

import multer from "multer";
import path from "path";
import fs from "fs";
import ApiError from "./ApiError.js";
import httpStatus from "http-status";

// Pastikan direktori ada
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "public/uploads/avatars";
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter (only images)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(
    new ApiError(
      httpStatus.BAD_REQUEST,
      "Format file tidak didukung. Gunakan jpeg, jpg, png, atau webp.",
    ),
  );
};

const uploadAvatar = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: fileFilter,
});

const storageGroup = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "public/uploads/groups";
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadGroup = multer({
  storage: storageGroup,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB for groups
  },
  fileFilter: fileFilter,
});

export { uploadAvatar, uploadGroup };
