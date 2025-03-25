import * as d3 from 'd3';

import {
  durationDay,
  durationWeek,
  durationMonth,
  durationYear,
} from '../../constants/time';
import { DateInterval, DateString } from '../../types';

import type { AxisScale } from '.';

type AxisScaleTimeDomain = [DateString, DateString];

interface AxisScaleTimeConfig {
  start?: DateString;
  end?: DateString;
  tickPreferredInterval?: DateInterval;
  formatTickTime?: (time: DateString | Date) => string;
}

type TickIntervalOption = {
  interval: d3.CountableTimeInterval,
  step: number,
  duration: number
};

const timeIntervalByInterval = {
  day: d3.utcDay,
  week: d3.utcWeek,
  month: d3.utcMonth,
  year: d3.utcYear,
};

const tickIntervalOptions: TickIntervalOption[] = [
  { interval: d3.utcDay, step: 1, duration: durationDay },
  { interval: d3.utcDay, step: 1, duration: durationDay },
  { interval: d3.utcWeek, step: 1, duration: durationWeek },
  { interval: d3.utcMonth, step: 1, duration: durationMonth },
  { interval: d3.utcMonth, step: 3, duration: durationMonth * 3 },
  { interval: d3.utcMonth, step: 6, duration: durationMonth * 6 },
  { interval: d3.utcYear, step: 1, duration: durationYear },
];

function getTicks(
  start: Date,
  end: Date,
  count: number,
) {
  if (!start || !end) return [];

  const reverse = start > end;
  if (reverse) {
    // eslint-disable-next-line no-param-reassign
    [start, end] = [end, start];
  }
  const targetDuration = Math.abs(+end - +start) / count;
  if (!targetDuration) return [start];

  let tickInterval: d3.TimeInterval | null;

  const i = d3.bisector<TickIntervalOption, number>(
    (option) => option.duration,
  ).right(tickIntervalOptions, targetDuration);
  if (i === 0) {
    tickInterval = tickIntervalOptions[0].interval.every(1);
  } else if (i === tickIntervalOptions.length) { // If current tick interval is larger than 1 year
    const yearStep = Math.ceil(targetDuration / durationYear);
    tickInterval = tickIntervalOptions[tickIntervalOptions.length - 1].interval.every(yearStep);
  } else {
    const index = (
      targetDuration / tickIntervalOptions[i - 1].step < tickIntervalOptions[i].step / targetDuration
        ? i - 1
        : i
    );
    const { interval, step } = tickIntervalOptions[index];
    tickInterval = interval.every(step);
  }

  // If the calculated tick interval is weekly, set it based on the day of the week of the start date of the scale.
  if (tickInterval === d3.utcWeek) {
    tickInterval = [
      d3.utcSunday,
      d3.utcMonday,
      d3.utcTuesday,
      d3.utcWednesday,
      d3.utcThursday,
      d3.utcFriday,
      d3.utcSaturday,
    ][start.getUTCDay()];
  }
  const ticks = tickInterval ? tickInterval.range(start, new Date(+end + 1)) : [];

  return reverse ? ticks.reverse() : ticks;
}

function defaultFormatTicks(
  ticks: Date[],
) {
  const [start, end] = d3.extent(ticks, (tick: Date) => tick);
  const scale = d3.scaleUtc()
    .domain(start && end ? [start, end] : []);
  return (
    ticks.map((tick, i) => {
      const prevDate = ticks[i - 1];
      const tickFormat = (
        i === 0
          ? (
            ticks.length > scale.ticks(d3.utcMonth).length
              ? '%b %d'
              : ticks.length > scale.ticks(d3.utcYear).length && tick.getUTCMonth() !== 0
                ? '%b'
                : '%Y'
          )
          : (
            prevDate.getUTCFullYear() !== tick.getUTCFullYear()
              ? '%Y'
              : prevDate.getUTCMonth() !== tick.getUTCMonth()
                ? (
                  ticks.length > scale.ticks(d3.utcMonth).length
                    ? '%b %d'
                    : '%b'
                )
                : '%b %d'
          )
      );
      return d3.utcFormat(tickFormat)(tick);
    })
  );
}

export default function axisScaleTime(
  domain: AxisScaleTimeDomain,
  config?: AxisScaleTimeConfig,
): AxisScale<'time'> {
  const {
    start,
    end,
    tickPreferredInterval,
    formatTickTime,
  } = config || {};
  const startDate = (start || domain[0]) ? new Date(start || domain[0]) : null;
  const endDate = (end || domain[1]) ? new Date(end || domain[1]) : null;
  const formatTicks = (ticks: Date[]) => (
    formatTickTime
      ? ticks.map((tick) => formatTickTime(tick))
      : defaultFormatTicks(ticks)
  );

  const scaleUtc = d3.scaleUtc()
    .domain(startDate && endDate ? [startDate, endDate] : []);

  function axisScale(v: Date) {
    return scaleUtc(v);
  }

  axisScale.ticks = function () {
    const [rangeStart, rangeEnd] = scaleUtc.range();
    const defaultScaleUtcTicks = (
      tickPreferredInterval
        ? scaleUtc.ticks(timeIntervalByInterval[tickPreferredInterval])
        : scaleUtc.ticks()
    );
    const maxWidthTick = d3.greatest(
      formatTicks(defaultScaleUtcTicks),
      (formattedTicks: string) => formattedTicks.length,
    );
    const maxWidthTickText = d3.select('svg').append('text').text(maxWidthTick || '');
    const maxTickWidth = maxWidthTickText.node()?.getBBox().width || 0;
    const count = (rangeEnd - rangeStart) / maxTickWidth;
    const tickValues = startDate && endDate ? getTicks(startDate, endDate, count) : [];
    const tickLabels = formatTicks(tickValues);

    maxWidthTickText.remove();

    return tickValues.map((v, i) => ({
      value: v,
      label: tickLabels[i],
    }));
  };

  function range(): [number, number];
  function range(_range: [number, number]): void;
  function range(this: AxisScale<'categorical'>, _range?: [number, number]) {
    if (_range) {
      scaleUtc.range(_range);
      return this;
    }
    return scaleUtc.range();
  }
  axisScale.range = range;

  return axisScale;
}

export type {
  AxisScaleTimeDomain,
  AxisScaleTimeConfig,
};
