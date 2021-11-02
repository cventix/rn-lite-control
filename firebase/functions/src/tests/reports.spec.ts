// import { generateCSV } from '../reports';
// import { db } from '../init';
import * as fs from 'fs';
import { energySaving } from '../chart';

// describe('Commission Report', () => {
//   it('CSV', async () => {
//     const siteid = '1fLo4yW2tTqM22HQ1TNb';
//     const site = await db
//       .collection('sites')
//       .doc(siteid)
//       .get();
//     await generateCSV(site);
//     expect(1).toEqual(1);
//   });
// });

describe('Energy Report', () => {
  it('PNG', () => {
    const data = [
      { minute: 1, value: 1000 },
      { minute: 2, value: 2000 },
      { minute: 3, value: 3000 },
      { minute: 4, value: 4000 },
      { minute: 5, value: 5000 },
      { minute: 6, value: 6000 },
      { minute: 7, value: 7000 },
      { minute: 8, value: 8000 },
      { minute: 9, value: 9000 },
      { minute: 10, value: 10500 },
      { minute: 11, value: 11600 },
      { minute: 12, value: 12700 },
      { minute: 2, value: 1380 },
      { minute: 3, value: 1490 },
      { minute: 6, value: 1600 },
      { minute: 8, value: 1650 },
      { minute: 12, value: 1770 },
      { minute: 13, value: 1820 },
      { minute: 15, value: 1960 },
      { minute: 17, value: 2070 },
      { minute: 18, value: 2120 },
      { minute: 24, value: 2290 },
      { minute: 27, value: 3490 },
      { minute: 29, value: 3600 },
      { minute: 34, value: 3650 },
      { minute: 37, value: 3770 },
      { minute: 45, value: 3820 },
      { minute: 40, value: 3960 },
      { minute: 45, value: 4070 },
      { minute: 2, value: 500 },
      { minute: 4, value: 1000 },
      { minute: 5, value: 2400 },
      { minute: 6, value: 500 },
      { minute: 7, value: 1000 },
      { minute: 8, value: 2000 },
    ];
    const canvas = energySaving(data, 312, 'test report');
    const buf = canvas.toBuffer();
    fs.writeFileSync('test.png', buf);
  });
});
