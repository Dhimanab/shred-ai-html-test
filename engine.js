// ============================================================
// SHRED — OFFLINE CALORIE / MACRO ENGINE  (no network, pure math)
// ============================================================

// Mifflin-St Jeor BMR
export function bmr({ weightKg, heightCm, age, sex }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === "male" ? base + 5 : base - 161);
}

export const ACTIVITY = {
  sedentary:   { mult: 1.2,   label: "Sedentary (desk job, little exercise)" },
  light:       { mult: 1.375, label: "Light (1–3 workouts/week)" },
  moderate:    { mult: 1.55,  label: "Moderate (3–5 workouts/week)" },
  active:      { mult: 1.725, label: "Active (6–7 workouts/week)" },
  very_active: { mult: 1.9,   label: "Very active (athlete / physical job)" },
};

export const GOALS = {
  cut:      { label: "Lose fat (cut)",     offset: -0.20, proteinPerKg: 2.0, desc: "20% deficit" },
  cut_mild: { label: "Lose fat slowly",    offset: -0.12, proteinPerKg: 2.0, desc: "12% deficit" },
  maintain: { label: "Maintain",           offset: 0.0,   proteinPerKg: 1.8, desc: "maintenance" },
  lean:     { label: "Lean bulk",          offset: 0.10,  proteinPerKg: 1.8, desc: "10% surplus" },
  bulk:     { label: "Gain muscle (bulk)", offset: 0.15,  proteinPerKg: 1.6, desc: "15% surplus" },
};

// Full nutrition target from profile
export function computeTargets(profile) {
  const b = bmr(profile);
  const tdee = Math.round(b * (ACTIVITY[profile.activity]?.mult || 1.55));
  const goal = GOALS[profile.goal] || GOALS.cut;
  const calories = Math.round(tdee * (1 + goal.offset));

  // Macros
  const proteinG = Math.round(profile.weightKg * goal.proteinPerKg);
  const fatG = Math.round((calories * 0.25) / 9);          // 25% cals from fat
  const proteinCals = proteinG * 4, fatCals = fatG * 9;
  const carbG = Math.max(0, Math.round((calories - proteinCals - fatCals) / 4));

  // Water (ml) ~ 35ml/kg
  const waterMl = Math.round(profile.weightKg * 35);

  // Estimated weekly weight change (kg) — 7700 kcal ≈ 1 kg
  const dailyDelta = calories - tdee;
  const weeklyKg = +((dailyDelta * 7) / 7700).toFixed(2);

  return { bmr: b, tdee, calories, proteinG, fatG, carbG, waterMl, weeklyKg, goalLabel: goal.label, goalDesc: goal.desc };
}

// Recompute calories as the user's weight changes over time (re-feed latest weight)
export function retargetForWeight(profile, latestWeightKg) {
  return computeTargets({ ...profile, weightKg: latestWeightKg });
}

// Weeks to goal estimate
export function weeksToGoal(currentKg, goalKg, weeklyKg) {
  if (!weeklyKg || Math.sign(goalKg - currentKg) !== Math.sign(weeklyKg)) return null;
  return Math.ceil(Math.abs((goalKg - currentKg) / weeklyKg));
}

// BMI for context (not a target, just info)
export function bmi(weightKg, heightCm) {
  const m = heightCm / 100;
  return +(weightKg / (m * m)).toFixed(1);
}

// ── Unit helpers ─────────────────────────────────────────────
export const lbToKg = lb => +(lb * 0.453592).toFixed(1);
export const kgToLb = kg => +(kg / 0.453592).toFixed(1);
export const ftInToCm = (ft, inch) => Math.round((ft * 12 + inch) * 2.54);
export const cmToFtIn = cm => { const t = cm / 2.54; return { ft: Math.floor(t / 12), inch: Math.round(t % 12) }; };
