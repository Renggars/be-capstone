// src/services/badge.service.js

import prisma from "../../prisma/index.js";

/**
 * Cek dan unlock lencana untuk user berdasarkan aktivitas.
 * @param {number} userId
 * @param {'CHECKIN' | 'GROUP'} triggerType
 */
const checkAndUnlockBadges = async (userId, triggerType) => {
  const allBadges = await prisma.badge.findMany();
  const userBadges = await prisma.userBadge.findMany({
    where: { userId },
    select: { badgeId: true },
  });

  const unlockedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId));

  for (const badge of allBadges) {
    if (unlockedBadgeIds.has(badge.id)) continue;

    let shouldUnlock = false;

    if (triggerType === "CHECKIN") {
      shouldUnlock = await evaluateCheckinCriteria(userId, badge.name);
    } else if (triggerType === "GROUP") {
      shouldUnlock = await evaluateGroupCriteria(userId, badge.name);
    }

    if (shouldUnlock) {
      await prisma.userBadge.create({
        data: {
          userId,
          badgeId: badge.id,
        },
      });
      console.log(`Unlocked badge "${badge.name}" for user ${userId}`);
    }
  }
};

/**
 * Evaluasi kriteria lencana berbasis check-in
 */
const evaluateCheckinCriteria = async (userId, badgeName) => {
  const checkins = await prisma.checkin.findMany({
    where: { userId },
    orderBy: { checkinDate: "desc" },
    select: {
      checkinDate: true,
      waktuTidur: true,
      tingkatOlahraga: true,
      interaksiSosial: true,
    },
  });

  if (checkins.length === 0) return false;

  switch (badgeName) {
    case "Pemula Mindful":
      // 1x daily check-in
      return checkins.length >= 1;

    case "Konsisten 7 Hari":
      // Streak 7 hari berturut
      return calculateStreak(checkins) >= 7;

    case "Tidur Sehat":
      // waktu_tidur >= 7 dalam 5 checkins terakhir
      if (checkins.length < 5) return false;
      const recentSleep = checkins.slice(0, 5);
      return recentSleep.every((c) => c.waktuTidur >= 7);

    case "Aktif Bergerak":
      // tingkat_olahraga = Rutin dalam 3 checkins berturut
      if (checkins.length < 3) return false;
      const recentExercise = checkins.slice(0, 3);
      return recentExercise.every((c) => c.tingkatOlahraga === "Rutin");

    case "Jiwa Sosial":
      // interaksi_sosial = 10 dalam 3 checkins (tidak harus berturut)
      const socialCheckins = checkins.filter((c) => c.interaksiSosial === 10);
      return socialCheckins.length >= 3;

    default:
      return false;
  }
};

/**
 * Evaluasi kriteria lencana berbasis grup
 */
const evaluateGroupCriteria = async (userId, badgeName) => {
  if (badgeName === "Penjelajah Grup") {
    const groupCount = await prisma.groupMember.count({
      where: { userId },
    });
    return groupCount >= 1;
  }
  return false;
};

/**
 * Helper untuk hitung streak dari list checkins
 */
const calculateStreak = (checkins) => {
  if (checkins.length === 0) return 0;

  const dateString = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const today = new Date(`${dateString}T00:00:00.000Z`);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const latestCheckinDate = new Date(checkins[0].checkinDate);
  if (
    latestCheckinDate.getTime() !== today.getTime() &&
    latestCheckinDate.getTime() !== yesterday.getTime()
  ) {
    return 0;
  }

  let streak = 0;
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

export default {
  checkAndUnlockBadges,
};
