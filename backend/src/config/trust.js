const DEFAULT_INITIAL_TRUST_SCORE = 50;
const TRUST_SCORE_MIN = 0;
const TRUST_SCORE_MAX = 1000;

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const INITIAL_TRUST_SCORE = toNumber(
  process.env.INITIAL_TRUST_SCORE,
  DEFAULT_INITIAL_TRUST_SCORE
);

module.exports = {
  INITIAL_TRUST_SCORE,
  TRUST_SCORE_MIN,
  TRUST_SCORE_MAX,
};
