// utils/matchItems.js

const normalizeText = (text = "") =>
  text.toLowerCase().replace(/[^\w\s]/g, "").trim();

const stopWords = [
  "the",
  "a",
  "an",
  "and",
  "or",
  "is",
  "are",
  "was",
  "were",
  "of",
  "to",
  "in",
  "on",
  "at",
  "for",
  "with",
  "near",
  "from",
  "by",
  "my",
  "this",
  "that",
  "it",
  "lost",
  "found",
  "item",
];

const getWords = (text = "") => {
  return normalizeText(text)
    .split(/\s+/)
    .filter((word) => word && !stopWords.includes(word));
};

const countCommonWords = (text1 = "", text2 = "") => {
  const words1 = new Set(getWords(text1));
  const words2 = new Set(getWords(text2));

  let count = 0;
  for (const word of words1) {
    if (words2.has(word)) {
      count++;
    }
  }

  return count;
};

const getCommonWords = (text1 = "", text2 = "") => {
  const words1 = new Set(getWords(text1));
  const words2 = new Set(getWords(text2));

  const common = [];
  for (const word of words1) {
    if (words2.has(word)) {
      common.push(word);
    }
  }

  return common;
};

const getDateDifferenceInDays = (date1, date2) => {
  if (!date1 || !date2) return 999;

  const d1 = new Date(date1);
  const d2 = new Date(date2);

  const diffTime = Math.abs(d1 - d2);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

const getMatchLabel = (score) => {
  if (score >= 75) return "High Match";
  if (score >= 50) return "Possible Match";
  if (score >= 30) return "Low Match";
  return "No Match";
};

const calculateMatchScore = (currentItem, candidateItem) => {
  let score = 0;
  const reasons = [];

  // 1. Title match - 40 points (MOST IMPORTANT)
  const titleCommonWords = getCommonWords(
    currentItem.title || "",
    candidateItem.title || ""
  );

  if (titleCommonWords.length >= 2) {
    score += 40;
    reasons.push(`Strong title match: ${titleCommonWords.join(", ")}`);
  } else if (titleCommonWords.length === 1) {
    score += 28;
    reasons.push(`Title match: ${titleCommonWords[0]}`);
  }

  // 2. Category match - 20 points
  if (
    currentItem.category &&
    candidateItem.category &&
    normalizeText(currentItem.category) === normalizeText(candidateItem.category)
  ) {
    score += 20;
    reasons.push("Same category");
  }

  // 3. Location match - 15 points
  if (currentItem.location && candidateItem.location) {
    const currentLocation = normalizeText(currentItem.location);
    const candidateLocation = normalizeText(candidateItem.location);

    if (currentLocation === candidateLocation) {
      score += 15;
      reasons.push("Same location");
    } else if (
      currentLocation.includes(candidateLocation) ||
      candidateLocation.includes(currentLocation)
    ) {
      score += 8;
      reasons.push("Similar location");
    }
  }

  // 4. Date proximity - 10 points
  const dateDiff = getDateDifferenceInDays(
    currentItem.dateOfIncident,
    candidateItem.dateOfIncident
  );

  if (dateDiff === 0) {
    score += 10;
    reasons.push("Same date");
  } else if (dateDiff <= 3) {
    score += 7;
    reasons.push("Close date");
  } else if (dateDiff <= 7) {
    score += 4;
    reasons.push("Within one week");
  }

  // 5. Description similarity - 15 points
  const descriptionCommonWords = getCommonWords(
    currentItem.description || "",
    candidateItem.description || ""
  );

  if (descriptionCommonWords.length >= 3) {
    score += 15;
    reasons.push("Strong description similarity");
  } else if (descriptionCommonWords.length === 2) {
    score += 10;
    reasons.push("Good description similarity");
  } else if (descriptionCommonWords.length === 1) {
    score += 5;
    reasons.push("Some description similarity");
  }

  // 6. Penalty if title has no common item word
  // This helps stop wallet -> laptop type bad matches
  if (titleCommonWords.length === 0) {
    score -= 15;
    reasons.push("No title similarity");
  }

  // Keep score between 0 and 100
  score = Math.max(0, Math.min(score, 100));

  return {
    score,
    label: getMatchLabel(score),
    reasons,
  };
};

export const findMatches = (currentItem, candidateItems = []) => {
  const oppositeType = currentItem.itemType === "lost" ? "found" : "lost";

  const matches = candidateItems
    .filter(
      (item) =>
        item._id.toString() !== currentItem._id.toString() &&
        item.itemType === oppositeType &&
        item.status === "active"
    )
    .map((item) => {
      const result = calculateMatchScore(currentItem, item);
      return {
        ...item.toObject(),
        matchScore: result.score,
        matchLabel: result.label,
        matchReasons: result.reasons,
      };
    })
    .filter((item) => item.matchScore >= 30)
    .sort((a, b) => b.matchScore - a.matchScore);

  return matches;
};