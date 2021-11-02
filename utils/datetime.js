//
// File: utils/datetime.js
//
import moment from 'moment';

const date = d => moment(d).format('DD-MMM-YYYY');
const time = d => moment(d).format('HH:mm');
const seconds = d => moment(d).format('ss');
const datetime = d => `${date(d)} ${time(d)}`;
const datetimeseconds = d => `${datetime(d)}:${seconds(d)}`;

export default {
  date,
  time,
  datetime,
  datetimeseconds,
  seconds,
};
