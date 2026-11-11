const VERT = `attribute vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform vec2 res;
uniform float time;
uniform float push;
uniform float stir;
uniform float dim;
uniform vec3 c1;
uniform vec3 c2;
uniform vec3 c3;
uniform vec3 c4;

float weight(vec2 p, vec2 center) {
  vec2 d = p - center;
  return exp(-dot(d, d) * 2.4);
}

void main() {
  float aspect = res.x / res.y;
  vec2 p = gl_FragCoord.xy / res;
  p.x *= aspect;
  float s = time * 0.05 + push * 1.3;

  float wave = 0.02 + stir * 0.05;
  p += wave * vec2(sin(p.y * 2.2 + s * 1.3), sin(p.x * 2.2 - s * 1.1));

  vec2 a1 = vec2(0.15 * aspect, 0.85) + 0.16 * vec2(sin(s * 0.9), cos(s * 0.7));
  vec2 a2 = vec2(0.85 * aspect, 0.8) + 0.16 * vec2(cos(s * 0.6), sin(s * 0.8));
  vec2 a3 = vec2(0.6 * aspect, 0.1) + 0.16 * vec2(sin(s * 0.7 + 2.0), cos(s * 0.5));
  vec2 a4 = vec2(0.2 * aspect, 0.25) + 0.16 * vec2(cos(s * 0.8 + 1.0), sin(s * 0.6));

  float w1 = weight(p, a1);
  float w2 = weight(p, a2);
  float w3 = weight(p, a3);
  float w4 = weight(p, a4) * 0.7;
  float base = 0.08;
  // Blend in linear light: averaging light colors in sRGB muddies them toward brown.
  vec3 l1 = pow(c1, vec3(2.2));
  vec3 l2 = pow(c2, vec3(2.2));
  vec3 l3 = pow(c3, vec3(2.2));
  vec3 l4 = pow(c4, vec3(2.2));
  vec3 lin = (l1 * w1 + l2 * w2 + l3 * w3 + l4 * w4 + l2 * base) / (w1 + w2 + w3 + w4 + base);
  vec3 col = pow(lin, vec3(1.0 / 2.2));
  col = mix(vec3(dot(col, vec3(0.299, 0.587, 0.114))), col, 1.15);
  gl_FragColor = vec4(col * dim, 1.0);
}`;

const SCALE = 0.25;

export interface Liquid {
  flow(dir: number): void;
  stop(): void;
}

export function startLiquid(host: HTMLElement): Liquid | null {
  const canvas = document.createElement("canvas");
  canvas.className = "ob-liquid";
  canvas.setAttribute("aria-hidden", "true");
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
  if (!gl) return null;

  const shader = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const program = gl.createProgram()!;
  gl.attachShader(program, shader(gl.VERTEX_SHADER, VERT));
  gl.attachShader(program, shader(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const a = gl.getAttribLocation(program, "a");
  gl.enableVertexAttribArray(a);
  gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);

  const u = (name: string) => gl.getUniformLocation(program, name);
  const uRes = u("res");
  const uTime = u("time");
  const uPush = u("push");
  const uStir = u("stir");
  const uDim = u("dim");
  const uColors = [u("c1"), u("c2"), u("c3"), u("c4")];

  const probe = document.createElement("i");
  probe.hidden = true;
  host.append(probe);
  const rgb = (css: string) => {
    probe.style.color = css;
    const [r, g, b] = getComputedStyle(probe).color.match(/[\d.]+/g)!.map(Number);
    return [r / 255, g / 255, b / 255];
  };

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const isDark = () => document.documentElement.dataset.theme === "dark";
  let dim = isDark() ? 0.5 : 1;
  let dimTarget = dim;
  let push = 0;
  let pushTarget = 0;
  let time = 0;
  let last = performance.now();
  let frame = 0;

  function readColors() {
    const colors = [
      "var(--space-1)",
      "var(--space-2)",
      "var(--space-3)",
      "color-mix(in oklab, var(--space-2) 55%, white)",
    ];
    colors.forEach((c, i) => gl!.uniform3fv(uColors[i], rgb(c)));
  }

  function resize() {
    canvas.width = Math.max(1, Math.ceil(host.clientWidth * SCALE));
    canvas.height = Math.max(1, Math.ceil(host.clientHeight * SCALE));
    gl!.viewport(0, 0, canvas.width, canvas.height);
    gl!.uniform2f(uRes, canvas.width, canvas.height);
    if (reducedMotion.matches) draw();
  }

  function draw() {
    gl!.uniform1f(uTime, time);
    gl!.uniform1f(uPush, push);
    gl!.uniform1f(uStir, Math.min(1, Math.abs(pushTarget - push)));
    gl!.uniform1f(uDim, dim);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
  }

  function tick(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;
    push += (pushTarget - push) * (1 - Math.exp(-dt * 1.8));
    dim += (dimTarget - dim) * (1 - Math.exp(-dt * 8));
    draw();
    frame = requestAnimationFrame(tick);
  }

  const themeWatch = new MutationObserver(() => {
    dimTarget = isDark() ? 0.5 : 1;
    readColors();
    if (reducedMotion.matches) {
      dim = dimTarget;
      draw();
    }
  });
  themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "style"] });

  const sizeWatch = new ResizeObserver(resize);
  sizeWatch.observe(host);

  host.prepend(canvas);
  readColors();
  resize();
  if (reducedMotion.matches) draw();
  else frame = requestAnimationFrame(tick);

  return {
    flow(dir) {
      pushTarget += dir;

      if (reducedMotion.matches) {
        push = pushTarget;
        draw();
      }
    },
    stop() {
      cancelAnimationFrame(frame);
      themeWatch.disconnect();
      sizeWatch.disconnect();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
