import React, { useEffect, useRef } from "react";

/*
ProcessingLoginCanvas — Human typing (realistic motion, ultra lightweight)

Improvements:
✔ two hands alternating typing
✔ shoulder motion
✔ forearm motion
✔ head bob + breathing
✔ blinking eyes
✔ key press feedback
✔ smoother anatomy (rounded shapes)
✔ still extremely cheap rendering
*/

export default function ProcessingLoginCanvas({ height = 340 }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const timeRef = useRef(0);

  /* ---------- canvas sizing ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    canvas.style.width = "100%";
    canvas.style.height = `${height}px`;
    resize();

    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [height]);

  /* ---------- animation loop ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    function loop() {
      rafRef.current = requestAnimationFrame(loop);

      timeRef.current += 0.016;
      const t = timeRef.current;

      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // background card
      ctx.fillStyle = "rgba(0,0,0,0.04)";
      ctx.fillRect(4, 4, w - 8, h - 8);

      const deskY = h * 0.65;

      drawDesk(ctx, w, deskY);
      drawServer(ctx, w * 0.82, deskY - 90, t);
      drawKeyboard(ctx, w * 0.65, deskY - 5, t);
      drawHuman(ctx, w * 0.52, deskY - 10, t);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="w-full flex items-center justify-center py-4" aria-hidden>
      <div className="relative rounded-xl overflow-hidden w-full" style={{ height }}>
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
    </div>
  );
}

/* ---------- drawing ---------- */

function drawDesk(ctx, w, y) {
  ctx.fillStyle = "#ddd";
  ctx.fillRect(0, y, w, 4);
}

/* server monitor */
function drawServer(ctx, x, y, t) {
  ctx.save();

  ctx.fillStyle = "#06202a";
  ctx.fillRect(x - 60, y - 40, 120, 80);

  // typing flicker
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  const flicker = (Math.sin(t * 8) + 1) * 0.5;

  for (let i = 0; i < 5; i++) {
    ctx.fillRect(x - 45, y - 25 + i * 10, 90 * flicker, 3);
  }

  ctx.restore();
}

/* keyboard with key press feedback */
function drawKeyboard(ctx, x, y, t) {
  ctx.save();

  ctx.fillStyle = "#111";
  ctx.fillRect(x - 80, y, 160, 18);

  // key press zones
  const press1 = Math.sin(t * 10) > 0.5;
  const press2 = Math.sin(t * 10 + Math.PI) > 0.5;

  ctx.fillStyle = press1 ? "#444" : "#222";
  ctx.fillRect(x - 40, y + 4, 30, 8);

  ctx.fillStyle = press2 ? "#444" : "#222";
  ctx.fillRect(x + 10, y + 4, 30, 8);

  ctx.restore();
}

/* genderless human torso typing */
function drawHuman(ctx, x, y, t) {
  ctx.save();
  ctx.translate(x, y);

  /* motion signals */
  const breathe = Math.sin(t * 1.5) * 1.5;
  const headBob = Math.sin(t * 2) * 1.5;
  const leftArm = Math.sin(t * 10) * 8;
  const rightArm = Math.sin(t * 10 + Math.PI) * 8;

  // blink every ~3s
  const blink = Math.sin(t * 0.7) > 0.95 ? 0.2 : 1;

  /* torso */
  ctx.fillStyle = "#7aa7ff";
  roundRect(ctx, -30, -40 + breathe, 50, 60, 12);
  ctx.fill();

  /* shoulder mass */
  ctx.beginPath();
  ctx.arc(10, -35 + breathe, 18, 0, Math.PI * 2);
  ctx.fillStyle = "#7aa7ff";
  ctx.fill();

  /* neck */
  ctx.fillStyle = "#f1c27d";
  ctx.fillRect(14, -50 + breathe, 8, 10);

  /* head */
  ctx.beginPath();
  ctx.arc(24, -65 + headBob, 16, 0, Math.PI * 2);
  ctx.fillStyle = "#f1c27d";
  ctx.fill();

  /* nose (side profile) */
  ctx.beginPath();
  ctx.arc(40, -65 + headBob, 3, 0, Math.PI * 2);
  ctx.fill();

  /* eye */
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(26, -67 + headBob, 3, 3 * blink, 0, 0, Math.PI * 2);
  ctx.fill();

  /* upper arm */
  ctx.strokeStyle = "#7aa7ff";
  ctx.lineWidth = 10;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(10, -20);
  ctx.lineTo(40, -15 + leftArm * 0.3);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(10, -10);
  ctx.lineTo(40, -5 + rightArm * 0.3);
  ctx.stroke();

  /* forearms */
  ctx.strokeStyle = "#7aa7ff";
  ctx.lineWidth = 8;

  ctx.beginPath();
  ctx.moveTo(40, -15 + leftArm * 0.3);
  ctx.lineTo(70, -10 + leftArm);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(40, -5 + rightArm * 0.3);
  ctx.lineTo(70, -2 + rightArm);
  ctx.stroke();

  /* hands */
  ctx.fillStyle = "#f1c27d";

  ctx.beginPath();
  ctx.arc(72, -10 + leftArm, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(72, -2 + rightArm, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/* helper */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}