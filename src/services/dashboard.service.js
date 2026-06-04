// src/services/dashboard.service.js

import prisma from "../../prisma/index.js";

/**
 * Hitung streak check-in harian user saat ini.
 * @param {number} userId
 * @returns {Promise<number>} currentStreak
 */
const calculateCurrentStreak = async (userId) => {
  const checkins = await prisma.checkin.findMany({
    where: { userId },
    orderBy: { checkinDate: "desc" },
    select: { checkinDate: true },
  });

  if (checkins.length === 0) return 0;

  const dateString = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const today = new Date(`${dateString}T00:00:00.000Z`);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let streak = 0;
  let lastDate = null;

  // Cek apakah check-in terakhir adalah hari ini atau kemarin
  const latestCheckinDate = new Date(checkins[0].checkinDate);
  if (
    latestCheckinDate.getTime() !== today.getTime() &&
    latestCheckinDate.getTime() !== yesterday.getTime()
  ) {
    return 0;
  }

  // Hitung jumlah hari berturut-turut
  let expectedDate = new Date(latestCheckinDate);
  for (const checkin of checkins) {
    const currentDate = new Date(checkin.checkinDate);

    if (currentDate.getTime() === expectedDate.getTime()) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

/**
 * Hitung persentase risiko stres dari rata-rata 7 check-in terakhir.
 * Skor kebahagiaan 1-10 (makin rendah = makin stres).
 * Risk % = ((10 - avgScore) / 9) * 100
 * @param {number} userId
 * @returns {Promise<number>} stressRiskPercentage 0-100
 */
const calculateStressRisk = async (userId) => {
  const recentCheckins = await prisma.checkin.findMany({
    where: { userId },
    orderBy: { checkinDate: "desc" },
    take: 7,
    select: { skorKebahagiaan: true },
  });

  if (recentCheckins.length === 0) return 0;

  const avg = recentCheckins.reduce((sum, c) => sum + c.skorKebahagiaan, 0) / recentCheckins.length;

  const riskPercentage = Math.round(((10 - avg) / 9) * 100);
  return Math.max(0, Math.min(100, riskPercentage));
};

/**
 * Ambil ringkasan dashboard
 * @param {number} userId
 * @returns {Promise<Object>}
 */
const getDashboardSummary = async (userId) => {
  const dateString = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const today = new Date(`${dateString}T00:00:00.000Z`);

  const [stressRisk, todayCheckin, recentBadges, currentStreak] = await Promise.all([
    calculateStressRisk(userId),
    prisma.checkin.findFirst({
      where: { userId, checkinDate: today },
    }),
    prisma.userBadge.findMany({
      where: { userId },
      orderBy: { unlockedAt: "desc" },
      take: 3,
      include: {
        badge: {
          select: { id: true, name: true, description: true, iconUrl: true },
        },
      },
    }),
    calculateCurrentStreak(userId),
  ]);

  return {
    stressRiskPercentage: stressRisk,
    currentStreak,
    hasCheckedInToday: !!todayCheckin,
    recentBadges: recentBadges.map((ub) => ({
      ...ub.badge,
      unlockedAt: ub.unlockedAt,
    })),
  };
};

/**
 * Ambil semua badge sistem beserta status unlock user
 * @param {number} userId
 * @returns {Promise<Array>}
 */
const getAllBadgesWithStatus = async (userId) => {
  const [allBadges, userBadges] = await Promise.all([
    prisma.badge.findMany({
      orderBy: { id: "asc" },
    }),
    prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true, unlockedAt: true },
    }),
  ]);

  const unlockedMap = new Map(userBadges.map((ub) => [ub.badgeId, ub.unlockedAt]));

  return allBadges.map((badge) => ({
    ...badge,
    isUnlocked: unlockedMap.has(badge.id),
    unlockedAt: unlockedMap.get(badge.id) || null,
  }));
};

export default {
  getDashboardSummary,
  getAllBadgesWithStatus,
};
