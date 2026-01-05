export const getImages = (imageField: string | null | undefined): string[] => {
  if (!imageField) return [];
  
  try {
    // Try parsing as JSON array
    const parsed = JSON.parse(imageField);
    if (Array.isArray(parsed)) {
      return parsed.map(url => typeof url === 'string' ? url : '');
    }
    // If parsed but not an array (e.g. JSON string), return as single item array
    return [imageField];
  } catch {
    // If parsing fails, it's likely a simple string URL
    return [imageField];
  }
};

export const getFirstImage = (imageField: string | null | undefined): string => {
  const images = getImages(imageField);
  return images.length > 0 ? images[0] : '';
};
