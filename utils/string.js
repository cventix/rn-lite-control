//
// File: utils/string.js
//

const UCFirst = s => s.charAt(0).toUpperCase() + s.slice(1);

const asHex = num => `0x${Number(num).toString(16)}`;

const YesNo = b => (b ? 'Yes' : 'No');

const plural = n => (n === 1 ? '' : 's');

const hashCode = (s) => {
  let hash = 0;
  let i;
  let chr;

  if (s.length === 0) return hash;
  for (i = 0; i < s.length; i++) {
    chr = s.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

export default {
  UCFirst,
  asHex,
  YesNo,
  hashCode,
  plural,
};
