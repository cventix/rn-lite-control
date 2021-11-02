//
// File: utils/number.js
//

/**
 * Generate a random integer between two values.
 * @param  number min
 * @param  number max
 */
const getRandomIntInclusive = (min, max) => {
  const minRound = Math.ceil(min);
  const maxRound = Math.floor(max);
  // The maximum is inclusive and the minimum is inclusive
  return Math.floor(Math.random() * (maxRound - minRound + 1)) + minRound;
};

export default {
  getRandomIntInclusive,
};
