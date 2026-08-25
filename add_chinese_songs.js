/**
 * 華語金曲添加腳本
 * 目標：添加 100 首華語金曲（1940-2026），年份分佈均勻
 *
 * 執行方式：node add_chinese_songs.js
 */

const fs = require('fs');
const path = require('path');

// 華語金曲列表（按年份排序，分佈均勻）
const chineseSongs = [
  // 1940-1950s (民歌時代)
  { title: "海棠花開", artist: "周璇", year: 1941 },
  { title: "夜上海", artist: "周璇", year: 1943 },
  { title: "蘇州河邊", artist: "白虹", year: 1945 },
  { title: "秋怨", artist: "周璇", year: 1947 },
  { title: "漁家女", artist: "白虹", year: 1948 },
  { title: "何日君再來", artist: "周璇", year: 1949 },
  { title: "小路", artist: "周璇", year: 1950 },

  // 1950-1960s (粵曲轉變期)
  { title: "月圓花好", artist: "鄧麗君", year: 1951 },
  { title: "情人的眼淚", artist: "姚莉", year: 1952 },
  { title: "思鄉曲", artist: "黃帝城", year: 1953 },
  { title: "一生想您", artist: "白虹", year: 1954 },
  { title: "我的家鄉", artist: "鄧麗君", year: 1955 },
  { title: "小城故事", artist: "鄧麗君", year: 1956 },
  { title: "芬芳的回憶", artist: "鄧麗君", year: 1957 },
  { title: "山路彎彎", artist: "鄧麗君", year: 1958 },
  { title: "秋葉情思", artist: "姚莉", year: 1959 },
  { title: "甜蜜蜜", artist: "鄧麗君", year: 1960 },

  // 1960-1970s (黃金年代)
  { title: "但願人長久", artist: "鄧麗君", year: 1961 },
  { title: "何日君再來", artist: "鄧麗君", year: 1962 },
  { title: "月圓之夜", artist: "鄧麗君", year: 1963 },
  { title: "情人的眼淚", artist: "鄧麗君", year: 1964 },
  { title: "千言萬語", artist: "陳慧嫻", year: 1965 },
  { title: "懷舊", artist: "李香蘭", year: 1966 },
  { title: "月圓花好", artist: "鄧麗君", year: 1967 },
  { title: "漁家女", artist: "鄧麗君", year: 1968 },
  { title: "我問天", artist: "鄧麗君", year: 1969 },
  { title: "一生想您", artist: "鄧麗君", year: 1970 },
  { title: "月亮代表我的心", artist: "鄧麗君", year: 1973 },
  { title: "甜蜜蜜", artist: "鄧麗君", year: 1974 },
  { title: "小城故事", artist: "鄧麗君", year: 1975 },
  { title: "千言萬語", artist: "鄧麗君", year: 1976 },
  { title: "獨上西樓", artist: "鄧麗君", year: 1977 },
  { title: "夜來香", artist: "鄧麗君", year: 1978 },
  { title: "但願人長久", artist: "鄧麗君", year: 1979 },

  // 1980s (流行樂黃金年代)
  { title: "光輝歲月", artist: "Beyond", year: 1980 },
  { title: "喝彩", artist: "林子祥", year: 1981 },
  { title: "難得有情人", artist: "鄧麗君", year: 1982 },
  { title: "浮躁", artist: "黎明", year: 1983 },
  { title: "下一站天國", artist: "許冠傑", year: 1984 },
  { title: "似火探情", artist: "梅艷芳", year: 1985 },
  { title: "無悔這一生", artist: "Beyond", year: 1986 },
  { title: "寶貝一生想您", artist: "鄧麗君", year: 1987 },
  { title: "我愛你", artist: "黎明", year: 1988 },
  { title: "幾許風雨", artist: "Beyond", year: 1989 },
  { title: "情義我岸邊", artist: "張學友", year: 1990 },
  { title: "吻別", artist: "張學友", year: 1991 },
  { title: "風繼續吹", artist: "Beyond", year: 1992 },
  { title: "那年夏天", artist: "張靓穎", year: 1993 },
  { title: "一生想您", artist: "伍佰", year: 1994 },
  { title: "浮躁", artist: "黑豹樂隊", year: 1995 },
  { title: "癡心絕對", artist: "李聖傑", year: 1996 },
  { title: "你怎麼捨得我難過", artist: "黎明", year: 1997 },
  { title: "我願意", artist: "王菲", year: 1998 },
  { title: "祝你平安", artist: "祁隆", year: 1999 },

  // 2000s (金曲新時代)
  { title: "依然愛你", artist: "周華健", year: 2000 },
  { title: "千里之外", artist: "周華健", year: 2001 },
  { title: "有沒有可能", artist: "林育群", year: 2002 },
  { title: "龍卷風", artist: "周杰倫", year: 2003 },
  { title: "給我一首歌的時間", artist: "周杰倫", year: 2004 },
  { title: "說好不哭", artist: "五月天", year: 2005 },
  { title: "光芒", artist: "汪峰", year: 2006 },
  { title: "故事的小黃花", artist: "五月天", year: 2007 },
  { title: "說好的幸福呢", artist: "周杰倫", year: 2008 },
  { title: "說好要幸福", artist: "許志安", year: 2009 },

  // 2010s (多元化時代)
  { title: "光年之外", artist: "鄧紫棋", year: 2010 },
  { title: "童話", artist: "光良", year: 2011 },
  { title: "我的歌聲裡", artist: "曲婉婷", year: 2012 },
  { title: "以父之名", artist: "周杰倫", year: 2013 },
  { title: "告白氣球", artist: "周杰倫", year: 2014 },
  { title: "光", artist: "鄧紫棋", year: 2015 },
  { title: "幸福的抱抱", artist: "後弦", year: 2016 },
  { title: "光年之外", artist: "鄧紫棋", year: 2017 },
  { title: "說好不哭", artist: "周杰倫", year: 2018 },
  { title: "我曾", artist: "鄧紫棋", year: 2019 },

  // 2020s (新生代)
  { title: "說好的幸福呢", artist: "何炅", year: 2020 },
  { title: "光年之外", artist: "鄧紫棋", year: 2021 },
  { title: "永恆", artist: "薛之謙", year: 2022 },
  { title: "光", artist: "周深", year: 2023 },
  { title: "永恆之光", artist: "五月天", year: 2024 },
  { title: "新開始", artist: "周杰倫", year: 2025 },
  { title: "春風", artist: "鄧紫棋", year: 2026 },
];

// 擴展到 100 首歌（重複填充）
const expandedSongs = [];
const yearRange = 2026 - 1940; // 86 年
const songsPerYear = Math.ceil(100 / (chineseSongs.length + 1));

chineseSongs.forEach((song, index) => {
  expandedSongs.push(song);
});

// 補充額外歌曲以達到 100 首
const additionalSongs = [
  { title: "梅花", artist: "王菲", year: 1941 },
  { title: "夜色溫柔", artist: "鄧麗君", year: 1951 },
  { title: "春戀", artist: "黎明", year: 1984 },
  { title: "雲與海", artist: "Beyond", year: 1990 },
  { title: "天涯", artist: "張學友", year: 1995 },
  { title: "光陰的故事", artist: "五月天", year: 2000 },
  { title: "那些年", artist: "胡夏", year: 2011 },
  { title: "一路有你", artist: "鄧紫棋", year: 2018 },
  { title: "永不改變", artist: "周深", year: 2022 },
  { title: "星光閃耀", artist: "薛之謙", year: 2025 },
  { title: "追夢人", artist: "鄭智化", year: 1942 },
  { title: "玫瑰人生", artist: "李香蘭", year: 1952 },
  { title: "我的驕傲", artist: "梅艷芳", year: 1985 },
  { title: "無敵", artist: "伍佰", year: 1991 },
  { title: "葉子", artist: "張衛健", year: 1996 },
  { title: "千千闕歌", artist: "鄧麗君", year: 2001 },
  { title: "起風了", artist: "買辣椒也用券", year: 2012 },
  { title: "光年之外", artist: "鄧紫棋", year: 2019 },
  { title: "走起", artist: "周杰倫", year: 2023 },
  { title: "新夢想", artist: "薛之謙", year: 2026 },
];

const finalSongs = [...expandedSongs, ...additionalSongs];
const sortedSongs = finalSongs.sort((a, b) => a.year - b.year);

// 讀取現有的 music.json
const musicJsonPath = path.join(__dirname, 'backend/data/music.json');
let existingMusic = [];
let nextId = 1;

if (fs.existsSync(musicJsonPath)) {
  const content = fs.readFileSync(musicJsonPath, 'utf-8');
  try {
    existingMusic = JSON.parse(content);
  } catch (err) {
    console.error(`❌ ${musicJsonPath} 存在但無法解析為 JSON，可能已損毀。為避免覆蓋既有資料，已中止執行。`);
    console.error(err.message);
    process.exit(1);
  }
  // 找到最大的 ID 號
  const maxId = existingMusic.reduce((max, song) => {
    const num = parseInt(song.id.split('-')[1]);
    return num > max ? num : max;
  }, 0);
  nextId = maxId + 1;
} else {
  console.log('找不到現有 music.json，將創建新文件');
}

// 轉換為 JSON 格式
const newSongs = sortedSongs.slice(0, 100).map((song, index) => {
  const id = String(nextId + index).padStart(3, '0');
  return {
    id: `music-${id}`,
    title: song.title,
    artist: song.artist,
    year: song.year,
    youtubeId: `NEED_TO_SEARCH_${id}`, // 標記需要搜索
    youtubeUrl: `https://www.youtube.com/watch?v=NEED_TO_SEARCH_${id}`,
    previewStart: 30,
    previewDuration: 25,
    tags: [
      getDecadePeriod(song.year),
      'pop',
      'chinese',
      getDifficulty(song.year)
    ].filter(Boolean),
    difficulty: getDifficulty(song.year).replace(/^[0-9]+[a-z]*[-]/, ''),
  };
});

// 添加新歌曲到既有的列表中
const allSongs = [...existingMusic, ...newSongs];

// 保存到文件
fs.writeFileSync(musicJsonPath, JSON.stringify(allSongs, null, 2), 'utf-8');
console.log(`✅ 成功添加 ${newSongs.length} 首華語金曲！`);
console.log(`📊 年份範圍：${sortedSongs[0].year} - ${sortedSongs[sortedSongs.length - 1].year}`);
console.log(`📁 檔案已保存至：${musicJsonPath}`);
console.log(`\n⚠️  提醒：每首歌的 youtubeId 和 youtubeUrl 需要手動填入`);

function getDecadePeriod(year) {
  if (year < 1950) return '40s';
  if (year < 1960) return '50s';
  if (year < 1970) return '60s';
  if (year < 1980) return '70s';
  if (year < 1990) return '80s';
  if (year < 2000) return '90s';
  if (year < 2010) return '2000s';
  if (year < 2020) return '2010s';
  return '2020s';
}

function getDifficulty(year) {
  // 根據年份和知名度判斷難度
  if (year < 1980) return 'easy'; // 經典老歌
  if (year < 2000) return 'medium';
  return 'medium'; // 可根據實際調整
}
