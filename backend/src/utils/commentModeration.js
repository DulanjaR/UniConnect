const blockedWords = [
  'idiot',
  'stupid',
  'hate you',
  'shut up',
  'dumb',
  'moron',
  'trash',
  'kill yourself'
];

const severeBlockedWords = ['kill yourself'];

const normalizeText = (text = '') => text.toLowerCase().replace(/\s+/g, ' ').trim();

const hasRepeatedPhrase = (text) => {
  const normalized = normalizeText(text);
  const words = normalized.split(' ').filter(Boolean);

  if (words.length < 6) {
    return false;
  }

  const joined = words.join(' ');
  const firstHalf = words.slice(0, Math.floor(words.length / 2)).join(' ');
  return joined.includes(`${firstHalf} ${firstHalf}`) || /(.)\1{7,}/.test(normalized);
};

export const moderateCommentText = (text = '') => {
  const normalized = normalizeText(text);

  if (!normalized) {
    return {
      accepted: false,
      reject: true,
      reason: 'Comment text is required.'
    };
  }

  const severeMatch = severeBlockedWords.find((word) => normalized.includes(word));
  if (severeMatch) {
    return {
      accepted: false,
      reject: true,
      reason: 'Comment rejected for abusive language.'
    };
  }

  const blockedMatch = blockedWords.find((word) => normalized.includes(word));
  const suspicious =
    blockedMatch ||
    hasRepeatedPhrase(text) ||
    /(https?:\/\/|www\.)/i.test(text) ||
    normalized.split(' ').filter(Boolean).length > 120;

  return {
    accepted: true,
    reject: false,
    flagged: Boolean(suspicious),
    reason: suspicious ? 'Comment flagged for moderation review.' : ''
  };
};
