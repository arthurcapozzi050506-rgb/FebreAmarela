# 🚀 Soluções Práticas - PageSpeed 84 → 95+

## 📊 Status Atual
- **Performance:** 84/100
- **TBT:** 0ms ✅
- **CLS:** 0 ✅
- **Problemas restantes:** 3 bloqueadores + 1 acessibilidade

---

## 🔧 SOLUÇÃO 1: CSS Bloqueando Renderização (150ms)

### Problema
O arquivo `/assets/index-BMKUbPGb.css` (8.4 KiB) aparece duplicado no relatório.

### Solução Implementada
O `index.html` já está configurado corretamente com:

```html
<!-- Critical CSS Inline (acima da dobra) -->
<style>
  *,*::before,*::after{box-sizing:border-box}
  body{margin:0;font-family:'DM Sans',system-ui,sans-serif;color:#143f30;background:#f8f6ed}
  /* ... CSS crítico ... */
</style>

<!-- CSS completo carregado de forma não-bloqueante -->
<link rel="preload" as="style" href="/assets/index-BMKUbPGb.css" />
<link rel="stylesheet" href="/assets/index-BMKUbPGb.css" media="print" onload="this.media='all'" />
<noscript><link rel="stylesheet" href="/assets/index-BMKUbPGb.css" /></noscript>
```

### Verificação
Se o problema persistir, verifique se há **dois links** para o mesmo CSS no HTML final. Execute:

```bash
# Após o build, verificar se há duplicação
grep -c "index-BMKUbPGb.css" dist/index.html
```

**Resultado esperado:** 3 ocorrências (preload + stylesheet + noscript)

### Alternativa: Plugin Vite para Critical CSS Automático

Se quiser automatizar, instale o plugin:

```bash
npm install --save-dev vite-plugin-critical-css
```

**Arquivo:** `vite.config.js`

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import criticalCss from 'vite-plugin-critical-css';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    criticalCss({
      // Extrai automaticamente CSS crítico
      outputDir: 'dist',
      criticalPrefix: 'critical-',
    }),
  ],
  build: {
    target: 'es2020',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'gsap': ['gsap'],
        },
      },
    },
    cssCodeSplit: true,
    sourcemap: false,
  },
});
```

---

## 🔧 SOLUÇÃO 2: Forced Reflow no JavaScript (183ms)

### Problema
O `vendor-D3F3s8fL.js` está causando "Forced Reflow" ao ler propriedades geométricas após alterar o DOM.

### Causa
Padrão problemático no código:

```typescript
// ❌ ANTES (causa reflow)
element.style.width = '100px';
const width = element.offsetWidth; // Lê após escrever → FORCED REFLOW
element.style.height = `${width * 2}px`;
```

### Solução: Read/Write Batching

**Arquivo:** `src/hooks/useGsapAnimations.ts`

Substitua as funções que leem propriedades geométricas por este padrão:

```typescript
// ✅ DEPOIS (sem reflow)
function initMicroInteractions(q, rootRef) {
  const buttons = q('.button, .text-link').filter(el => el instanceof HTMLElement);
  
  buttons.forEach(button => {
    let cachedRect: DOMRect | null = null;
    
    // Função para atualizar cache
    const updateCache = () => {
      cachedRect = button.getBoundingClientRect();
    };
    
    button.addEventListener('mousemove', (e: MouseEvent) => {
      // Lê do cache (sem reflow)
      if (!cachedRect) updateCache();
      const rect = cachedRect!;
      
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      // Escreve (sem ler depois)
      gsap.to(button, {
        x: x * 0.1,
        y: y * 0.1,
        duration: 0.3,
        ease: 'power2.out',
      });
    });
    
    button.addEventListener('mouseleave', () => {
      cachedRect = null; // Limpa cache
      
      gsap.to(button, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.5)',
      });
    });
    
    // Atualiza cache em resize
    window.addEventListener('resize', updateCache, { passive: true });
  });
  
  // Tilt 3D em cards
  const cards = q('.info-card, .cycle-card, .kpi-card, .stat-mini-card').filter(
    el => el instanceof HTMLElement
  );
  
  cards.forEach(card => {
    card.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      
      const rotateX = (y - 0.5) * -4;
      const rotateY = (x - 0.5) * 4;
      
      gsap.to(card, {
        rotateX,
        rotateY,
        duration: 0.3,
        ease: 'power2.out',
        transformPerspective: 1000,
      });
    });
    
    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.5,
        ease: 'power2.out',
      });
    });
  });
}
```

### Alternativa: Usar FastDOM (Biblioteca)

Se preferir uma solução mais robusta:

```bash
npm install --save-dev fastdom
```

**Uso:**

```typescript
import fastdom from 'fastdom';

// Leitura (batch)
fastdom.measure(() => {
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  
  // Escrita (batch separado)
  fastdom.mutate(() => {
    element.style.width = `${width}px`;
    element.style.height = `${height * 2}px`;
  });
});
```

---

## 🔧 SOLUÇÃO 3: Latência do Documento HTML

### Problema
O HTML inicial está demorando para ser servido ou não está sendo comprimido.

### Solução: .htaccess Otimizado para LiteSpeed

**Arquivo:** `public/.htaccess` (já criado, mas vou otimizar)

```apache
# =============================================================================
# HOSTINGER - LiteSpeed Performance Configuration
# =============================================================================

# Ativar RewriteEngine
<IfModule mod_rewrite.c>
  RewriteEngine On
  
  # Forçar HTTPS
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
  
  # SPA Fallback
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ /index.html [L]
</IfModule>

# =============================================================================
# 1. COMPRESSÃO BROTLI (Prioridade sobre Gzip)
# =============================================================================
<IfModule mod_brotli.c>
  BrotliCompressionLevel 6
  AddOutputFilterByType BROTLI_COMPRESS text/html text/plain text/xml text/css
  AddOutputFilterByType BROTLI_COMPRESS application/javascript application/json
  AddOutputFilterByType BROTLI_COMPRESS application/xml application/xhtml+xml
  AddOutputFilterByType BROTLI_COMPRESS image/svg+xml font/woff2 font/ttf
</IfModule>

# Fallback Gzip
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css
  AddOutputFilterByType DEFLATE application/javascript application/json
  AddOutputFilterByType DEFLATE application/xml application/xhtml+xml
  AddOutputFilterByType DEFLATE image/svg+xml font/woff2 font/ttf
</IfModule>

# =============================================================================
# 2. CACHE-CONTROL AGRESSIVO
# =============================================================================
<IfModule mod_expires.c>
  ExpiresActive On
  
  # Assets com hash - 1 ano, immutable
  <FilesMatch "\.(js|css|woff2|woff|ttf|eot)$">
    ExpiresDefault "access plus 1 year"
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  
  # Imagens - 1 ano
  <FilesMatch "\.(webp|avif|png|jpg|jpeg|gif|svg)$">
    ExpiresDefault "access plus 1 year"
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  
  # HTML - cache curto (1 hora)
  <FilesMatch "\.(html|htm)$">
    ExpiresDefault "access plus 1 hour"
    Header set Cache-Control "public, max-age=3600, must-revalidate"
  </FilesMatch>
  
  # JSON e dados - 1 dia
  <FilesMatch "\.(json|txt|xml)$">
    ExpiresDefault "access plus 1 day"
    Header set Cache-Control "public, max-age=86400"
  </FilesMatch>
</IfModule>

# =============================================================================
# 3. SERVIR WEBP/AVIF AUTOMATICAMENTE
# =============================================================================
<IfModule mod_rewrite.c>
  # Servir AVIF se suportado
  RewriteCond %{HTTP_ACCEPT} image/avif
  RewriteCond %{REQUEST_URI} (?i)(.*)(\.jpe?g|\.png)$
  RewriteCond %{DOCUMENT_ROOT}%1.avif -f
  RewriteRule (?i)(.*)(\.jpe?g|\.png)$ %1.avif [L,T=image/avif,E=REQUEST_image]
  
  # Servir WebP se suportado
  RewriteCond %{HTTP_ACCEPT} image/webp
  RewriteCond %{REQUEST_URI} (?i)(.*)(\.jpe?g|\.png)$
  RewriteCond %{DOCUMENT_ROOT}%1.webp -f
  RewriteRule (?i)(.*)(\.jpe?g|\.png)$ %1.webp [L,T=image/webp,E=REQUEST_image]
  
  <IfModule mod_headers.c>
    Header append Vary "Accept" env=REQUEST_image
  </IfModule>
</IfModule>

# =============================================================================
# 4. HEADERS DE SEGURANÇA E PERFORMANCE
# =============================================================================
<IfModule mod_headers.c>
  Header unset X-Powered-By
  Header unset Server
  
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header append Vary "Accept-Encoding"
</IfModule>

# =============================================================================
# 5. OTIMIZAÇÕES LITESPEED
# =============================================================================
<IfModule LiteSpeed>
  CacheLookup on
  RewriteRule .* - [E=Cache-Control:max-age=604800]
</IfModule>

# Desativar ETags
<IfModule mod_headers.c>
  Header unset ETag
</IfModule>
FileETag None

# Keep-Alive
<IfModule mod_headers.c>
  Header set Connection "keep-alive"
</IfModule>
```

### Verificação

```bash
# Testar compressão Brotli
curl -I -H "Accept-Encoding: br" https://febreamarela.blog/

# Deve retornar:
# content-encoding: br
```

---

## 🔧 SOLUÇÃO 4: Acessibilidade de Controles Interativos

### Problema
Controles interativos do minijogo e gráficos precisam de labels acessíveis.

### Solução: Adicionar Atributos ARIA

**Arquivo:** `src/App.tsx` (seção do jogo)

```typescript
// Botões do jogo com acessibilidade
<button 
  type="button" 
  className="button yellow" 
  onClick={startGame}
  aria-label="Iniciar jogo de caça ao mosquito"
  tabIndex={0}
>
  Começar jogo
</button>

<button 
  type="button" 
  disabled={gameState !== 'running'} 
  onClick={pauseGame}
  aria-label="Pausar jogo"
  tabIndex={0}
>
  Pausar
</button>

// Arena do jogo com acessibilidade
<div 
  className="ninja-arena" 
  tabIndex={0} 
  role="region" 
  aria-label="Arena do jogo - use Espaço para acertar mosquitos, Esc para pausar"
>
  {/* ... */}
</div>
```

**Arquivo:** `src/components/StatsSection.tsx` (gráficos)

```typescript
// Gráficos com acessibilidade
<svg
  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
  role="img"
  aria-label="Gráfico de barras mostrando casos confirmados de febre amarela no Brasil de 1980 a 2024"
  tabIndex={0}
>
  <title>Casos confirmados de febre amarela no Brasil (1980–2024)</title>
  {/* ... */}
</svg>

// Tooltips com acessibilidade
{tooltip && (
  <div
    role="tooltip"
    aria-live="polite"
    style={{
      position: 'fixed',
      left: tooltip.x,
      top: tooltip.y,
      // ...
    }}
  >
    {tooltip.text}
  </div>
)}
```

### Snippet Rápido para Todos os Controles

**Adicionar no topo do App.tsx:**

```typescript
// Helper para acessibilidade
const a11yProps = {
  role: 'button',
  tabIndex: 0,
  'aria-label': '',
};

// Uso:
<button {...a11yProps} aria-label="Descrição da ação">
  Texto do botão
</button>
```

---

## 📋 Checklist de Implementação

### Fase 1: CSS (5 min)
- [x] Critical CSS inline no `<head>` ✅
- [x] CSS completo com `media="print" onload` ✅
- [ ] Verificar duplicação no build final

### Fase 2: JavaScript (30 min)
- [ ] Refatorar `useGsapAnimations.ts` com Read/Write Batching
- [ ] Testar se não há mais Forced Reflow no Lighthouse

### Fase 3: .htaccess (10 min)
- [ ] Fazer upload de `public/.htaccess` para Hostinger
- [ ] Testar compressão Brotli com `curl -I`

### Fase 4: Acessibilidade (15 min)
- [ ] Adicionar `aria-label` nos botões do jogo
- [ ] Adicionar `role="region"` na arena
- [ ] Adicionar `role="img"` e `<title>` nos gráficos SVG
- [ ] Testar navegação por teclado (Tab)

---

## 🧪 Testes de Validação

### 1. Verificar CSS não-bloqueante
```bash
# Abrir DevTools → Network → filtrar por CSS
# index-BMKUbPGb.css deve ter "initiator: Link (preload)"
```

### 2. Verificar compressão Brotli
```bash
curl -I -H "Accept-Encoding: br" https://febreamarela.blog/
# Deve retornar: content-encoding: br
```

### 3. Verificar Forced Reflow
```bash
# DevTools → Performance → Record → Scroll pela página
# Não deve haver "Forced Reflow" no timeline
```

### 4. Testar acessibilidade
```bash
# Navegar com Tab pela página
# Todos os controles interativos devem ser focáveis
# Screen reader deve ler os aria-labels
```

---

## 📊 Métricas Esperadas

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Performance | 84 | **95+** | +13% |
| FCP | ~2.5s | **<1.8s** | -28% |
| LCP | ~2.8s | **<2.2s** | -21% |
| TBT | 0ms | **0ms** | ✅ |
| CLS | 0 | **0** | ✅ |

---

## 💡 Dicas Extras

### 1. Monitoramento Contínuo
```bash
# Script para verificar performance semanalmente
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://febreamarela.blog/&strategy=mobile" | jq '.lighthouseResult.categories.performance.score'
```

### 2. Teste em Múltiplos Dispositivos
- Chrome DevTools → Device Mode → Testar em:
  - iPhone SE (375x667)
  - iPhone 12 Pro (390x844)
  - Pixel 5 (393x851)
  - Samsung Galaxy S20 (360x800)

### 3. Lighthouse CI (Opcional)
```bash
npm install -g lighthouse-ci
lighthouse-ci https://febreamarela.blog/
```

---

## 📞 Suporte

- **Hostinger:** https://www.hostinger.com/support
- **PageSpeed Insights:** https://pagespeed.web.dev/
- **Web.dev Performance:** https://web.dev/performance/

---

**Última atualização:** 2026-01-XX
**Autor:** Engenharia de Web Performance
