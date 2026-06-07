// src/services/group.service.js

import httpStatus from "http-status";
import prisma from "../../prisma/index.js";
import ApiError from "../utils/ApiError.js";
import badgeService from "./badge.service.js";

/**
 * Ambil list grup publik dengan filter opsional
 * @param {Object} filters - { search, category }
 * @returns {Promise<Group[]>}
 */
const getPublicGroups = async ({ search, category } = {}) => {
  const where = { isPublic: true };

  if (category) {
    where.category = category;
  }

  if (search) {
    where.OR = [{ name: { contains: search } }, { description: { contains: search } }];
  }

  const groups = await prisma.group.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      imageUrl: true,
      createdAt: true,
      _count: { select: { members: true } },
    },
  });

  return groups.map((g) => ({
    ...g,
    memberCount: g._count.members,
    _count: undefined,
  }));
};

/**
 * Ambil detail satu grup beserta daftar anggotanya
 * @param {number} groupId
 * @returns {Promise<Group>}
 */
const getGroupById = async (groupId) => {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      rules: {
        select: { id: true, content: true },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!group) {
    throw new ApiError(httpStatus.NOT_FOUND, "Group not found");
  }

  return {
    ...group,
    memberCount: group.members.length,
    members: group.members.map((m) => ({
      ...m.user,
      role: m.role,
      joinedAt: m.joinedAt,
    })),
    rules: group.rules.map((r) => ({
      id: r.id,
      content: r.content,
    })),
  };
};

/**
 * Bergabung ke grup publik
 * @param {number} userId
 * @param {number} groupId
 * @returns {Promise<GroupMember>}
 */
const joinPublicGroup = async (userId, groupId) => {
  const group = await prisma.group.findUnique({ where: { id: groupId } });

  if (!group) {
    throw new ApiError(httpStatus.NOT_FOUND, "Group not found");
  }

  if (!group.isPublic) {
    throw new ApiError(httpStatus.FORBIDDEN, "This group is private. Use an invite code to join.");
  }

  const existingMember = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });

  if (existingMember) {
    throw new ApiError(httpStatus.CONFLICT, "You are already a member of this group");
  }

  const member = await prisma.groupMember.create({
    data: { userId, groupId },
  });

  // Trigger badge unlock check
  await badgeService.checkAndUnlockBadges(userId, "GROUP");

  return member;
};

/**
 * Bergabung ke grup privat menggunakan kode undangan
 * @param {number} userId
 * @param {string} inviteCode
 * @returns {Promise<GroupMember>}
 */
const joinGroupByCode = async (userId, inviteCode) => {
  const group = await prisma.group.findUnique({ where: { inviteCode } });

  if (!group) {
    throw new ApiError(httpStatus.NOT_FOUND, "Invalid invite code. Group not found.");
  }

  const existingMember = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId: group.id } },
  });

  if (existingMember) {
    throw new ApiError(httpStatus.CONFLICT, "You are already a member of this group");
  }

  const member = await prisma.groupMember.create({
    data: { userId, groupId: group.id },
  });

  // Trigger badge unlock check
  await badgeService.checkAndUnlockBadges(userId, "GROUP");

  return member;
};

/**
 * Buat grup baru
 * @param {number} userId - ID pembuat grup
 * @param {Object} groupData - { name, description, category, isPublic, rules, imageUrl }
 * @returns {Promise<Group>}
 */
const createGroup = async (userId, groupData) => {
  let inviteCode = null;

  if (!groupData.isPublic) {
    // Generate invite code: MB-RANDOM8 (e.g. MB-A1B2C3D4)
    const randomStr = Math.random().toString(36).substring(2, 10).toUpperCase();
    inviteCode = `MB-${randomStr}`;
  }

  const group = await prisma.group.create({
    data: {
      name: groupData.name,
      description: groupData.description,
      category: groupData.category,
      isPublic: groupData.isPublic,
      imageUrl: groupData.imageUrl || null,
      inviteCode,
      members: {
        create: {
          userId,
          role: "ADMIN",
        },
      },
      rules: {
        create: groupData.rules ? groupData.rules.map((r) => ({ content: r })) : [],
      },
    },
    include: {
      _count: { select: { members: true } },
      rules: { select: { id: true, content: true } },
    },
  });

  // Trigger badge unlock check for creator (Penjelajah Grup)
  await badgeService.checkAndUnlockBadges(userId, "GROUP");

  return {
    ...group,
    memberCount: group._count.members,
    _count: undefined,
  };
};

/**
 * Update detail grup
 * @param {number} userId - ID user yang mencoba update (harus ADMIN)
 * @param {number} groupId - ID grup yang diupdate
 * @param {Object} updateData - { name, description, category, isPublic, rules, imageUrl }
 * @returns {Promise<Group>}
 */
const updateGroup = async (userId, groupId, updateData) => {
  // 1. Verifikasi role (harus ADMIN)
  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });

  if (!membership || membership.role !== "ADMIN") {
    throw new ApiError(httpStatus.FORBIDDEN, "Only group admins can update group settings");
  }

  const currentGroup = await prisma.group.findUnique({ where: { id: groupId } });
  if (!currentGroup) {
    throw new ApiError(httpStatus.NOT_FOUND, "Group not found");
  }

  const data = { ...updateData };
  delete data.rules; // handle manual rules update
  delete data.image; // ignore raw image field from multipart

  if (typeof data.image_url !== "undefined") {
    data.imageUrl = data.image_url;
    delete data.image_url;
  }

  if (typeof data.is_public !== "undefined") {
    data.isPublic = data.is_public;
    delete data.is_public;
  }

  // 2. Logika Invite Code
  if (typeof data.isPublic !== "undefined") {
    if (data.isPublic === true) {
      // Jika jadi publik, hapus invite code
      data.inviteCode = null;
    } else if (data.isPublic === false && !currentGroup.inviteCode) {
      // Jika jadi privat dan belum ada code, buat baru
      const randomStr = Math.random().toString(36).substring(2, 10).toUpperCase();
      data.inviteCode = `MB-${randomStr}`;
    }
  }

  // 3. Update Group
  const group = await prisma.group.update({
    where: { id: groupId },
    data: {
      ...data,
      rules: updateData.rules
        ? {
            deleteMany: {},
            create: updateData.rules.map((r) => ({ content: r })),
          }
        : undefined,
    },
    include: {
      rules: { select: { id: true, content: true } },
    },
  });

  return group;
};

/**
 * Ambil daftar grup yang diikuti user
 * @param {number} userId
 * @returns {Promise<Group[]>}
 */
const getJoinedGroups = async (userId) => {
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: {
      group: {
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          imageUrl: true,
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return memberships.map((m) => ({
    ...m.group,
    memberCount: m.group._count.members,
    _count: undefined,
    role: m.role,
    joinedAt: m.joinedAt,
  }));
};

/**
 * Ambil laporan partisipasi dan mood grup hari ini
 * @param {number} groupId
 * @returns {Promise<Object>}
 */
const getGroupReport = async (groupId) => {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { _count: { select: { members: true } } },
  });

  if (!group) {
    throw new ApiError(httpStatus.NOT_FOUND, "Group not found");
  }

  const totalMembers = group._count.members;

  // Get date for Jakarta (Start of Day UTC)
  const dateString = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const today = new Date(`${dateString}T00:00:00.000Z`);

  // Get check-ins from members today
  const checkins = await prisma.checkin.findMany({
    where: {
      checkinDate: today,
      user: {
        groupMembers: {
          some: { groupId },
        },
      },
    },
    select: { skorKebahagiaan: true },
  });

  const checkedInCount = checkins.length;
  const participationPercentage = totalMembers > 0 ? (checkedInCount / totalMembers) * 100 : 0;

  // Participation Message
  let participationMessage = "Mari dukung teman yang belum check-in.";
  if (participationPercentage === 100)
    participationMessage = "Luar biasa! Semua anggota sudah check-in.";
  else if (participationPercentage >= 75)
    participationMessage = "Hampir lengkap! Ayo dukung teman yang belum check-in.";

  // Mood Logic
  let moodType = "Berawan";
  let moodDescription =
    "Suasana grup cukup tenang hari ini. Berikan dukungan satu sama lain untuk tetap semangat.";
  let moodIcon = "cloud";

  if (checkedInCount > 0) {
    const avgHappiness =
      checkins.reduce((acc, curr) => acc + curr.skorKebahagiaan, 0) / checkedInCount;
    const happyMembersCount = checkins.filter((c) => c.skorKebahagiaan >= 7).length;
    const happyPercentage = (happyMembersCount / checkedInCount) * 100;

    if (avgHappiness >= 9) {
      moodType = "Cerah & Hangat";
      moodIcon = "sun";
      moodDescription =
        "Sebagian besar anggota grup merasa cukup berenergi hari ini! Ini adalah waktu yang tepat untuk berkolaborasi dan berbagi hal positif.";
    } else if (avgHappiness >= 6) {
      moodType = "Tenang & Stabil";
      moodIcon = "cloud-sun";
      moodDescription =
        "Anggota grup merasa cukup tenang dan stabil. Suasana yang baik untuk refleksi diri dan berbagi cerita kecil tentang hari ini.";
    } else if (avgHappiness >= 3) {
      moodType = "Mendung & Teduh";
      moodIcon = "cloud";
      moodDescription =
        "Energi grup sedang rendah hari ini. Ini adalah waktu yang tepat untuk memberikan dukungan ekstra atau sekadar mendengarkan satu sama lain.";
    } else {
      moodType = "Hujan yang Menenangkan";
      moodIcon = "rain";
      moodDescription =
        "Beberapa anggota mungkin sedang menghadapi tantangan emosional. Mari jadikan grup ini pelabuhan aman untuk meluapkan perasaan tanpa penghakiman.";
    }

    return {
      participation: {
        percentage: Math.round(participationPercentage),
        checkedInCount,
        totalMembers,
        message: participationMessage,
      },
      mood: {
        type: moodType,
        happyPercentage: Math.round(happyPercentage),
        description: moodDescription,
        icon: moodIcon,
        averageHappiness: Number(avgHappiness.toFixed(1)),
      },
    };
  }

  // If no check-ins yet
  return {
    participation: {
      percentage: 0,
      checkedInCount: 0,
      totalMembers,
      message: "Belum ada anggota yang check-in hari ini.",
    },
    mood: {
      type: "Tenang",
      happyPercentage: 0,
      description: "Menunggu partisipasi anggota untuk melihat suasana hati grup.",
      icon: "cloud",
      averageHappiness: 0,
    },
  };
};

/**
 * Kick anggota atau keluar dari grup
 * @param {number} requesterId - ID user yang meminta (bisa self atau admin)
 * @param {number} groupId
 * @param {number} targetUserId - ID user yang akan dikeluarkan
 */
const removeMember = async (requesterId, groupId, targetUserId) => {
  const targetMembership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: targetUserId, groupId } },
  });

  if (!targetMembership) {
    throw new ApiError(httpStatus.NOT_FOUND, "Member not found in this group");
  }

  // Jika bukan keluar sendiri, cek apakah requester adalah ADMIN
  if (requesterId !== targetUserId) {
    const requesterMembership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: requesterId, groupId } },
    });

    if (!requesterMembership || requesterMembership.role !== "ADMIN") {
      throw new ApiError(httpStatus.FORBIDDEN, "Only group admins can kick members");
    }
  }

  // Pastikan admin tidak keluar/dikick kalau dia satu-satunya admin
  if (targetMembership.role === "ADMIN") {
    const adminCount = await prisma.groupMember.count({
      where: { groupId, role: "ADMIN" },
    });

    if (adminCount <= 1) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Cannot remove the last admin. Appoint another admin first or delete the group.",
      );
    }
  }

  await prisma.groupMember.delete({
    where: { id: targetMembership.id },
  });
};

export default {
  getPublicGroups,
  getGroupById,
  joinPublicGroup,
  joinGroupByCode,
  createGroup,
  updateGroup,
  getJoinedGroups,
  getGroupReport,
  removeMember,
};
