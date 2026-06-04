// src/controllers/group.controller.js

import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync.js";
import groupService from "../services/group.service.js";

/**
 * GET /groups?search=...&category=...
 * List grup publik dengan filter opsional
 */
const listGroups = catchAsync(async (req, res) => {
  const { search, category } = req.query;

  const groups = await groupService.getPublicGroups({ search, category });

  res.status(httpStatus.OK).send({
    success: true,
    message: "Groups retrieved successfully",
    data: groups,
  });
});

/**
 * GET /groups/:id
 * Detail satu grup beserta daftar anggotanya
 */
const getGroupDetail = catchAsync(async (req, res) => {
  const group = await groupService.getGroupById(Number(req.params.id));

  res.status(httpStatus.OK).send({
    success: true,
    message: "Group detail retrieved successfully",
    data: group,
  });
});

/**
 * POST /groups/:id/join
 * Bergabung ke grup publik
 */
const joinGroup = catchAsync(async (req, res) => {
  const membership = await groupService.joinPublicGroup(req.user.id, Number(req.params.id));

  res.status(httpStatus.CREATED).send({
    success: true,
    message: "Successfully joined the group",
    data: membership,
  });
});

/**
 * POST /groups/join-by-code
 * Bergabung ke grup privat via kode undangan
 */
const joinByCode = catchAsync(async (req, res) => {
  const { invite_code } = req.body;

  const membership = await groupService.joinGroupByCode(req.user.id, invite_code);

  res.status(httpStatus.CREATED).send({
    success: true,
    message: "Successfully joined the group via invite code",
    data: membership,
  });
});

/**
 * POST /groups
 * Buat grup baru
 */
const create = catchAsync(async (req, res) => {
  const { name, description, category, is_public, rules } = req.body;

  // Jika ada file upload, gunakan path file tersebut sebagai image_url
  let imageUrl = req.body.image_url;
  if (req.file) {
    imageUrl = `/uploads/groups/${req.file.filename}`;
  }

  // Handle parsing untuk multipart/form-data
  const isPublic = typeof is_public === "string" ? is_public === "true" : is_public;

  let parsedRules = rules;
  if (typeof rules === "string") {
    if (rules.trim() === "") {
      parsedRules = [];
    } else {
      try {
        parsedRules = JSON.parse(rules);
      } catch (e) {
        // Jika bukan JSON, coba bagi berdasarkan koma (untuk multipart form-data)
        if (rules.includes(",")) {
          parsedRules = rules.split(",").map((r) => r.trim());
        } else {
          parsedRules = [rules];
        }
      }
    }
  } else if (!rules) {
    parsedRules = [];
  }

  const group = await groupService.createGroup(req.user.id, {
    name,
    description,
    category,
    isPublic,
    rules: parsedRules ? parsedRules.map((r) => (typeof r === "object" ? r.content : r)) : [],
    imageUrl,
  });

  res.status(httpStatus.CREATED).send({
    success: true,
    message: "Group created successfully",
    data: group,
  });
});

/**
 * PATCH /groups/:id
 * Update grup (Admin only)
 */
const update = catchAsync(async (req, res) => {
  const updateData = { ...req.body };

  if (req.file) {
    updateData.imageUrl = `/uploads/groups/${req.file.filename}`;
  }

  // Handle parsing untuk multipart/form-data
  if (typeof updateData.is_public !== "undefined" && typeof updateData.is_public === "string") {
    updateData.isPublic = updateData.is_public === "true";
    delete updateData.is_public;
  }

  if (typeof updateData.rules === "string") {
    if (updateData.rules.trim() === "") {
      updateData.rules = [];
    } else {
      try {
        updateData.rules = JSON.parse(updateData.rules);
      } catch (e) {
        // Jika bukan JSON, coba bagi berdasarkan koma (untuk multipart form-data)
        if (updateData.rules.includes(",")) {
          updateData.rules = updateData.rules.split(",").map((r) => r.trim());
        } else {
          updateData.rules = [updateData.rules];
        }
      }
    }
  }

  if (Array.isArray(updateData.rules)) {
    updateData.rules = updateData.rules.map((r) => (typeof r === "object" ? r.content : r));
  }

  const group = await groupService.updateGroup(req.user.id, Number(req.params.id), updateData);

  res.status(httpStatus.OK).send({
    success: true,
    message: "Group updated successfully",
    data: group,
  });
});

/**
 * GET /groups/joined
 * List grup yang diikuti oleh user saat ini
 */
const getJoinedGroups = catchAsync(async (req, res) => {
  const groups = await groupService.getJoinedGroups(req.user.id);

  res.status(httpStatus.OK).send({
    success: true,
    message: "Joined groups retrieved successfully",
    data: groups,
  });
});

/**
 * GET /groups/:id/report
 * Laporan partisipasi dan mood grup hari ini
 */
const getReport = catchAsync(async (req, res) => {
  const report = await groupService.getGroupReport(Number(req.params.id));

  res.status(httpStatus.OK).send({
    success: true,
    message: "Group report retrieved successfully",
    data: report,
  });
});

/**
 * DELETE /groups/:id/members/:userId
 * Kick anggota atau keluar dari grup
 */
const removeMember = catchAsync(async (req, res) => {
  await groupService.removeMember(req.user.id, Number(req.params.id), Number(req.params.userId));

  const isSelf = req.user.id === Number(req.params.userId);

  res.status(httpStatus.OK).send({
    success: true,
    message: isSelf ? "Successfully left the group" : "Member kicked successfully",
  });
});

export default {
  listGroups,
  getGroupDetail,
  joinGroup,
  joinByCode,
  create,
  update,
  getJoinedGroups,
  getReport,
  removeMember,
};
