// Helper function to get rank image filename
export const getRankImage = (memberRank) => {
  const rankMap = {
    'agent': '1.png',
    'bronze': '2.png',
    'silver': '3.png',
    'gold': '4.png',
    'ruby': '5.png',
    'diamond': '6.png',
    'double_diamond': '7.png',
    'regional_ambassador': '8.png',
    'global_ambassador': '9.png'
  };

  return rankMap[memberRank] || '1.png'; // default to agent
};

// Helper function to get rank name in Arabic
export const getRankNameAr = (memberRank) => {
  const rankNamesAr = {
    'agent': 'وكيل',
    'bronze': 'برونزي',
    'silver': 'فضي',
    'gold': 'ذهبي',
    'ruby': 'ياقوتي',
    'diamond': 'ماسي',
    'double_diamond': 'ماسي مزدوج',
    'regional_ambassador': 'سفير إقليمي',
    'global_ambassador': 'سفير عالمي'
  };

  return rankNamesAr[memberRank] || 'وكيل';
};

// Helper function to get rank name in English
export const getRankNameEn = (memberRank) => {
  const rankNamesEn = {
    'agent': 'Agent',
    'bronze': 'Bronze',
    'silver': 'Silver',
    'gold': 'Gold',
    'ruby': 'Ruby',
    'diamond': 'Diamond',
    'double_diamond': 'Double Diamond',
    'regional_ambassador': 'Regional Ambassador',
    'global_ambassador': 'Global Ambassador'
  };

  return rankNamesEn[memberRank] || 'Agent';
};

// Get rank name based on language
export const getRankName = (memberRank, language = 'ar') => {
  return language === 'ar' ? getRankNameAr(memberRank) : getRankNameEn(memberRank);
};

// Convert rank number to rank name
export const getRankNameFromNumber = (rankNumber) => {
  const numberToRankMap = {
    1: 'agent',
    2: 'bronze',
    3: 'silver',
    4: 'gold',
    5: 'ruby',
    6: 'diamond',
    7: 'double_diamond',
    8: 'regional_ambassador',
    9: 'global_ambassador'
  };

  return numberToRankMap[rankNumber] || 'agent';
};

// Convert rank name to rank number
export const getRankNumber = (memberRank) => {
  const rankToNumberMap = {
    'agent': 1,
    'bronze': 2,
    'silver': 3,
    'gold': 4,
    'ruby': 5,
    'diamond': 6,
    'double_diamond': 7,
    'regional_ambassador': 8,
    'global_ambassador': 9
  };

  return rankToNumberMap[memberRank] || 1;
};

// Get rank image directly from rank number
export const getRankImageFromNumber = (rankNumber) => {
  return `${rankNumber}.png`;
};
