'use client';

import React, { useState, useEffect, useRef } from 'react';
import PixelPetSprite from './PixelPetSprite';
import {
  getPetSkills,
  calculateCombatStats,
  PetSkill,
  PetCombatStats,
  PVP_BOT_RIVALS,
  BotRival,
} from '@/lib/petBattleData';
import { PETS_CATALOG } from '@/lib/petData';
import { sound } from '@/lib/soundFx';
import confetti from 'canvas-confetti';
import { Swords, Shield, Heart, Zap, Sparkles, Trophy, RotateCcw, Award } from 'lucide-react';

export interface PetPvPArenaProps {
  playerSpecies: string;
  playerPetName: string;
  playerLevel?: number;
  userCoins: number;
  onUpdateCoins: (newCoins: number) => void;
  onUpdatePetExp?: (addedExp: number) => void;
  userId?: string;
}

export default function PetPvPArena({
  playerSpecies = 'owl',
  playerPetName = 'Lexi Trí Tuệ',
  playerLevel = 1,
  userCoins,
  onUpdateCoins,
  onUpdatePetExp,
  userId,
}: PetPvPArenaProps) {
  const [selectedRival, setSelectedRival] = useState<BotRival>(PVP_BOT_RIVALS[0]);
  const [battleState, setBattleState] = useState<'lobby' | 'fighting' | 'victory' | 'defeat'>('lobby');
  const [turn, setTurn] = useState<'player' | 'rival'>('player');
  const [turnNumber, setTurnNumber] = useState<number>(1);

  // Combat Stats
  const [playerStats, setPlayerStats] = useState<PetCombatStats>(() =>
    calculateCombatStats(playerSpecies, playerLevel)
  );
  const [rivalStats, setRivalStats] = useState<PetCombatStats>(() =>
    calculateCombatStats(selectedRival.species, selectedRival.level)
  );

  // Skill Cooldowns
  const [skillCooldowns, setSkillCooldowns] = useState<Record<string, number>>({});
  const [potionsLeft, setPotionsLeft] = useState<number>(2);

  // Visual FX & Screen Shake
  const [screenShake, setScreenShake] = useState<boolean>(false);
  const [playerActionAnim, setPlayerActionAnim] = useState<string>('idle');
  const [rivalActionAnim, setRivalActionAnim] = useState<string>('idle');
  const [combatLog, setCombatLog] = useState<string[]>([
    'Trận đấu bắt đầu! Hãy chọn hành động chiến thuật của bạn!',
  ]);
  const [floatingDamage, setFloatingDamage] = useState<{
    id: number;
    target: 'player' | 'rival';
    text: string;
    isCrit?: boolean;
    isHeal?: boolean;
  } | null>(null);

  const playerSkills = getPetSkills(playerSpecies);
  const rivalSkills = getPetSkills(selectedRival.species);

  // Trigger floating damage text
  const showDamage = (target: 'player' | 'rival', text: string, isCrit = false, isHeal = false) => {
    const id = Date.now();
    setFloatingDamage({ id, target, text, isCrit, isHeal });
    setTimeout(() => setFloatingDamage((cur) => (cur?.id === id ? null : cur)), 1400);
  };

  // Screen shake helper
  const triggerShake = () => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 450);
  };

  // Start new match
  const handleStartBattle = (rival: BotRival) => {
    setSelectedRival(rival);
    setPlayerStats(calculateCombatStats(playerSpecies, playerLevel));
    setRivalStats(calculateCombatStats(rival.species, rival.level));
    setSkillCooldowns({});
    setPotionsLeft(2);
    setTurn('player');
    setTurnNumber(1);
    setBattleState('fighting');
    setCombatLog([
      `Đấu trường khai mạc! ${playerPetName} chạm trán ${rival.name}!`,
      'Lượt của bạn: Hãy chọn Đánh Thường, Kỹ Năng hoặc Phòng Thủ!',
    ]);
  };

  // Player Turn Action: Normal Attack
  const handlePlayerAttack = () => {
    if (turn !== 'player' || battleState !== 'fighting') return;

    sound.playClick();
    setPlayerActionAnim('run');
    setTimeout(() => setPlayerActionAnim('idle'), 600);

    // Calculate damage
    let isCrit = Math.random() < playerStats.critRate;
    let baseDmg = Math.max(12, Math.floor(playerStats.atk * 1.2 - rivalStats.def * 0.4));
    if (isCrit) baseDmg = Math.floor(baseDmg * 1.8);
    if (rivalStats.shieldPercent > 0) baseDmg = Math.floor(baseDmg * (1 - rivalStats.shieldPercent / 100));

    if (rivalStats.isDodgingNext) {
      sound.playWrong();
      showDamage('rival', 'NÉ TRÁNH! 💨', false);
      setCombatLog((prev) => [`Đối thủ né tránh hoàn toàn đòn đánh!`, ...prev.slice(0, 5)]);
      setRivalStats((prev) => ({ ...prev, isDodgingNext: false }));
    } else {
      sound.playSuccess();
      if (isCrit) triggerShake();
      showDamage('rival', `-${baseDmg} HP`, isCrit);
      const nextHp = Math.max(0, rivalStats.hp - baseDmg);

      setCombatLog((prev) => [
        `${playerPetName} tung đòn đánh thường trúng ${selectedRival.name}, gây ${baseDmg} sát thương${
          isCrit ? ' (CHÍ MẠNG!)' : ''
        }!`,
        ...prev.slice(0, 5),
      ]);

      setRivalStats((prev) => ({ ...prev, hp: nextHp }));

      if (nextHp <= 0) {
        handleVictory();
        return;
      }
    }

    endPlayerTurn();
  };

  // Player Turn Action: Use Skill
  const handlePlayerSkill = (skill: PetSkill) => {
    if (turn !== 'player' || battleState !== 'fighting') return;
    if (playerStats.mp < skill.costMp) {
      sound.playWrong();
      alert(`Không đủ MP! Cần ${skill.costMp} MP (Hiện có: ${playerStats.mp} MP). Hãy Phòng Thủ để hồi MP!`);
      return;
    }
    if ((skillCooldowns[skill.id] || 0) > 0) {
      sound.playWrong();
      alert(`Chiêu thức đang hồi phục! Cần ${skillCooldowns[skill.id]} lượt nữa!`);
      return;
    }

    sound.playCelebration();
    setPlayerActionAnim('jump');
    setTimeout(() => setPlayerActionAnim('idle'), 600);

    // Deduct MP & set Cooldown
    setPlayerStats((prev) => ({ ...prev, mp: prev.mp - skill.costMp }));
    setSkillCooldowns((prev) => ({ ...prev, [skill.id]: skill.cooldownTurns }));

    if (skill.type === 'heal') {
      const healAmount = Math.floor((playerStats.maxHp * skill.power) / 100);
      const nextHp = Math.min(playerStats.maxHp, playerStats.hp + healAmount);
      setPlayerStats((prev) => ({
        ...prev,
        hp: nextHp,
        isStunned: false,
        isFrozen: false,
        isBlind: false,
      }));
      showDamage('player', `+${healAmount} HP 💚`, false, true);
      setCombatLog((prev) => [
        `${playerPetName} thi triển [${skill.name}], hồi phục +${healAmount} HP và thanh tẩy mọi hiệu ứng xấu!`,
        ...prev.slice(0, 5),
      ]);
    } else if (skill.type === 'shield') {
      setPlayerStats((prev) => ({
        ...prev,
        shieldPercent: skill.power,
        turnsWithBuff: 2,
        reflectPercent: skill.effect === 'reflect_30' ? 30 : 0,
      }));
      showDamage('player', `KHIÊN GIÁP 🛡️`, false);
      setCombatLog((prev) => [
        `${playerPetName} kích hoạt [${skill.name}], tăng mạnh phòng ngự giảm sát thương!`,
        ...prev.slice(0, 5),
      ]);
    } else if (skill.type === 'dodge') {
      setPlayerStats((prev) => ({ ...prev, isDodgingNext: true }));
      showDamage('player', `NÉ 100% 🕊️`, false);
      setCombatLog((prev) => [
        `${playerPetName} tung [${skill.name}], sẵn sàng né tránh 100% đòn tấn công kế tiếp!`,
        ...prev.slice(0, 5),
      ]);
    } else if (skill.type === 'buff') {
      setPlayerStats((prev) => ({
        ...prev,
        atk: Math.floor(prev.atk * 1.4),
        turnsWithBuff: 3,
      }));
      showDamage('player', `TĂNG CÔNG 40% 🔥`, false);
      setCombatLog((prev) => [
        `${playerPetName} cất tiếng [${skill.name}], tăng vọt 40% sức mạnh tấn công!`,
        ...prev.slice(0, 5),
      ]);
    } else {
      // Offensive / Debuff Skill
      let baseDmg = Math.floor(playerStats.atk * (skill.power / 40) - rivalStats.def * 0.3);
      baseDmg = Math.max(25, baseDmg);
      triggerShake();
      showDamage('rival', `-${baseDmg} HP 💥`, true);

      let stunEnemy = skill.effect === 'stun' || skill.effect === 'freeze';
      let blindEnemy = skill.effect === 'blind';

      const nextHp = Math.max(0, rivalStats.hp - baseDmg);
      setRivalStats((prev) => ({
        ...prev,
        hp: nextHp,
        isStunned: stunEnemy ? true : prev.isStunned,
        isBlind: blindEnemy ? true : prev.isBlind,
      }));

      setCombatLog((prev) => [
        `${playerPetName} tung tuyệt chiêu [${skill.name}], oanh tạc ${baseDmg} sát thương thần sầu${
          stunEnemy ? ' (KHIẾN ĐỐI THỦ BỊ ĐÓNG BĂNG/CHOÁNG!)' : ''
        }!`,
        ...prev.slice(0, 5),
      ]);

      if (nextHp <= 0) {
        handleVictory();
        return;
      }
    }

    endPlayerTurn();
  };

  // Player Turn Action: Defend
  const handlePlayerDefend = () => {
    if (turn !== 'player' || battleState !== 'fighting') return;

    sound.playSuccess();
    setPlayerStats((prev) => ({
      ...prev,
      shieldPercent: 50,
      mp: Math.min(prev.maxMp, prev.mp + 20),
    }));
    showDamage('player', '+20 MP 🛡️', false);

    setCombatLog((prev) => [
      `${playerPetName} vào thế thủ kiên cố, giảm 50% sát thương lượt tới và hồi +20 MP!`,
      ...prev.slice(0, 5),
    ]);

    endPlayerTurn();
  };

  // Player Turn Action: Drink Potion
  const handlePlayerPotion = () => {
    if (turn !== 'player' || battleState !== 'fighting') return;
    if (potionsLeft <= 0) {
      alert('Bạn đã dùng hết bình thuốc hồi phục trong trận này!');
      return;
    }

    sound.playCelebration();
    const healVal = Math.floor(playerStats.maxHp * 0.4);
    setPotionsLeft((p) => p - 1);
    setPlayerStats((prev) => ({
      ...prev,
      hp: Math.min(prev.maxHp, prev.hp + healVal),
    }));
    showDamage('player', `+${healVal} HP 🧪`, false, true);

    setCombatLog((prev) => [
      `${playerPetName} uống Thần Dược Hồi Phục, hồi +${healVal} HP! (Còn ${potionsLeft - 1} bình)`,
      ...prev.slice(0, 5),
    ]);

    endPlayerTurn();
  };

  // End Player Turn -> AI Turn
  const endPlayerTurn = () => {
    setTurn('rival');

    // Reduce Cooldowns
    setSkillCooldowns((prev) => {
      const next: Record<string, number> = {};
      Object.entries(prev).forEach(([k, v]) => {
        if (v > 1) next[k] = v - 1;
      });
      return next;
    });

    // Schedule AI move after 1.1s delay
    setTimeout(() => {
      runRivalTurn();
    }, 1100);
  };

  // AI Rival Turn Logic
  const runRivalTurn = () => {
    setRivalActionAnim('run');
    setTimeout(() => setRivalActionAnim('idle'), 600);

    // Check if rival is stunned or frozen
    if (rivalStats.isStunned || rivalStats.isFrozen) {
      sound.playWrong();
      showDamage('rival', 'BỊ BẤT ĐỘNG! ❄️', false);
      setCombatLog((prev) => [
        `${selectedRival.name} đang bị đóng băng/choáng váng, không thể hành động!`,
        ...prev.slice(0, 5),
      ]);
      setRivalStats((prev) => ({ ...prev, isStunned: false, isFrozen: false }));
      startNextPlayerTurn();
      return;
    }

    // AI Decision: 35% chance to use skill if MP available, else normal attack
    const usableSkill = rivalSkills.find((s) => rivalStats.mp >= s.costMp);
    if (usableSkill && Math.random() < 0.45) {
      sound.playSuccess();
      setRivalStats((prev) => ({ ...prev, mp: prev.mp - usableSkill.costMp }));

      if (usableSkill.type === 'heal') {
        const heal = Math.floor((rivalStats.maxHp * usableSkill.power) / 100);
        setRivalStats((prev) => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + heal) }));
        showDamage('rival', `+${heal} HP 💚`, false, true);
        setCombatLog((prev) => [
          `${selectedRival.name} sử dụng [${usableSkill.name}], hồi phục +${heal} HP!`,
          ...prev.slice(0, 5),
        ]);
      } else {
        let dmg = Math.floor(rivalStats.atk * (usableSkill.power / 45) - playerStats.def * 0.35);
        dmg = Math.max(18, dmg);

        if (playerStats.isDodgingNext) {
          showDamage('player', 'NÉ TRÁNH! 💨', false);
          setCombatLog((prev) => [
            `${playerPetName} lướt gió né tránh hoàn toàn chiêu thức của ${selectedRival.name}!`,
            ...prev.slice(0, 5),
          ]);
          setPlayerStats((prev) => ({ ...prev, isDodgingNext: false }));
        } else {
          if (playerStats.shieldPercent > 0) dmg = Math.floor(dmg * (1 - playerStats.shieldPercent / 100));
          triggerShake();
          showDamage('player', `-${dmg} HP ⚡`, true);
          const nextHp = Math.max(0, playerStats.hp - dmg);
          setPlayerStats((prev) => ({ ...prev, hp: nextHp }));

          setCombatLog((prev) => [
            `${selectedRival.name} tung chiêu [${usableSkill.name}], đánh trúng ${playerPetName} gây ${dmg} sát thương!`,
            ...prev.slice(0, 5),
          ]);

          if (nextHp <= 0) {
            handleDefeat();
            return;
          }
        }
      }
    } else {
      // Normal attack
      let isCrit = Math.random() < 0.15;
      let dmg = Math.max(10, Math.floor(rivalStats.atk * 1.1 - playerStats.def * 0.4));
      if (isCrit) dmg = Math.floor(dmg * 1.6);

      if (playerStats.isDodgingNext) {
        showDamage('player', 'NÉ TRÁNH! 💨', false);
        setCombatLog((prev) => [
          `${playerPetName} nhẹ nhàng né đòn của đối thủ!`,
          ...prev.slice(0, 5),
        ]);
        setPlayerStats((prev) => ({ ...prev, isDodgingNext: false }));
      } else {
        if (playerStats.shieldPercent > 0) dmg = Math.floor(dmg * (1 - playerStats.shieldPercent / 100));
        showDamage('player', `-${dmg} HP`, isCrit);
        const nextHp = Math.max(0, playerStats.hp - dmg);
        setPlayerStats((prev) => ({ ...prev, hp: nextHp }));

        setCombatLog((prev) => [
          `${selectedRival.name} tấn công thường, gây ${dmg} sát thương!`,
          ...prev.slice(0, 5),
        ]);

        if (nextHp <= 0) {
          handleDefeat();
          return;
        }
      }
    }

    startNextPlayerTurn();
  };

  const startNextPlayerTurn = () => {
    // Reset temporary shield
    setPlayerStats((prev) => ({
      ...prev,
      shieldPercent: 0,
      mp: Math.min(prev.maxMp, prev.mp + 8), // Passive MP regen each turn
    }));
    setTurn('player');
    setTurnNumber((t) => t + 1);
  };

  // Victory Handler
  const handleVictory = async () => {
    sound.playCelebration();
    confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
    setBattleState('victory');

    onUpdateCoins(userCoins + selectedRival.coinReward);
    onUpdatePetExp?.(selectedRival.expReward);

    try {
      await fetch('/api/pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'claim_pvp_reward',
          rewardCoins: selectedRival.coinReward,
          rewardExp: selectedRival.expReward,
        }),
      });
    } catch {}
  };

  // Defeat Handler
  const handleDefeat = () => {
    sound.playWrong();
    setBattleState('defeat');
  };

  return (
    <div className="w-full flex flex-col gap-3 select-none">
      {/* ================= LOBBY: SELECT RIVAL ================= */}
      {battleState === 'lobby' && (
        <div className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 rounded-3xl border-3 border-indigo-500/50 shadow-2xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-3xl shadow-inner">
                ⚔️
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-indigo-300 flex items-center gap-2">
                  <span>Đấu Trường Quyết Đấu Thú Cưng (PvP Arena)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black">
                    Đấu Trường Meowlish
                  </span>
                </h3>
                <p className="text-xs text-indigo-200/80 font-medium">
                  Chiến đấu theo lượt với bộ kỹ năng độc quyền của từng loài linh thú, giật Cúp Vinh Quang!
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PVP_BOT_RIVALS.map((rival) => (
              <div
                key={rival.id}
                className="p-3.5 rounded-2xl bg-slate-800/80 border-2 border-indigo-500/30 hover:border-amber-400 hover:bg-slate-800 transition flex flex-col justify-between group shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-900 text-indigo-200 border border-indigo-400/30 uppercase">
                      {rival.difficulty}
                    </span>
                    <span className="text-xs font-bold text-amber-300">
                      🪙 +{rival.coinReward} xu
                    </span>
                  </div>
                  <div className="w-20 h-20 mx-auto flex items-center justify-center my-1 group-hover:scale-110 transition-transform">
                    <PixelPetSprite species={rival.species} scale={1.5} animationState="happy" />
                  </div>
                  <h4 className="font-black text-sm text-center text-white mt-1">{rival.name}</h4>
                  <p className="text-[11px] text-center text-indigo-300/80 font-medium">{rival.title}</p>
                </div>

                <button
                  onClick={() => handleStartBattle(rival)}
                  className="w-full mt-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Swords className="w-4 h-4" />
                  <span>Thách Đấu Ngay</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= ACTIVE COMBAT ARENA ================= */}
      {battleState === 'fighting' && (
        <div
          className={`relative rounded-3xl overflow-hidden border-3 border-amber-500/60 shadow-2xl flex flex-col justify-between transition-transform duration-100 ${
            screenShake ? 'scale-102 translate-x-1 -translate-y-1' : ''
          }`}
          style={{
            minHeight: '440px',
            background: 'radial-gradient(ellipse at center, #1e1b4b 0%, #0f172a 70%, #020617 100%)',
          }}
        >
          {/* Sân Đấu Pixel Background with Spotlights */}
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#6366f1_1px,transparent_1px)] bg-[size:16px_16px]" />
          <div className="absolute top-0 left-1/4 w-32 h-64 bg-amber-400/10 blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-1/4 w-32 h-64 bg-cyan-400/10 blur-3xl pointer-events-none" />

          {/* Sân Đấu Ring Circle */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-4/5 h-28 rounded-full border-2 border-indigo-400/30 bg-indigo-950/40 transform -rotate-1 pointer-events-none" />

          {/* Top HUD: Both Pets Stats Bars */}
          <div className="p-3 sm:p-4 grid grid-cols-2 gap-3 sm:gap-6 z-10">
            {/* Player Pet HUD (Left) */}
            <div className="bg-slate-900/85 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-emerald-500/50 shadow-md">
              <div className="flex items-center justify-between mb-1">
                <span className="font-black text-xs sm:text-sm text-emerald-300 truncate">
                  {playerPetName}
                </span>
                <span className="text-[10px] font-bold text-slate-300">Lv.{playerLevel}</span>
              </div>

              {/* HP Bar */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px] font-bold text-slate-300">
                  <span>HP</span>
                  <span>
                    {playerStats.hp} / {playerStats.maxHp}
                  </span>
                </div>
                <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-300 rounded-full"
                    style={{ width: `${Math.max(0, (playerStats.hp / playerStats.maxHp) * 100)}%` }}
                  />
                </div>
              </div>

              {/* MP Bar */}
              <div className="space-y-0.5 mt-1.5">
                <div className="flex justify-between text-[10px] font-bold text-slate-300">
                  <span>MP</span>
                  <span>
                    {playerStats.mp} / {playerStats.maxMp}
                  </span>
                </div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-300 rounded-full"
                    style={{ width: `${Math.max(0, (playerStats.mp / playerStats.maxMp) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Rival Pet HUD (Right) */}
            <div className="bg-slate-900/85 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-rose-500/50 shadow-md text-right">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-300">Lv.{selectedRival.level}</span>
                <span className="font-black text-xs sm:text-sm text-rose-300 truncate">
                  {selectedRival.name}
                </span>
              </div>

              {/* HP Bar */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px] font-bold text-slate-300">
                  <span>
                    {rivalStats.hp} / {rivalStats.maxHp}
                  </span>
                  <span>HP</span>
                </div>
                <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-l from-rose-500 to-amber-500 transition-all duration-300 rounded-full"
                    style={{ width: `${Math.max(0, (rivalStats.hp / rivalStats.maxHp) * 100)}%` }}
                  />
                </div>
              </div>

              {/* MP Bar */}
              <div className="space-y-0.5 mt-1.5">
                <div className="flex justify-between text-[10px] font-bold text-slate-300">
                  <span>
                    {rivalStats.mp} / {rivalStats.maxMp}
                  </span>
                  <span>MP</span>
                </div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-l from-indigo-500 to-purple-400 transition-all duration-300 rounded-full"
                    style={{ width: `${Math.max(0, (rivalStats.mp / rivalStats.maxMp) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sàn Đấu 2D Characters Showcase */}
          <div className="relative flex-1 flex items-center justify-between px-8 sm:px-20 z-10">
            {/* Player Pet Sprite */}
            <div className="relative flex flex-col items-center">
              {floatingDamage?.target === 'player' && (
                <div
                  className={`absolute -top-10 font-black text-lg sm:text-xl drop-shadow-lg animate-bounce ${
                    floatingDamage.isHeal ? 'text-green-400' : 'text-rose-400'
                  }`}
                >
                  {floatingDamage.text}
                </div>
              )}
              <div className="transform hover:scale-110 transition-transform">
                <PixelPetSprite
                  species={playerSpecies}
                  scale={2.2}
                  animationState={playerActionAnim as any}
                  facing="right"
                />
              </div>
              <div className="w-20 h-4 rounded-full bg-black/40 blur-xs mt-1" />
            </div>

            {/* VS Emblem in Center */}
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-black italic bg-gradient-to-b from-amber-300 to-amber-600 bg-clip-text text-transparent drop-shadow-lg">
                VS
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 mt-1">
                Lượt {turnNumber}
              </span>
            </div>

            {/* Rival Pet Sprite */}
            <div className="relative flex flex-col items-center">
              {floatingDamage?.target === 'rival' && (
                <div
                  className={`absolute -top-10 font-black text-lg sm:text-xl drop-shadow-lg animate-bounce ${
                    floatingDamage.isHeal ? 'text-green-400' : floatingDamage.isCrit ? 'text-amber-300' : 'text-rose-400'
                  }`}
                >
                  {floatingDamage.text}
                </div>
              )}
              <div className="transform hover:scale-110 transition-transform">
                <PixelPetSprite
                  species={selectedRival.species}
                  scale={2.2}
                  animationState={rivalActionAnim as any}
                  facing="left"
                />
              </div>
              <div className="w-20 h-4 rounded-full bg-black/40 blur-xs mt-1" />
            </div>
          </div>

          {/* Combat Log Strip */}
          <div className="px-4 py-1.5 bg-black/60 border-y border-indigo-500/30 text-center text-xs font-bold text-amber-200 truncate z-10">
            💬 {combatLog[0] || 'Lượt quyết đấu!'}
          </div>

          {/* Bottom Action Deck */}
          <div className="p-3 bg-slate-950/90 backdrop-blur-md border-t-2 border-indigo-500/40 z-10 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
            {/* Left: 4 Battle Commands */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto flex-1">
              {/* 1. Attack */}
              <button
                onClick={handlePlayerAttack}
                disabled={turn !== 'player'}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
              >
                <Swords className="w-4 h-4" />
                <span>Đánh Thường</span>
              </button>

              {/* 2. Defend */}
              <button
                onClick={handlePlayerDefend}
                disabled={turn !== 'player'}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
              >
                <Shield className="w-4 h-4" />
                <span>Thế Thủ (+MP)</span>
              </button>

              {/* 3. Potion */}
              <button
                onClick={handlePlayerPotion}
                disabled={turn !== 'player' || potionsLeft <= 0}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
              >
                <Heart className="w-4 h-4 text-rose-300" />
                <span>Hồi Phục (x{potionsLeft})</span>
              </button>

              {/* Surrender / Flee */}
              <button
                onClick={() => setBattleState('lobby')}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 border border-slate-700"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Rút Lui</span>
              </button>
            </div>

            {/* Right: Signature Skills Deck */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto py-1">
              {playerSkills.map((skill) => {
                const cd = skillCooldowns[skill.id] || 0;
                const canCast = turn === 'player' && playerStats.mp >= skill.costMp && cd === 0;

                return (
                  <button
                    key={skill.id}
                    onClick={() => handlePlayerSkill(skill)}
                    disabled={!canCast}
                    className={`py-2 px-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between shrink-0 min-w-[130px] ${
                      canCast
                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-300 shadow-md active:scale-95'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700 opacity-60 cursor-not-allowed'
                    }`}
                    title={skill.description}
                  >
                    <div className="flex items-center justify-between text-[10px] font-black w-full">
                      <span>{skill.icon}</span>
                      <span>{skill.costMp} MP</span>
                    </div>
                    <div className="font-black text-xs truncate mt-0.5">{skill.name}</div>
                    {cd > 0 && <span className="text-[9px] text-rose-400 font-bold">Hồi: {cd} lượt</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= VICTORY MODAL ================= */}
      {battleState === 'victory' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-b from-amber-950 via-slate-900 to-slate-950 border-4 border-amber-400 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl text-white">
            <div className="w-20 h-20 mx-auto rounded-full bg-amber-400/20 border-2 border-amber-300 flex items-center justify-center text-5xl shadow-inner animate-bounce">
              🏆
            </div>
            <div>
              <h3 className="text-xl font-black text-amber-300 tracking-wide uppercase">Đại Thắng Vinh Quang!</h3>
              <p className="text-xs text-amber-100/80 mt-1">
                {playerPetName} đã đánh bại {selectedRival.name} trong trận quyết đấu nảy lửa!
              </p>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-2xl border border-amber-500/30 flex items-center justify-around text-sm font-black">
              <div className="flex items-center gap-1.5 text-amber-300">
                <span>🪙</span>
                <span>+{selectedRival.coinReward} Coins</span>
              </div>
              <div className="flex items-center gap-1.5 text-purple-300">
                <span>✨</span>
                <span>+{selectedRival.expReward} EXP</span>
              </div>
            </div>

            <button
              onClick={() => setBattleState('lobby')}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-sm shadow-md hover:scale-102 active:scale-95 transition cursor-pointer"
            >
              Nhận Thưởng & Trở Về Sảnh
            </button>
          </div>
        </div>
      )}

      {/* ================= DEFEAT MODAL ================= */}
      {battleState === 'defeat' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border-4 border-rose-500 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl text-white">
            <div className="text-5xl">💔</div>
            <div>
              <h3 className="text-lg font-black text-rose-400 uppercase">Thất Bại Đáng Tiếc!</h3>
              <p className="text-xs text-slate-400 mt-1">
                {selectedRival.name} quá mạnh mẽ! Hãy chăm sóc thú cưng, cho ăn no nê và luyện thêm bài học tiếng Anh để gia tăng cấp độ nhé!
              </p>
            </div>

            <button
              onClick={() => setBattleState('lobby')}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-sm border border-slate-600 transition cursor-pointer"
            >
              Trở Lại Sảnh Đấu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
