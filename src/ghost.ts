const STIFFNESS = 0.24;
const DAMPING = 0.66;
const TILT = 0.9;
const MAX_TILT = 14;
const FRAME = 1000 / 60;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

export class DragGhost {
  private x = 0;
  private y = 0;
  private vx = 0;
  private vy = 0;
  private tx = 0;
  private ty = 0;
  private angle = 0;
  private scale = 0.85;
  private targetScale = 1.04;
  private width = 0;
  private height = 0;
  private raf = 0;
  private last = 0;
  private hideTimer = 0;

  constructor(private readonly el: HTMLElement) {}

  start(html: string, x: number, y: number) {
    clearTimeout(this.hideTimer);
    this.el.innerHTML = html;
    this.el.classList.remove("leaving");
    this.el.hidden = false;
    this.width = this.el.offsetWidth;
    this.height = this.el.offsetHeight;
    this.x = this.tx = x;
    this.y = this.ty = y;
    this.vx = this.vy = this.angle = 0;
    this.scale = 0.85;
    this.targetScale = 1.04;
    this.last = performance.now();
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(this.frame);
  }

  moveTo(x: number, y: number) {
    this.tx = x;
    this.ty = y;
  }

  end(toward: { x: number; y: number } | null) {
    if (toward && !reducedMotion.matches) {
      this.tx = toward.x;
      this.ty = toward.y;
      this.targetScale = 0.55;
    } else {
      this.targetScale = 0.9;
    }
    this.el.classList.add("leaving");
    this.hideTimer = window.setTimeout(() => {
      cancelAnimationFrame(this.raf);
      this.el.hidden = true;
    }, 260);
  }

  private frame = (now: number) => {
    if (reducedMotion.matches) {
      this.el.style.transform = `translate(${this.tx - this.width / 2}px, ${this.ty - this.height / 2}px)`;
      this.raf = requestAnimationFrame(this.frame);
      return;
    }

    const steps = Math.min(4, Math.max(1, Math.round((now - this.last) / FRAME)));
    this.last = now;
    for (let i = 0; i < steps; i++) {
      this.vx = (this.vx + (this.tx - this.x) * STIFFNESS) * DAMPING;
      this.vy = (this.vy + (this.ty - this.y) * STIFFNESS) * DAMPING;
      this.x += this.vx;
      this.y += this.vy;
      const tilt = Math.max(-MAX_TILT, Math.min(MAX_TILT, this.vx * TILT));
      this.angle += (tilt - this.angle) * 0.25;
      this.scale += (this.targetScale - this.scale) * 0.2;
    }
    this.el.style.transform =
      `translate(${this.x - this.width / 2}px, ${this.y - this.height / 2}px) ` +
      `rotate(${this.angle}deg) scale(${this.scale})`;
    this.raf = requestAnimationFrame(this.frame);
  };
}
