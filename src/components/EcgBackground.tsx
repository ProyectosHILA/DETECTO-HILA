import React, { useEffect, useRef } from "react";

export const EcgBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // ECG wave points generator: P-Q-R-S-T standard clinical morphology
    const getEcgY = (xPos: number, centerY: number, scale: number = 1): number => {
      // Cycle length in pixels
      const cycleLen = 220;
      const xInCycle = ((xPos % cycleLen) + cycleLen) % cycleLen;

      // Base isoelectric line
      let dy = 0;

      if (xInCycle < 25) {
        // Isoelectric line before P wave
        dy = 0;
      } else if (xInCycle < 45) {
        // P wave (rounded upward deflection, ~10px)
        const pProgress = (xInCycle - 25) / 20;
        dy = -Math.sin(pProgress * Math.PI) * 9 * scale;
      } else if (xInCycle < 60) {
        // PR segment (flat)
        dy = 0;
      } else if (xInCycle < 66) {
        // Q wave (small dip downward, ~6px)
        const qProgress = (xInCycle - 60) / 6;
        dy = Math.sin(qProgress * Math.PI) * 7 * scale;
      } else if (xInCycle < 78) {
        // R wave (sharp tall peak upward, ~55px)
        const rProgress = (xInCycle - 66) / 12;
        dy = -Math.sin(rProgress * Math.PI) * 58 * scale;
      } else if (xInCycle < 88) {
        // S wave (sharp dip below baseline, ~18px)
        const sProgress = (xInCycle - 78) / 10;
        dy = Math.sin(sProgress * Math.PI) * 20 * scale;
      } else if (xInCycle < 110) {
        // ST segment (flat)
        dy = 0;
      } else if (xInCycle < 145) {
        // T wave (asymmetric rounded upward deflection, ~16px)
        const tProgress = (xInCycle - 110) / 35;
        dy = -Math.sin(tProgress * Math.PI) * 16 * scale;
      } else {
        // Isoelectric TP segment
        dy = 0;
      }

      return centerY + dy;
    };

    let offset = 0;

    // 4 translucent blue floating virus elements across the entire background
    interface VirusParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      spikes: number;
      angle: number;
      vAngle: number;
      phase: number;
      alpha: number;
    }

    const viruses: VirusParticle[] = [
      {
        x: width * 0.14,
        y: height * 0.22,
        vx: 0.32,
        vy: 0.18,
        radius: 56,
        spikes: 14,
        angle: 0.2,
        vAngle: 0.0022,
        phase: 0,
        alpha: 0.14,
      },
      {
        x: width * 0.82,
        y: height * 0.26,
        vx: -0.26,
        vy: 0.22,
        radius: 72,
        spikes: 16,
        angle: 1.4,
        vAngle: -0.0017,
        phase: 1.8,
        alpha: 0.12,
      },
      {
        x: width * 0.28,
        y: height * 0.78,
        vx: 0.24,
        vy: -0.21,
        radius: 46,
        spikes: 12,
        angle: 2.5,
        vAngle: 0.0028,
        phase: 3.4,
        alpha: 0.15,
      },
      {
        x: width * 0.74,
        y: height * 0.74,
        vx: -0.3,
        vy: -0.16,
        radius: 64,
        spikes: 14,
        angle: 0.9,
        vAngle: -0.002,
        phase: 5.1,
        alpha: 0.13,
      },
    ];

    const drawTranslucentVirus = (v: VirusParticle, timeTick: number) => {
      const floatY = Math.sin(timeTick * 0.015 + v.phase) * 0.25;
      v.x += v.vx;
      v.y += v.vy + floatY;
      v.angle += v.vAngle;

      const margin = v.radius + 35;
      if (v.x < -margin) v.x = width + margin;
      if (v.x > width + margin) v.x = -margin;
      if (v.y < -margin) v.y = height + margin;
      if (v.y > height + margin) v.y = -margin;

      ctx.save();
      ctx.translate(v.x, v.y);
      ctx.rotate(v.angle);

      // Soft translucent blue outer halo
      const haloGrad = ctx.createRadialGradient(0, 0, v.radius * 0.2, 0, 0, v.radius * 1.35);
      haloGrad.addColorStop(0, `rgba(14, 165, 233, ${v.alpha * 0.95})`);
      haloGrad.addColorStop(0.65, `rgba(2, 132, 199, ${v.alpha * 0.55})`);
      haloGrad.addColorStop(1, "rgba(2, 132, 199, 0)");

      // Draw spikes (glycoprotein crowns)
      const spikeLen = v.radius * 0.28;
      ctx.strokeStyle = `rgba(2, 132, 199, ${v.alpha * 1.15})`;
      ctx.fillStyle = `rgba(56, 189, 248, ${v.alpha * 1.25})`;
      ctx.lineWidth = 2;

      for (let i = 0; i < v.spikes; i++) {
        const theta = (i / v.spikes) * Math.PI * 2;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        const xStart = cosT * (v.radius - 2);
        const yStart = sinT * (v.radius - 2);
        const xEnd = cosT * (v.radius + spikeLen);
        const yEnd = sinT * (v.radius + spikeLen);

        ctx.beginPath();
        ctx.moveTo(xStart, yStart);
        ctx.lineTo(xEnd, yEnd);
        ctx.stroke();

        // Rounded crown knob at tip
        ctx.beginPath();
        ctx.arc(xEnd, yEnd, Math.max(2.6, v.radius * 0.068), 0, Math.PI * 2);
        ctx.fill();
      }

      // Main translucent viral envelope body
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(0, 0, v.radius, 0, Math.PI * 2);
      ctx.fill();

      // Delicate viral membrane ring
      ctx.strokeStyle = `rgba(2, 132, 199, ${v.alpha * 1.35})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, v.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner capsid ring & subtle translucent organelles
      ctx.strokeStyle = `rgba(56, 189, 248, ${v.alpha * 0.9})`;
      ctx.lineWidth = 1.1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, v.radius * 0.62, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = `rgba(14, 165, 233, ${v.alpha * 0.85})`;
      const innerDots = 5;
      for (let d = 0; d < innerDots; d++) {
        const da = (d / innerDots) * Math.PI * 2 + 0.35;
        const dr = v.radius * 0.32;
        ctx.beginPath();
        ctx.arc(Math.cos(da) * dr, Math.sin(da) * dr, v.radius * 0.075, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Y center for the ECG wave (around vertical middle)
      const centerY = height * 0.48;

      // 1. Draw subtle clinical medical grid
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(14, 165, 233, 0.04)"; // very subtle cyan/slate grid
      const gridSize = 40;

      ctx.beginPath();
      for (let x = 0; x <= width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y <= height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // 1b. Draw the 4 translucent floating blue viruses behind the ECG pulse & main UI
      for (const v of viruses) {
        drawTranslucentVirus(v, offset);
      }

      // 2. Draw Subtle Static Metallic Blue Reference Baseline (very faint)
      ctx.beginPath();
      ctx.strokeStyle = "rgba(2, 132, 199, 0.12)";
      ctx.lineWidth = 1.5;
      for (let x = 0; x < width; x += 3) {
        const y = getEcgY(x - offset, centerY, 0.9);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 3. Draw Active Glowing Metallic Blue Pulse Wave
      // The leading beam sweeps across the screen
      const pulseHeadX = (offset * 1.8) % (width + 400) - 200;
      const trailLength = 450;

      // Create a gradient for the sweeping metallic blue pulse
      const gradient = ctx.createLinearGradient(pulseHeadX - trailLength, centerY, pulseHeadX, centerY);
      gradient.addColorStop(0, "rgba(2, 132, 199, 0)");
      gradient.addColorStop(0.5, "rgba(14, 165, 233, 0.4)");
      gradient.addColorStop(0.85, "rgba(56, 189, 248, 0.85)");
      gradient.addColorStop(1, "rgba(96, 165, 250, 1)");

      ctx.save();
      ctx.shadowColor = "#0284c7";
      ctx.shadowBlur = 12;
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2.8;

      ctx.beginPath();
      const startX = Math.max(0, pulseHeadX - trailLength);
      const endX = Math.min(width, pulseHeadX);

      let started = false;
      for (let x = startX; x <= endX; x += 2) {
        const y = getEcgY(x - offset, centerY, 0.9);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // 4. Draw Leading Cardiac Glowing Particle (metallic blue spark)
      if (pulseHeadX >= 0 && pulseHeadX <= width) {
        const leadY = getEcgY(pulseHeadX - offset, centerY, 0.9);

        // Core glowing dot
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 18;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(pulseHeadX, leadY, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Outer metallic aura ring
        ctx.strokeStyle = "rgba(14, 165, 233, 0.8)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pulseHeadX, leadY, 7, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();

      // Advance wave offset for smooth motion
      offset += 1.35;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#f4f6f9]">
      {/* Dynamic ambient color gradients in light tones */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-sky-200/40 via-cyan-100/30 to-transparent blur-3xl animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tl from-blue-200/30 via-indigo-100/20 to-transparent blur-3xl animate-pulse duration-[10000ms]" />
      <div className="absolute top-[40%] right-[20%] w-[35vw] h-[35vw] rounded-full bg-gradient-to-r from-teal-100/25 via-sky-100/20 to-transparent blur-3xl" />

      {/* HTML5 Canvas with the Metallic Blue ECG Cardiac Pulse */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};
