
export const addWatermarkToImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Set canvas dimensions to match image
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0);

        // Watermark configuration
        const textBase = "DealShield";
        const fontSize = Math.max(14, Math.floor(img.width * 0.04)); // Smaller font (4% of width)
        const stripHeight = fontSize * 2;
        
        // Draw semi-transparent strip
        const centerY = canvas.height / 2;
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)"; // Low opacity black strip
        ctx.fillRect(0, centerY - stripHeight / 2, canvas.width, stripHeight);

        // Draw repeating text
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)"; // Low opacity white text
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";

        // Calculate spacing and repetition
        const spacing = fontSize * 2; // Space between words
        const textWidth = ctx.measureText(textBase).width + spacing;
        const repeatCount = Math.ceil(canvas.width / textWidth) + 1;
        
        // Draw text across the strip
        let currentX = spacing / 2; // Start with some padding
        for (let i = 0; i < repeatCount; i++) {
          ctx.fillText(textBase, currentX, centerY);
          currentX += textWidth;
        }

        // Convert back to file
        canvas.toBlob((blob) => {
          if (blob) {
            const processedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(processedFile);
          } else {
            reject(new Error('Canvas to Blob failed'));
          }
        }, file.type, 0.9); // 0.9 quality
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};
