// src/controllers/checkin.controller.js

import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync.js";
import checkinService from "../services/checkin.service.js";

/**
 * GET /checkins/today
 * Cek status check-in user hari ini
 */
const getToday = catchAsync(async (req, res) => {
  const { hasCheckedIn, checkin } = await checkinService.getTodayCheckin(req.user.id);

  res.status(httpStatus.OK).send({
    success: true,
    message: "Today check-in status retrieved",
    data: {
      hasCheckedIn,
      checkin: checkin || null,
    },
  });
});

/**
 * POST /checkins
 * Simpan data check-in harian
 */
const create = catchAsync(async (req, res) => {
  const checkin = await checkinService.createCheckin(req.user.id, req.body);

  res.status(httpStatus.CREATED).send({
    success: true,
    message: "Check-in saved successfully",
    data: checkin,
  });
});

/**
 * GET /checkins/history?month=MM&year=YYYY
 * Histori check-in untuk heatmap
 */
const getHistory = catchAsync(async (req, res) => {
  const { month, year } = req.query;

  const history = await checkinService.getCheckinHistory(req.user.id, Number(month), Number(year));

  res.status(httpStatus.OK).send({
    success: true,
    message: "Check-in history retrieved successfully",
    data: { month: Number(month), year: Number(year), history },
  });
});

export default { getToday, create, getHistory };
