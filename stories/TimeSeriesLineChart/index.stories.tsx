import React, { useRef } from 'react';

import TimeSeriesLineChart, {
  TimeSeriesLineChartProps,
} from '../../src/charts/TimeSeriesLineChart';

import type { StoryFn, Meta } from '@storybook/react';

const meta: Meta = {
  component: TimeSeriesLineChart,
};

export default meta;

export const Default: StoryFn<TimeSeriesLineChartProps> = ({ dataSet, config }) => (
  <TimeSeriesLineChart
    dataSet={dataSet}
    config={config}
  />
);

Default.args = {
  dataSet: {
    series: [
      {
        id: '1',
        label: 'Series 1',
        data: Array.from(Array(30)).map((_, i) => ({
          time: `2025-01-${String(i + 1).padStart(2, '0')}`,
          value: Math.random(),
        })),
        // color: 'black',
      },
      {
        id: '2',
        label: 'Series 2',
        data: Array.from(Array(30)).map((_, i) => ({
          time: `2025-01-${String(i + 1).padStart(2, '0')}`,
          value: Math.random() / 4,
        })),
      },
    ],
  },
  config: {
    chart: {
      height: 400,
    },
    xAxis: {
      gridLineHidden: true,
    },
    yAxis: {
      tickPreferredCount: 3,
    },
    legend: {
    },
  },
};
