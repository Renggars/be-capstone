// src/services/checkin.service.js

import httpStatus from "http-status";
import prisma from "../../prisma/index.js";
import ApiError from "../utils/ApiError.js";
import badgeService from "./badge.service.js";

/**
 * Cek apakah user sudah check-in hari ini
 * @param {number} userId
 * @returns {Promise<{hasCheckedIn: boolean, checkin: Checkin|null}>}
 */
/**
 * Cek apakah user sudah check-in hari ini (berdasarkan waktu lokal server)
 */
const getTodayCheckin = async (userId) => {
  // Ambil tanggal hari ini dalam format YYYY-MM-DD (WIB)
  const dateString = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const today = new Date(`${dateString}T00:00:00.000Z`);

  const checkin = await prisma.checkin.findFirst({
    where: {
      userId,
      checkinDate: today,
    },
  });

  return {
    hasCheckedIn: !!checkin,
    checkin,
  };
};

/**
 * Buat check-in baru. Satu user hanya bisa 1x per hari.
 * @param {number} userId
 * @param {Object} body
 * @returns {Promise<Checkin>}
 */
const createCheckin = async (userId, body) => {
  const { hasCheckedIn } = await getTodayCheckin(userId);

  if (hasCheckedIn) {
    throw new ApiError(httpStatus.CONFLICT, "You have already checked in today");
  }

  const dateString = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const startOfDay = new Date(`${dateString}T00:00:00.000Z`);

  const checkin = await prisma.checkin.create({
    data: {
      userId,
      skorKebahagiaan: body.skor_kebahagiaan,
      waktuTidur: body.waktu_tidur,
      screenTime: body.screen_time,
      tingkatOlahraga: body.tingkat_olahraga,
      interaksiSosial: body.interaksi_sosial,
      waktuKerja: body.waktu_kerja,
      checkinDate: startOfDay,
    },
  });

  // Trigger badge unlock check
  await badgeService.checkAndUnlockBadges(userId, "CHECKIN");

  return checkin;
};

/**
 * Ambil histori check-in berdasarkan bulan & tahun untuk heatmap
 * @param {number} userId
 * @param {number} month - 1-12
 * @param {number} year
 * @returns {Promise<Array>}
 */
const getCheckinHistory = async (userId, month, year) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59); // hari terakhir bulan

  const checkins = await prisma.checkin.findMany({
    where: {
      userId,
      checkinDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { checkinDate: "asc" },
    select: {
      checkinDate: true,
      skorKebahagiaan: true,
    },
  });

  // Format output siap render heatmap: { date: "YYYY-MM-DD", level: 1-10 }
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return checkins.map((c) => {
    let level = 1;
    if (c.skorKebahagiaan >= 9) level = 4;
    else if (c.skorKebahagiaan >= 6) level = 3;
    else if (c.skorKebahagiaan >= 3) level = 2;

    return {
      date: formatter.format(c.checkinDate),
      level,
    };
  });
};

export default {
  getTodayCheckin,
  createCheckin,
  getCheckinHistory,
};
