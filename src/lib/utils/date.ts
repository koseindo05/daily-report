/**
 * 日付関連のユーティリティ関数
 */

/**
 * 日付を「2024年12月15日（日）」形式にフォーマット
 * @param date - フォーマットする日付
 * @returns フォーマットされた日付文字列
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];

  return `${year}年${month}月${day}日（${dayOfWeek}）`;
}

/**
 * 日時を「2024/12/15 18:30」形式にフォーマット
 * @param date - フォーマットする日時
 * @returns フォーマットされた日時文字列
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

/**
 * 未来日かどうかをチェック
 * @param date - チェックする日付
 * @returns 未来日の場合true
 */
export function isFuture(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return d > today;
}

/**
 * 文字列からDate変換
 * @param dateString - 日付文字列 (YYYY-MM-DD形式)
 * @returns Dateオブジェクト
 */
export function parseDate(dateString: string): Date {
  return new Date(dateString);
}
