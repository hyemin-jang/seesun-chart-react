import * as d3 from 'd3';

import type { AxisScale } from '.';

type Category = { id: string, label: string };

type AxisScaleCategoricalDomain = Category[];

interface AxisScaleCategoricalConfig {
  padding?: number;
}

export default function axisScaleCategorical(
  domain: AxisScaleCategoricalDomain,
  config?: AxisScaleCategoricalConfig,
): AxisScale<'categorical'> {
  const {
    padding = 0,
  } = config || {};

  const scalePoint = d3.scalePoint()
    .domain(domain.map(({ id }) => id))
    .padding(padding);

  function axisScale(v: Category['id']) {
    return scalePoint(v) as number;
  }

  axisScale.ticks = function () {
    return domain.map((category) => ({
      value: category.id,
      label: category.label,
    }));
  };

  function range(): [number, number];
  function range(_range: [number, number]): void;
  function range(this: AxisScale<'categorical'>, _range?: [number, number]) {
    if (_range) {
      scalePoint.range(_range);
      return this;
    }
    return scalePoint.range();
  }
  axisScale.range = range;

  return axisScale;
}

export type {
  AxisScaleCategoricalConfig,
  AxisScaleCategoricalDomain,
};
