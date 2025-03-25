import * as d3 from 'd3';

import { Bounds } from '../../types';
import { truncateText, wrapText } from '../../utils/text';

import axisScaleCategorical, {
  AxisScaleCategoricalDomain,
  AxisScaleCategoricalConfig,
} from './axisScaleCategorical';
import axisScaleLinear, {
  AxisScaleLinearDomain,
  AxisScaleLinearConfig,
} from './axisScaleLinear';
import axisScaleTime, {
  AxisScaleTimeDomain,
  AxisScaleTimeConfig,
} from './axisScaleTime';
import './styles.css';

type AxisOrient = 'top' | 'left' | 'bottom' | 'right';

type AxisScaleType = 'categorical' | 'linear' | 'time';

type AxisScaleValueType<TAxisScaleType extends AxisScaleType> = (
  TAxisScaleType extends 'categorical'
  ? AxisScaleCategoricalDomain[number]['id']
  : TAxisScaleType extends 'linear'
  ? d3.NumberValue
  : TAxisScaleType extends 'time'
  ? Date
  : never
);

interface AxisConfig {
  label?: string;
  labelPosition?: 'start' | 'center' | 'end';
  tickLineHidden?: boolean;
  tickLabelHidden?: boolean;
  tickLabelWidth?: number;
  tickLabelOverflow?: 'wrap' | 'truncate';
  gridLineHidden?: boolean;
  lineHidden?: boolean;
}

interface AxisScale<TAxisScaleType extends AxisScaleType> {
  ticks(): { value: AxisScaleValueType<TAxisScaleType>, label: string }[];
  range(): [number, number];
  range(range: [number, number]): void;
  (value: AxisScaleValueType<TAxisScaleType>): number;
}

const CLASS_NAMES = {
  axisRoot: {
    top: 'seesunchart-axis-top',
    left: 'seesunchart-axis-left',
    bottom: 'seesunchart-axis-bottom',
    right: 'seesunchart-axis-right',
  },
  tickGroup: 'seesunchart-axis-tick',
  tickLine: 'seesunchart-axis-tick-line',
  tickLabel: 'seesunchart-axis-tick-label',
  label: 'seesunchart-axis-label',
  line: 'seesunchart-axis-line',
  gridLine: 'seesunchart-axis-grid-line',
};

const LABEL_MARGIN = 10;
const TICK_GAP = 3;
const TICK_LINE_SIZE = 5;

export default function axisFactory<TAxisScaleType extends AxisScaleType>(
  orient: AxisOrient,
  scale: AxisScale<TAxisScaleType>,
  config?: AxisConfig,
) {
  let bounds: Bounds;
  const {
    label,
    labelPosition = 'center',
    tickLineHidden,
    tickLabelHidden,
    tickLabelWidth,
    tickLabelOverflow,
    gridLineHidden,
    lineHidden,
  } = config || {};

  function draw(
    root: d3.Selection<SVGSVGElement, any, any, any>,
  ) {
    const vertical = orient === 'left' || orient === 'right';
    const direction = (orient === 'left' || orient === 'top') ? 1 : -1;
    const range: [number, number] = (
      vertical
        ? [bounds.bottom, bounds.top]
        : [bounds.left, bounds.right]
    );
    const rangeWidth = (
      vertical
        ? bounds.bottom - bounds.top
        : bounds.right - bounds.left
    );
    scale.range(range);
    let pointer = bounds[orient];

    const axisRoot = root
      .selectAll<SVGGraphicsElement, any>(`.${CLASS_NAMES.axisRoot[orient]}`)
      .data([''])
      .join('g')
      .attr('class', CLASS_NAMES.axisRoot[orient]);

    if (label) {
      const axisLabel = axisRoot
        .selectAll<SVGGraphicsElement, string>(`.${CLASS_NAMES.label}`)
        .data([label])
        .join('g')
        .attr('class', CLASS_NAMES.label);
      const axisLabelText = axisLabel
        .selectChildren<SVGTextElement, string>('text')
        .data([label])
        .join('text')
        .text(label)
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'central');
      const { width: labelWidth = 0, height: labelHeight = 0 } = axisLabelText.node()?.getBBox() || {};
      const labelX = (
        vertical
          ? pointer + (labelHeight / 2) * direction
          : (
            labelPosition === 'start'
              ? range[0] + labelWidth / 2
              : labelPosition === 'center'
                ? range[0] + rangeWidth / 2
                : range[1] - labelWidth / 2
          )
      );
      const labelY = (
        vertical
          ? (
            labelPosition === 'start'
              ? range[0] - labelWidth / 2
              : labelPosition === 'center'
                ? range[0] - rangeWidth / 2
                : range[1] + labelWidth / 2
          )
          : pointer + (labelHeight / 2) * direction
      );
      axisLabelText
        .attr(
          'transform',
          `translate(${labelX}, ${labelY}) ${orient === 'left' ? 'rotate(270)' : orient === 'right' ? 'rotate(90)' : ''}`,
        );

      pointer += ((vertical ? labelWidth : labelHeight) + LABEL_MARGIN) * direction;
    }

    const tickGroups = axisRoot
      .selectAll(`.${CLASS_NAMES.tickGroup}`)
      .data(scale.ticks())
      .join('g')
      .attr('class', CLASS_NAMES.tickGroup);

    if (!tickLabelHidden) {
      const tickLabels = tickGroups
        .selectAll<SVGTextElement, ReturnType<AxisScale<TAxisScaleType>['ticks']>>(`.${CLASS_NAMES.tickLabel}`)
        .data((d) => [d])
        .join('text')
        .attr('class', CLASS_NAMES.tickLabel)
        .attr('width', tickLabelWidth || '')
        .text((d) => d.label)
        .attr('alignment-baseline', 'central')
        .attr(
          'text-anchor', (
            orient === 'left'
              ? 'end'
              : orient === 'right'
                ? 'start'
                : 'middle'
          ),
        )
        .attr(vertical ? 'y' : 'x', (d) => scale(d.value))
        .call((text) => {
          if (tickLabelOverflow === 'wrap') {
            wrapText(text);
          } else {
            truncateText(text);
          }
        });
      if (vertical) {
        const maxTickLabelWidth = d3.max<SVGTextElement, number>(
          tickLabels,
          (tickLabel) => tickLabel.getBBox().width,
        ) || 0;
        tickLabels
          .attr('x', pointer + maxTickLabelWidth * direction);
        pointer += (maxTickLabelWidth + TICK_GAP) * direction;
      } else {
        const maxTickLabelHeight = d3.max<SVGTextElement, number>(
          tickLabels,
          (tickLabel) => tickLabel.getBBox().height,
        ) || 0;
        tickLabels
          .attr('y', pointer + (maxTickLabelHeight / 2) * direction);
        pointer += (maxTickLabelHeight + TICK_GAP) * direction;
      }
    }

    if (!tickLineHidden) {
      tickGroups
        .selectAll(`.${CLASS_NAMES.tickLine}`)
        .data((d) => [d])
        .join('line')
        .attr('class', CLASS_NAMES.tickLine)
        .attr(vertical ? 'x1' : 'y1', pointer)
        .attr(vertical ? 'x2' : 'y2', pointer + TICK_LINE_SIZE * direction)
        .attr(vertical ? 'y1' : 'x1', (d) => scale(d.value))
        .attr(vertical ? 'y2' : 'x2', (d) => scale(d.value));
      pointer += TICK_LINE_SIZE * direction;
    }

    if (!gridLineHidden) {
      axisRoot
        .selectAll(`.${CLASS_NAMES.gridLine}`)
        .data(scale.ticks())
        .join('line')
        .attr('class', CLASS_NAMES.gridLine)
        .attr(vertical ? 'x1' : 'y1', pointer)
        .attr(
          vertical ? 'x2' : 'y2',
          {
            top: bounds.bottom,
            bottom: bounds.top,
            left: bounds.right,
            right: bounds.left,
          }[orient],
        )
        .attr(vertical ? 'y1' : 'x1', (d) => scale(d.value))
        .attr(vertical ? 'y2' : 'x2', (d) => scale(d.value))
        .attr('visibility', (tick) => (scale(tick.value) === scale.range()[0] ? 'hidden' : 'visible'));
    }

    if (!lineHidden) {
      axisRoot
        .selectAll(`.${CLASS_NAMES.line}`)
        .data([''])
        .join('line')
        .attr('class', CLASS_NAMES.line)
        .call((g) => {
          if (vertical) {
            g
              .attr('y1', bounds.top)
              .attr('y2', bounds.bottom)
              .attr('x1', pointer)
              .attr('x2', pointer);
          } else {
            g
              .attr('x1', bounds.left)
              .attr('x2', bounds.right)
              .attr('y1', pointer)
              .attr('y2', pointer);
          }
        });
    }

    const remainingBounds = {
      top: orient === 'top' ? pointer : bounds.top,
      left: orient === 'left' ? pointer : bounds.left,
      bottom: orient === 'bottom' ? pointer : bounds.bottom,
      right: orient === 'right' ? pointer : bounds.right,
    };

    return remainingBounds;
  }

  return {
    draw,
    bounds(_bounds: Bounds) {
      bounds = _bounds;
      return this;
    },
  };
}

export function axisTop<TAxisScaleType extends AxisScaleType>(scale: AxisScale<TAxisScaleType>) {
  return axisFactory('top', scale);
}

export function axisLeft<TAxisScaleType extends AxisScaleType>(scale: AxisScale<TAxisScaleType>) {
  return axisFactory('left', scale);
}

export function axisBottom<TAxisScaleType extends AxisScaleType>(scale: AxisScale<TAxisScaleType>) {
  return axisFactory('bottom', scale);
}

export function axisRight<TAxisScaleType extends AxisScaleType>(scale: AxisScale<TAxisScaleType>) {
  return axisFactory('right', scale);
}

export {
  axisScaleCategorical,
  axisScaleLinear,
  axisScaleTime,
};

export type {
  AxisScaleType,
  AxisOrient,
  AxisScale,
  AxisConfig,
  AxisScaleCategoricalDomain,
  AxisScaleCategoricalConfig,
  AxisScaleLinearDomain,
  AxisScaleLinearConfig,
  AxisScaleTimeDomain,
  AxisScaleTimeConfig,
};
