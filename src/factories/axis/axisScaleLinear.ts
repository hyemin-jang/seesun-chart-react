import * as d3 from 'd3';
import { isNumber } from 'lodash';

import type { AxisScale } from '.';

type AxisScaleLinearDomain = [
  number | undefined | null,
  number | undefined | null,
];

interface AxisScaleLinearConfig {
  minValue?: number | 'auto';
  maxValue?: number | 'auto';
  tickPreferredCount?: number;
  formatTickValue?: (v: number) => string;
}

export default function axisScaleLinear(
  domain: AxisScaleLinearDomain,
  config?: AxisScaleLinearConfig,
): AxisScale<'linear'> {
  const startValue = domain[0] || 0;
  const endValue = domain[1] || 1;
  const {
    minValue,
    maxValue,
    tickPreferredCount = 6,
    formatTickValue = (v: number) => new Intl.NumberFormat().format(v),
  } = config || {};

  const [autoMinValue, autoMaxValue] = d3.nice(
    startValue,
    endValue,
    tickPreferredCount,
  );
  const autoTickStep = d3.tickStep(
    autoMinValue,
    autoMaxValue,
    tickPreferredCount,
  );

  const min = (
    isNumber(minValue)
      ? minValue
      : minValue === 'auto'
        ? startValue - autoMinValue < autoTickStep / 4
          ? autoMinValue - autoTickStep
          : autoMinValue
        : startValue < 0
          ? startValue
          : 0
  );
  const max = (
    isNumber(maxValue)
      ? maxValue
      : maxValue === 'auto'
        ? autoMaxValue - endValue < autoTickStep / 4
          ? autoMaxValue + autoTickStep
          : autoMaxValue
        : endValue <= 0
          ? 0
          : endValue
  );

  const scaleLinear = d3.scaleLinear()
    .domain([min, max])
    .nice(tickPreferredCount);

  function axisScale(v: d3.NumberValue) {
    return scaleLinear(v);
  }

  axisScale.ticks = function () {
    return scaleLinear.ticks(tickPreferredCount).map((v) => ({
      value: v,
      label: formatTickValue(v),
    }));
  };

  function range(): [number, number];
  function range(_range: [number, number]): void;
  function range(this: AxisScale<'linear'>, _range?: [number, number]) {
    if (_range) {
      scaleLinear.range(_range);
      return this;
    }
    return scaleLinear.range();
  }
  axisScale.range = range;

  return axisScale;
}

export type {
  AxisScaleLinearDomain,
  AxisScaleLinearConfig,
};
