export const STORAGE_KEYS = {
  SEARCH_HISTORY: 'dealshield_search_history',
  CATEGORY_VIEWS: 'dealshield_category_views',
};

export const trackSearch = (term: string) => {
  if (!term || term.trim().length < 3) return;
  
  try {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY) || '[]');
    // Add to front, limit to 10
    const newHistory = [term, ...history.filter((t: string) => t !== term)].slice(0, 10);
    localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(newHistory));
  } catch (e) {
    console.error('Error tracking search:', e);
  }
};

export const trackCategoryView = (category: string) => {
  if (!category) return;

  try {
    const views = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORY_VIEWS) || '{}');
    views[category] = (views[category] || 0) + 1;
    localStorage.setItem(STORAGE_KEYS.CATEGORY_VIEWS, JSON.stringify(views));
  } catch (e) {
    console.error('Error tracking category view:', e);
  }
};

export const getPreferredCategory = (): string | null => {
  try {
    const views = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORY_VIEWS) || '{}');
    let maxViews = 0;
    let preferredCategory = null;

    for (const [category, count] of Object.entries(views)) {
      if ((count as number) > maxViews) {
        maxViews = count as number;
        preferredCategory = category;
      }
    }

    return preferredCategory;
  } catch (e) {
    console.error('Error getting preferred category:', e);
    return null;
  }
};

export const getRecentSearches = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY) || '[]');
  } catch (e) {
    return [];
  }
};
