import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface CaseData {
  ano: number;
  casos: number;
  obitos: number;
}

interface Props {
  data: CaseData[];
}

export default function CasesChart3D({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [useFallback, setUseFallback] = useState(false);
  const [tooltipData, setTooltipData] = useState<{ x: number; y: number; text: string } | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const barsRef = useRef<THREE.Mesh[]>([]);
  const animFrameRef = useRef<number>(0);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const rotation = useRef({ x: 0.3, y: -0.4 });
  const reducedMotion = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // Check WebGL support
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
      if (!gl) { setUseFallback(true); return; }
    } catch { setUseFallback(true); return; }

    // Detect weak device
    const cores = navigator.hardwareConcurrency || 2;
    const isWeak = cores <= 2;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0eee2);
    scene.fog = new THREE.Fog(0xf0eee2, 20, 50);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(8, 6, 12);
    camera.lookAt(0, 1, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: !isWeak,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isWeak ? 1 : 2));
    renderer.shadowMap.enabled = !isWeak;
    if (!isWeak) renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(5, 10, 7);
    if (!isWeak) {
      directional.castShadow = true;
      directional.shadow.mapSize.width = 512;
      directional.shadow.mapSize.height = 512;
    }
    scene.add(directional);

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(20, 12);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0xe8e6d8, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = !isWeak;
    scene.add(ground);

    // Bars
    const maxCasos = Math.max(...data.map(d => d.casos));
    const barWidth = 0.3;
    const gap = 0.12;
    const totalWidth = data.length * (barWidth + gap);
    const startX = -totalWidth / 2;
    const bars: THREE.Mesh[] = [];

    data.forEach((d, i) => {
      const barHeight = (d.casos / maxCasos) * 5;
      const isSurto = d.ano >= 2017 && d.ano <= 2019;
      
      const geo = new THREE.BoxGeometry(barWidth, barHeight, barWidth * 1.5);
      const mat = new THREE.MeshStandardMaterial({
        color: isSurto ? 0xc6a120 : 0x143f30,
        roughness: 0.4,
        metalness: 0.1,
      });
      const bar = new THREE.Mesh(geo, mat);
      bar.position.set(startX + i * (barWidth + gap) + barWidth / 2, barHeight / 2, 0);
      bar.castShadow = !isWeak;
      bar.receiveShadow = !isWeak;
      bar.userData = { ano: d.ano, casos: d.casos, obitos: d.obitos, isSurto };
      
      // Start with scale 0 for animation
      if (!reducedMotion) {
        bar.scale.y = 0;
      }
      
      scene.add(bar);
      bars.push(bar);
    });
    barsRef.current = bars;

    // Animate bars entrance
    if (!reducedMotion) {
      const startTime = performance.now();
      const animateEntrance = (now: number) => {
        const elapsed = (now - startTime) / 1000;
        bars.forEach((bar, i) => {
          const delay = i * 0.03;
          const t = Math.max(0, Math.min(1, (elapsed - delay) / 0.5));
          const eased = 1 - Math.pow(1 - t, 3);
          bar.scale.y = eased;
        });
        if (elapsed < bars.length * 0.03 + 0.5) {
          requestAnimationFrame(animateEntrance);
        }
      };
      requestAnimationFrame(animateEntrance);
    }

    // Raycaster for tooltips
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseMove = (event: MouseEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging.current) {
        const dx = event.clientX - lastMouse.current.x;
        const dy = event.clientY - lastMouse.current.y;
        rotation.current.y += dx * 0.005;
        rotation.current.x += dy * 0.005;
        rotation.current.x = Math.max(-0.5, Math.min(0.8, rotation.current.x));
        lastMouse.current = { x: event.clientX, y: event.clientY };
      }

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(bars);
      
      if (intersects.length > 0) {
        const obj = intersects[0].object;
        const d = obj.userData;
        setTooltipData({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top - 40,
          text: `${d.ano}: ${d.casos} casos · ${d.obitos} óbitos${d.isSurto ? ' ⚠️ Surto' : ''}`,
        });
        (obj as THREE.Mesh).material = new THREE.MeshStandardMaterial({
          color: d.isSurto ? 0xe8b820 : 0x1a5a40,
          roughness: 0.3,
          metalness: 0.2,
          emissive: d.isSurto ? 0x3a2800 : 0x0a2a1f,
          emissiveIntensity: 0.3,
        });
      } else {
        setTooltipData(null);
        bars.forEach(bar => {
          const d = bar.userData;
          (bar as THREE.Mesh).material = new THREE.MeshStandardMaterial({
            color: d.isSurto ? 0xc6a120 : 0x143f30,
            roughness: 0.4,
            metalness: 0.1,
          });
        });
      }
    };

    const onMouseDown = (event: MouseEvent) => {
      isDragging.current = true;
      lastMouse.current = { x: event.clientX, y: event.clientY };
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    canvasRef.current.addEventListener('mousemove', onMouseMove);
    canvasRef.current.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    // Touch support
    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        const touch = event.touches[0];
        const rect = canvasRef.current!.getBoundingClientRect();
        const dx = touch.clientX - lastMouse.current.x;
        const dy = touch.clientY - lastMouse.current.y;
        if (isDragging.current) {
          rotation.current.y += dx * 0.005;
          rotation.current.x += dy * 0.005;
          rotation.current.x = Math.max(-0.5, Math.min(0.8, rotation.current.x));
        }
        lastMouse.current = { x: touch.clientX, y: touch.clientY };
      }
    };

    const onTouchStart = (event: TouchEvent) => {
      isDragging.current = true;
      if (event.touches.length === 1) {
        lastMouse.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      }
    };

    canvasRef.current.addEventListener('touchstart', onTouchStart, { passive: true });
    canvasRef.current.addEventListener('touchmove', onTouchMove, { passive: true });
    canvasRef.current.addEventListener('touchend', () => { isDragging.current = false; });

    // Render loop
    const render = () => {
      if (!reducedMotion && !isDragging.current) {
        rotation.current.y += 0.001;
      }
      camera.position.x = 12 * Math.sin(rotation.current.y) * Math.cos(rotation.current.x);
      camera.position.y = 6 + 4 * Math.sin(rotation.current.x);
      camera.position.z = 12 * Math.cos(rotation.current.y) * Math.cos(rotation.current.x);
      camera.lookAt(0, 1.5, 0);
      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(render);
    };
    render();

    // Resize
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      canvasRef.current?.removeEventListener('mousemove', onMouseMove);
      canvasRef.current?.removeEventListener('mousedown', onMouseDown);
      canvasRef.current?.removeEventListener('touchstart', onTouchStart);
      canvasRef.current?.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      scene.clear();
    };
  }, [data, reducedMotion]);

  if (useFallback) {
    return <FallbackChart data={data} />;
  }

  return (
    <div className="chart-3d-container" ref={containerRef} role="img" aria-label="Gráfico 3D interativo de casos confirmados de febre amarela no Brasil de 2000 a 2024. Arraste para rotacionar.">
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      {tooltipData && (
        <div
          ref={tooltipRef}
          className="chart-tooltip visible"
          style={{ left: tooltipData.x, top: tooltipData.y, transform: 'translateX(-50%)' }}
        >
          {tooltipData.text}
        </div>
      )}
      <div className="chart-controls">
        <button onClick={() => { rotation.current = { x: 0.3, y: -0.4 }; }} title="Resetar vista" aria-label="Resetar vista">↺</button>
      </div>
    </div>
  );
}

// Fallback 2D chart using Canvas
function FallbackChart({ data }: { data: CaseData[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = { top: 30, right: 20, bottom: 50, left: 50 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;
    const maxCasos = Math.max(...data.map(d => d.casos));
    const barW = chartW / data.length * 0.7;
    const gap = chartW / data.length * 0.3;

    // Background
    ctx.fillStyle = '#f0eee2';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#dfdfd1';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartH / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
      
      ctx.fillStyle = '#5c6d60';
      ctx.font = '10px DM Sans, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxCasos - (maxCasos / 5) * i).toString(), padding.left - 8, y + 4);
    }

    // Bars
    data.forEach((d, i) => {
      const barH = (d.casos / maxCasos) * chartH;
      const x = padding.left + i * (barW + gap) + gap / 2;
      const y = padding.top + chartH - barH;
      const isSurto = d.ano >= 2017 && d.ano <= 2019;

      ctx.fillStyle = isSurto ? '#c6a120' : '#143f30';
      ctx.fillRect(x, y, barW, barH);

      // Year label
      if (i % 3 === 0 || isSurto) {
        ctx.fillStyle = '#5c6d60';
        ctx.font = '9px DM Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.save();
        ctx.translate(x + barW / 2, h - padding.bottom + 15);
        ctx.rotate(-Math.PI / 4);
        ctx.fillText(d.ano.toString(), 0, 0);
        ctx.restore();
      }
    });

    // Title
    ctx.fillStyle = '#143f30';
    ctx.font = 'bold 11px Manrope, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Casos confirmados', padding.left, 18);
  }, [data]);

  return (
    <div className="chart-3d-container" role="img" aria-label="Gráfico de barras 2D mostrando casos de febre amarela no Brasil de 2000 a 2024.">
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
