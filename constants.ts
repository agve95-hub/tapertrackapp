import { ScheduleItem, TaperStep } from "./types";

export const TAPER_SCHEDULE: TaperStep[] = [
  { weeks: "1–2", dose: 5.0, notes: "Baseline: Ensure you are stable here first." },
  { weeks: "3–4", dose: 4.5, notes: "~10% reduction. Hold until stable." },
  { weeks: "5–6", dose: 4.0, notes: "Hold until stable." },
  { weeks: "7–8", dose: 3.6, notes: "Hold until stable." },
  { weeks: "9–10", dose: 3.2, notes: "Hold until stable." },
  { weeks: "11–12", dose: 2.9, notes: "Hold until stable." },
  { weeks: "13–14", dose: 2.6, notes: "Hold until stable." },
  { weeks: "15–16", dose: 2.3, notes: "Hold until stable." },
  { weeks: "17–18", dose: 2.0, notes: "Critical Zone: Reductions feel heavier here.", isCritical: true },
  { weeks: "19+", dose: "Below 2.0", notes: "Reduce by 0.1 mg or 0.2 mg every 2–4 weeks." },
];

export const DAILY_SCHEDULE: ScheduleItem[] = [
  {
    id: "morning_0800",
    time: "08:00",
    label: "Morning",
    items: [
      "Lexapro (current taper dose)",
      "Benzo (full daily dose)",
      "Omega 3-6-9",
      "Vitamin D3",
      "Vitamin C"
    ],
    notes: [
      "Take with breakfast and water",
      "Avoid caffeine spikes",
      "Do not skip or delay doses"
    ],
    requiresBP: true
  },
  {
    id: "midday_1200",
    time: "12:00",
    label: "Midday",
    items: [
      "B-Complex",
      "Zinc"
    ],
    notes: [
      "Take every other day",
      "Normal meals and hydration",
      "Smoking as usual during SSRI taper"
    ]
  },
  {
    id: "afternoon_1500",
    time: "15:00",
    label: "Afternoon",
    items: [
      "L-theanine (low dose)"
    ],
    notes: [
      "Only if anxiety increases",
      "Do not stack doses",
      "Avoid if sedated"
    ],
    conditional: true
  },
  {
    id: "evening_2000",
    time: "20:00",
    label: "Evening",
    items: [
      "Magnesium glycinate"
    ],
    notes: [
      "2–3 hrs before bed",
      "Avoid alcohol",
      "Reduce if daytime sedation occurs"
    ]
  },
  {
    id: "night_bedtime",
    time: "Night",
    label: "Bedtime",
    items: [
      "Nothing"
    ],
    notes: [
      "Screens dimmed",
      "Same bedtime nightly"
    ],
    requiresBP: true
  }
];