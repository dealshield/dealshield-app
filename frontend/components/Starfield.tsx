"use client";

import React, { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  z: number;
  prevX: number;
  prevY: number;
}

const Starfield = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    let animationFrameId: number;

    const STAR_COUNT = 400; // Number of stars
    const SPEED = 0.5; // Speed of stars

    const init = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      
      stars = [];
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: Math.random() * width - width / 2,
          y: Math.random() * height - height / 2,
          z: Math.random() * width,
          prevX: 0,
          prevY: 0,
        });
      }
    };

    const update = () => {
      // Clear canvas with a very slight fade effect for trails (optional, but clean clear is better for sharp stars)
      // ctx.fillStyle = "rgba(3, 0, 20, 0.2)"; // Trail effect
      // ctx.fillRect(0, 0, width, height);
      
      // Clear fully for crisp stars on the dark background from CSS
      ctx.clearRect(0, 0, width, height);
      
      const cx = width / 2;
      const cy = height / 2;

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Move star closer
        star.z -= SPEED;

        // Reset star if it passes the screen
        if (star.z <= 0) {
          star.x = Math.random() * width - width / 2;
          star.y = Math.random() * height - height / 2;
          star.z = width;
          star.prevX = 0;
          star.prevY = 0;
        }

        // Project 3D coordinates to 2D
        const x = (star.x / star.z) * width + cx;
        const y = (star.y / star.z) * height + cy;

        // Calculate size based on depth
        const size = (1 - star.z / width) * 2.5;
        
        // Calculate opacity based on depth
        const opacity = (1 - star.z / width);

        // Draw star
        if (x >= 0 && x < width && y >= 0 && y < height && star.z < width) {
           ctx.beginPath();
           ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
           ctx.arc(x, y, size > 0 ? size : 0, 0, Math.PI * 2);
           ctx.fill();
        }
        
        star.prevX = x;
        star.prevY = y;
      }

      animationFrameId = requestAnimationFrame(update);
    };

    // Handle resize
    const handleResize = () => {
      init();
    };

    window.addEventListener("resize", handleResize);
    
    // Initial setup
    init();
    update();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.6 }} // Subtle overlay
    />
  );
};

export default Starfield;
