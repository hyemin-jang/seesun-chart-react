export type Color = Exclude<React.CSSProperties['color'], undefined>;

export type DateString = string; // "YYYY-MM-DD";

export type DateInterval = 'day' | 'week' | 'month' | 'year';

export type Bounds = {
  top: number;
  left: number;
  bottom: number;
  right: number
};
