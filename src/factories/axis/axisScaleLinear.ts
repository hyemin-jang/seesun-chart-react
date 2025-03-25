import * as d3 from 'd3';
import { isNumber } from 'lodash';

import type { AxisScale } from '.';

type AxisScaleLinearDomain = [number, number];

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
  const {
    minValue,
    maxValue,
    tickPreferredCount = 6,
    formatTickValue = (v: number) => new Intl.NumberFormat().format(v),
  } = config || {};

  const [autoMinValue, autoMaxValue] = d3.nice(
    domain[0],
    domain[1],
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
        ? domain[0] - autoMinValue < autoTickStep / 4
          ? autoMinValue - autoTickStep
          : autoMinValue
        : isNumber(domain[0]) && domain[0] < 0
          ? domain[0]
          : 0
  );
  const max = (
    isNumber(maxValue)
      ? maxValue
      : maxValue === 'auto'
        ? autoMaxValue - domain[1] < autoTickStep / 4
          ? autoMaxValue + autoTickStep
          : autoMaxValue
        : domain[1] <= 0
          ? 0
          : domain[1] || 1
  );

  const scaleLinear = d3.scaleLinear()
    .domain(
      minValue !== 'auto' && min === max
        ? [min, max + 1]
        : [min, max],
    )
    .nice(tickPreferredCount);

  function axisScale(v: number) {
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
  function range(this: AxisScale<'categorical'>, _range?: [number, number]) {
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
