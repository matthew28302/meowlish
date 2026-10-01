'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  rotation: number;
  vRot: number;
  shape: 'star' | 'circle' | 'spark' | 'paw';
  maxLife: number;
  life: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
  lineWidth: number;
}

const COLORS = [
  '#10b981', // emerald
  '#34d399', // mint
  '#f59e0b', // amber
  '#fbbf24', // yellow
  '#f97316', // orange
  '#ec4899', // pink
  '#38bdf8', // sky
];

export default function ClickEffect() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const animIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Spawn click effect (sparks & ripples)
    const spawnClickEffect = (x: number, y: number) => {
      const color1 = COLORS[Math.floor(Math.random() * COLORS.length)];
      const color2 = COLORS[Math.floor(Math.random() * COLORS.length)];

      ripplesRef.current.push({
        x,
        y,
        radius: 2,
        maxRadius: 28 + Math.random() * 8,
        alpha: 0.8,
        color: color1,
        lineWidth: 2.5,
      });

      ripplesRef.current.push({
        x,
        y,
        radius: 0,
        maxRadius: 42 + Math.random() * 10,
        alpha: 0.5,
        color: color2,
        lineWidth: 1.5,
      });

      const count = 7 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
        const speed = 1.8 + Math.random() * 3.2;
        const shapes: ('star' | 'circle' | 'spark')[] = ['star', 'circle', 'spark'];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const maxLife = 22 + Math.floor(Math.random() * 14);

        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.6,
          size: shape === 'star' ? 4 + Math.random() * 3 : 2.5 + Math.random() * 2.5,
          alpha: 1,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.25,
          shape,
          maxLife,
          life: maxLife,
        });
      }

      startAnimation();
    };

    // Spawn subtle drag trail particle (floating pastel paw / spark dust)
    const spawnDragParticle = (x: number, y: number) => {
      if (Math.random() > 0.45) return; // Limit frequency for smoothness

      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 1.5;
      const maxLife = 14 + Math.floor(Math.random() * 10);

      particlesRef.current.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed * 0.5,
        vy: Math.sin(angle) * speed * 0.5 - 0.3,
        size: 2.5 + Math.random() * 2.5,
        alpha: 0.85,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.15,
        shape: Math.random() > 0.5 ? 'spark' : 'circle',
        maxLife,
        life: maxLife,
      });

      startAnimation();
    };

    // Spawn drop release effect (when mouse is released after dragging)
    const spawnDropEffect = (x: number, y: number) => {
      ripplesRef.current.push({
        x,
        y,
        radius: 4,
        maxRadius: 36,
        alpha: 0.9,
        color: '#10b981',
        lineWidth: 2.5,
      });

      const count = 6;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = 2 + Math.random() * 2;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.5,
          size: 3 + Math.random() * 2,
          alpha: 1,
          color: COLORS[i % COLORS.length],
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.2,
          shape: 'star',
          maxLife: 20,
          life: 20,
        });
      }

      startAnimation();
    };

    const drawStar = (
      c: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      spikes: number,
      outerRadius: number,
      innerRadius: number
    ) => {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      c.beginPath();
      c.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        c.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        c.lineTo(x, y);
        rot += step;
      }
      c.lineTo(cx, cy - outerRadius);
      c.closePath();
      c.fill();
    };

    const render = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, width, height);

      // Render & update ripples
      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const r = ripplesRef.current[i];
        r.radius += (r.maxRadius - r.radius) * 0.18 + 0.5;
        r.alpha *= 0.88;

        if (r.alpha < 0.02 || r.radius >= r.maxRadius) {
          ripplesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = r.color;
        ctx.globalAlpha = r.alpha;
        ctx.lineWidth = r.lineWidth;
        ctx.stroke();
        ctx.restore();
      }

      // Render & update particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.life--;
        p.alpha = Math.max(0, p.life / p.maxLife);
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.rotation += p.vRot;

        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        if (p.shape === 'star') {
          drawStar(ctx, 0, 0, 4, p.size, p.size * 0.45);
        } else if (p.shape === 'spark') {
          ctx.beginPath();
          ctx.moveTo(0, -p.size * 1.3);
          ctx.lineTo(p.size * 0.5, 0);
          ctx.lineTo(0, p.size * 1.3);
          ctx.lineTo(-p.size * 0.5, 0);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      if (ripplesRef.current.length > 0 || particlesRef.current.length > 0) {
        animIdRef.current = requestAnimationFrame(render);
      } else {
        animIdRef.current = null;
      }
    };

    const startAnimation = () => {
      if (animIdRef.current === null) {
        animIdRef.current = requestAnimationFrame(render);
      }
    };

    // Drag-and-drop & Click state tracker
    let isPointerDown = false;
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    const handlePointerDown = (e: PointerEvent) => {
      isPointerDown = true;
      isDragging = false;
      startX = e.clientX;
      startY = e.clientY;

      document.documentElement.classList.add('mouse-down');
      spawnClickEffect(e.clientX, e.clientY);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return;

      const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
      // Once moved beyond 5px while mouse is held down, enter DRAGGING state
      if (dist >= 5) {
        if (!isDragging) {
          isDragging = true;
          document.documentElement.classList.remove('mouse-down');
          document.documentElement.classList.add('mouse-dragging');
        }
        // Spawn subtle trailing particles as user drags
        spawnDragParticle(e.clientX, e.clientY);
      }
    };

    const resetMouseState = () => {
      isPointerDown = false;
      isDragging = false;
      document.documentElement.classList.remove('mouse-down');
      document.documentElement.classList.remove('mouse-dragging');
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (isDragging) {
        spawnDropEffect(e.clientX, e.clientY);
      }
      resetMouseState();
    };

    // Native HTML5 Drag and Drop events
    const handleDragStart = () => {
      document.documentElement.classList.add('mouse-dragging');
    };

    const handleDragEnd = (e: DragEvent) => {
      document.documentElement.classList.remove('mouse-dragging');
      if (e.clientX && e.clientY) {
        spawnDropEffect(e.clientX, e.clientY);
      }
    };

    // Prevent browser default navigation when dropping text or elements anywhere on window
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
      handleDragEnd(e);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    window.addEventListener('blur', resetMouseState);

    window.addEventListener('dragstart', handleDragStart);
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('dragend', handleDragEnd);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('blur', resetMouseState);
      window.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('dragend', handleDragEnd);
      window.removeEventListener('drop', handleWindowDrop);

      if (animIdRef.current !== null) {
        cancelAnimationFrame(animIdRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[99999] select-none"
      aria-hidden="true"
    />
  );
}
