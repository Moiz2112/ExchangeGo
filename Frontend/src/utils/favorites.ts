export interface FavoriteItem {
  ticker?: string;
  name?: string;
  type: 'coin' | 'exchange';
}

const FAVORITES_KEY = 'exchangego_favorites';

export function getFavorites(): FavoriteItem[] {
  try {
    const saved = localStorage.getItem(FAVORITES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function addFavorite(item: FavoriteItem): void {
  const favorites = getFavorites();
  const exists = favorites.some(
    f => f.type === item.type && (f.ticker || f.name) === (item.ticker || item.name)
  );
  if (!exists) {
    favorites.push(item);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
}

export function removeFavorite(type: 'coin' | 'exchange', identifier: string): void {
  const favorites = getFavorites().filter(
    f => !(f.type === type && (f.ticker || f.name) === identifier)
  );
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

export function isFavorite(type: 'coin' | 'exchange', identifier: string): boolean {
  return getFavorites().some(
    f => f.type === type && (f.ticker || f.name) === identifier
  );
}

export function toggleFavorite(type: 'coin' | 'exchange', identifier: string, data?: { name?: string; ticker?: string }): boolean {
  if (isFavorite(type, identifier)) {
    removeFavorite(type, identifier);
    return false;
  } else {
    addFavorite({
      type,
      ticker: data?.ticker,
      name: data?.name || identifier,
    });
    return true;
  }
}
