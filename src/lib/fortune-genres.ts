/** Dify `genre` 入力と一致させる占いジャンル一覧 */
export const FORTUNE_GENRES = [
  "全般",
  "恋愛",
  "復縁",
  "片思い",
  "不倫",
  "浮気",
  "金運",
  "仕事",
] as const;

export type FortuneGenre = (typeof FORTUNE_GENRES)[number];

export function isFortuneGenre(value: string): value is FortuneGenre {
  return (FORTUNE_GENRES as readonly string[]).includes(value);
}
