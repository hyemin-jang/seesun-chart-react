import * as d3 from 'd3';

import { Bounds } from '../../types';
import axisFactory, {
  axisScaleCategorical,
  axisScaleLinear,
  axisScaleTime,
  type AxisScaleType,
  type AxisOrient,
  type AxisConfig as BaseAxisConfig,
  type AxisScaleCategoricalDomain,
  type AxisScaleCategoricalConfig,
  type AxisScaleLinearDomain,
  type AxisScaleLinearConfig,
  type AxisScaleTimeDomain,
  type AxisScaleTimeConfig,
  type AxisScale,
} from '../axis';

type AxisProps<TAxisScaleType extends AxisScaleType = AxisScaleType> = (
  TAxisScaleType extends 'categorical'
  ? {
    scaleType: 'categorical';
    domain: AxisScaleCategoricalDomain;
    config?: AxisScaleCategoricalConfig & BaseAxisConfig;
    orient?: AxisOrient;
  }
  : TAxisScaleType extends 'linear'
  ? {
    scaleType: 'linear';
    domain: AxisScaleLinearDomain;
    config?: AxisScaleLinearConfig & BaseAxisConfig;
    orient?: AxisOrient;
  }
  : TAxisScaleType extends 'time'
  ? {
    scaleType: 'time';
    domain: AxisScaleTimeDomain;
    config?: AxisScaleTimeConfig & BaseAxisConfig;
    orient?: AxisOrient;
  }
  : never
);

const MARGIN = 10;

export default function xyAxisFactory({
  xAxis: propXAxis,
  yAxis: propYAxis,
}: {
  xAxis: AxisProps,
  yAxis: AxisProps,
}) {
  let root: d3.Selection<SVGSVGElement, any, any, any>;
  let bounds: Bounds;
  const xAxisObj = { ...propXAxis };
  const yAxisObj = { ...propYAxis };

  function draw(
    propRoot: d3.Selection<SVGSVGElement, any, any, any>,
  ) {
    root = propRoot;
    if (!bounds) {
      const { top = 0, left = 0, bottom = 0, right = 0 } = root.node()?.getBBox() || {};
      bounds = { top, left, bottom, right };
    }

    const xScale: AxisScale<typeof xAxisObj.scaleType> = (
      xAxisObj.scaleType === 'linear'
      ? axisScaleLinear(xAxisObj.domain, xAxisObj.config)
      : xAxisObj.scaleType === 'time'
      ? axisScaleTime(xAxisObj.domain, xAxisObj.config)
      : axisScaleCategorical(xAxisObj.domain, xAxisObj.config)
    );
    const xAxis = axisFactory(
      xAxisObj.orient || 'bottom',
      xScale,
      xAxisObj.config,
    );

    const yScale: AxisScale<typeof yAxisObj.scaleType> = (
      yAxisObj.scaleType === 'categorical'
      ? axisScaleCategorical(yAxisObj.domain, yAxisObj.config)
      : yAxisObj.scaleType === 'time'
      ? axisScaleTime(yAxisObj.domain, yAxisObj.config)
      : axisScaleLinear(yAxisObj.domain, yAxisObj.config)
    );
    const yAxis = axisFactory(
      yAxisObj.orient || 'left',
      yScale,
      yAxisObj.config,
    );

    const xAxisRemainingBounds = xAxis
      .bounds({
        ...bounds,
        ...(
          xAxisObj.orient === 'right'
            ? { left: bounds.left + MARGIN }
            : { right: bounds.right - MARGIN }
        ),
      })
      .draw(root);

    const yAxisRemaingBounds = yAxis
      .bounds({
        ...xAxisRemainingBounds,
        ...(
          yAxisObj.orient === 'top'
            ? { bottom: bounds.bottom - MARGIN }
            : { top: bounds.top + MARGIN }
        ),
      })
      .draw(root);

    xAxis
      .bounds({
        top: bounds.top,
        bottom: bounds.bottom,
        ...(
          yAxisObj.orient === 'right'
            ? { left: bounds.left + MARGIN, right: yAxisRemaingBounds.right }
            : { right: bounds.right - MARGIN, left: yAxisRemaingBounds.left }
        ),
      })
      .draw(root);

    return { xScale, yScale };
  }

  return {
    draw,
    reDraw() {
      return draw(root);
    },
    bounds(_bounds: Bounds) {
      bounds = _bounds;
      return this;
    },
    xDomain(_xDomain: AxisProps<typeof xAxisObj.scaleType>['domain']) {
      xAxisObj.domain = _xDomain;
      return this;
    },
    yDomain(_yDomain: AxisProps<typeof yAxisObj.scaleType>['domain']) {
      yAxisObj.domain = _yDomain;
      return this;
    },
  };
}

export type {
  AxisProps,
};
