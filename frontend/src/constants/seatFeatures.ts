// Seat features constants and metadata (labels/icons)
export const SEAT_FEATURES = {
  POWER: 'power',
  WINDOW: 'window',
  NEAR_EXIT: 'near_exit',
} as const;

export type SeatFeature = typeof SEAT_FEATURES[keyof typeof SEAT_FEATURES];

export const FEATURE_META: Record<SeatFeature, { label: string; icon?: string }> = {
  power: { label: '电源' },
  window: { label: '靠窗' },
  near_exit: { label: '靠门' },
};

export const ALL_FEATURE_KEYS = Object.values(SEAT_FEATURES) as SeatFeature[];
