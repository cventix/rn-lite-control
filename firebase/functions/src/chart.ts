import { Canvas } from 'canvas';
import { LineChart } from './linechart';

/**
 * Notes from Successful Endeavours.
 * e_timed_energy_level is  (Watt _X_1000)_per_hour.
 * I just confirmed with Roberto, the e_timed_energy_level events include the value of accumulated
 * energy since the last reboot, and the seconds since reboot is also logged as log_t. seconds ,
 * so you can use the  e_timed_energy_level's value to build the energy report and the
 * unit of the value is still  (Watt _X_1000)_per_hour.
 *
 * By that account the current wattage per hour interval should be (y2 - y1) / 1000 * (x2 - x1) * 60.
 * Essentially multiply the difference in power consumtion by the difference in time.
 *
 * @param  {} data Energy data log looks like [{minute: 123, value: 50000}, ...]
 * @returns {} canvas of line chart
 * */
export const energySaving = (data, max, name) => {
  const dataSeries = [];
  for (let i = 1; i < data.length; i += 1) {
    const itm = data[i];
    const prev = data[i - 1];
    let minutedelta = itm.minute - prev.minute;
    if (minutedelta < 0) minutedelta = 0;
    let valuedelta = itm.value - prev.value;
    if (valuedelta < 0) valuedelta = 0;
    dataSeries.push({
      x: itm.minute,
      y1: (valuedelta / 1000) * minutedelta * 60, // Per hour
    });
  }
  const total = dataSeries.map(d => d.y1).reduce((accumulator, current) => accumulator + current);
  const average = total / dataSeries.length;
  const dataWithAvg = dataSeries.map(d => ({ ...d, y2: average, y3: max }));

  const canvas = new Canvas(500, 500);
  LineChart.init({
    canvas,
    nodeList: dataWithAvg,
    yGradient1: 50,
    // yGradient2: 20,
    unitLengthX: 40,
    canvasH: 500,
    lineNames: ['Power Level (w)', 'Average Power', 'Max Power (w)'],
    lineColors: ['blue', 'orange', 'grey'],
    title: `Power Consumption for Light ${name}`,
    xLegend: 'Minutes since reboot',
  });

  return canvas;
};
