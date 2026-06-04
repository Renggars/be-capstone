// src/controllers/dashboard.controller.js

import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync.js";
import dashboardService from "../services/dashboard.service.js";

/**
 * GET /dashboard/summary
 * Ringkasan: stres risk %, lencana terbaru, status check-in hari ini
 */
const getSummary = catchAsync(async (req, res) => {
  const summary = await dashboardService.getDashboardSummary(req.user.id);

  res.status(httpStatus.OK).send({
    success: true,
    message: "Dashboard summary retrieved successfully",
    data: summary,
  });
});

/**
 * GET /dashboard/badges
 * Semua badge sistem beserta status unlock user saat ini
 */
const getAllBadges = catchAsync(async (req, res) => {
  const badges = await dashboardService.getAllBadgesWithStatus(req.user.id);

  res.status(httpStatus.OK).send({
    success: true,
    message: "Badges retrieved successfully",
    data: badges,
  });
});

export default { getSummary, getAllBadges };
