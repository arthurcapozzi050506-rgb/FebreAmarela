# 🚀 Guia Completo de Otimização de Performance - febreamarela.blog

## 📊 Estado Atual (PageSpeed Mobile)
- **Performance Score:** 80/100
- **FCP (First Contentful Paint):** 3.0s
- **LCP (Largest Contentful Paint):** 3.5s
- **Speed Index:** 6.2s

## 🎯 Meta
- **Performance Score:** 95+/100
- **FCP:** < 1.8s
- **LCP:** < 2.5s
- **Speed Index:** < 3.4s

---

## 📋 Plano de Ação (Priorizado por Impacto)

### ✅ FASE 1: Quick Wins (Impacto Imediato)

#### 1.1 Otimização de Imagens (~900 KiB de economia)

**Problema:** `foliage.png` tem 928 KB mas é exibido em 333x348

**Solução:**

```bash
# Instalar dependências
npm install --save-dev sharp

# Executar script de otimização
node scripts/optimize-images.js
```

**Resultado esperado:**
- `foliage.png`: 928 KB → ~45 KB (WebP) = **95% de redução**
- Economia total: ~900 KB

**Implementação no código:**

```html
<!-- ANTES -->
<img src="/assets/foliage.png" alt="" />

<!-- DEPOIS -->
<picture>
  <source 
    type="image/avif" 
    srcset="/assets/optimized/foliage-333w.avif 333w, /assets/optimized/foliage-666w.avif 666w"
    sizes="(max-width: 768px) 100vw, 50vw"
  />
  <source 
    type="image/webp" 
    srcset="/assets/optimized/foliage-333w.webp 333w, /assets/optimized/foliage-666w.webp 666w"
    sizes="(max-width: 768px) 100vw, 50vw"
  />
  <img 
    src="/assets/optimized/foliage-666w.webp" 
    alt="" 
    loading="lazy" 
    decoding="async"
    width="333"
    height="348"
  />
</picture>
```

---

#### 1.2 Critical CSS + Font Loading Otimizado

**Problema:** Google Fonts bloqueia renderização (750ms)

**Solução já implementada em `public/index.html`:**

```html
<!-- Preload + async loading -->
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=..." />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=..." 
      media="print" onload="this.media='all'" />
<noscript>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=..." />
</noscript>

<!-- Critical CSS inline (acima) -->
<style>
  /* Apenas CSS crítico para above-the-fold */
  body { margin: 0; font-family: 'DM Sans', sans-serif; }
  .header { /* ... */ }
  .hero { /* ... */ }
  h1 { /* ... */ }
</style>

<!-- CSS completo carregado async -->
<link rel="stylesheet" href="/assets/index-1CB99kcS.css" 
      media="print" onload="this.media='all'" />
```

**Resultado:** FCP melhora ~1.2s

---

#### 1.3 Configuração .htaccess (Hostinger/LiteSpeed)

**Arquivo já criado:** `public/.htaccess`

**Principais otimizações:**
- ✅ Cache agressivo para assets com hash (1 ano, immutable)
- ✅ Compressão Brotli + Gzip
- ✅ Preload de recursos críticos via Link headers
- ✅ Servir WebP/AVIF automaticamente
- ✅ Security headers

**Deploy:**
```bash
# Fazer upload do .htaccess para a raiz do site
scp public/.htaccess user@hostinger:/public_html/
```

---

### ✅ FASE 2: Code Splitting e Lazy Loading

#### 2.1 Configuração Vite Otimizada

**Arquivo:** `vite.config.optimized.js`

```javascript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor': ['react', 'react-dom'],
        'gsap': ['gsap'],
        'three': ['three'],
      },
    },
  },
}
```

**Resultado:**
- Bundle principal: ~350 KB → ~180 KB
- GSAP carregado apenas quando necessário
- Three.js isolado (525 KB)

---

#### 2.2 Lazy Loading de Seções com IntersectionObserver

**Implementação em `src/App.tsx`:**

```typescript
// Lazy load da seção de dados (gráficos)
const StatsSection = lazy(() => import('./components/StatsSection'));

// Lazy load do Preloader
const Preloader = lazy(() => import('./components/Preloader'));

// Uso com Suspense
<Suspense fallback={<div>Carregando...</div>}>
  <StatsSection />
</Suspense>
```

**Resultado:** 
- JS inicial reduzido em ~40%
- Gráficos carregam apenas quando visíveis

---

#### 2.3 Otimização de Animações GSAP

**Problema:** 221ms de Forced Reflow + 35 animações non-composited

**Solução:** Refatorar para usar apenas propriedades compostas pelo GPU

```typescript
// ❌ ANTES (causa reflow)
gsap.to(element, {
  height: '100px',
  width: '200px',
  top: '50px',
});

// ✅ DEPOIS (GPU-accelerated)
gsap.to(element, {
  scale: 1.2,
  y: 50,
  opacity: 1,
  willChange: 'transform, opacity',
});
```

**Propriedades seguras (GPU):**
- ✅ `transform` (translate, scale, rotate)
- ✅ `opacity`
- ✅ `filter` (blur, brightness)

**Propriedades perigosas (causam reflow):**
- ❌ `width`, `height`
- ❌ `top`, `left`, `right`, `bottom`
- ❌ `margin`, `padding`
- ❌ `visibility` (usa opacity em vez disso)

---

### ✅ FASE 3: Configuração Cloudflare (Hostinger)

#### 3.1 Ativar no Painel Hostinger

1. **Acesse:** Hostinger → Domínios → febreamarela.blog → Cloudflare

2. **Ative as seguintes opções:**

**Speed → Optimization:**
- ✅ **Auto Minify:** JavaScript, CSS, HTML
- ✅ **Brotli:** ON
- ✅ **Early Hints:** ON
- ✅ **0-RTT Connection Resumption:** ON

**Speed → Image Optimization:**
- ✅ **Polish:** Lossless ou Lossy (recomendado: Lossy)
- ✅ **WebP:** ON
- ✅ **AVIF:** ON (se disponível no plano)

**Caching → Configuration:**
- ✅ **Browser Cache TTL:** 1 month
- ✅ **Always Online:** ON
- ✅ **Development Mode:** OFF (em produção)

**SSL/TLS:**
- ✅ **Encryption Mode:** Full (Strict)
- ✅ **Always Use HTTPS:** ON
- ✅ **Automatic HTTPS Rewrites:** ON

---

#### 3.2 Page Rules (Cache Agressivo)

**No painel Cloudflare → Rules → Page Rules:**

**Rule 1: Assets estáticos**
```
URL: febreamarela.blog/assets/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 year
  - Browser Cache TTL: 1 year
```

**Rule 2: Imagens otimizadas**
```
URL: febreamarela.blog/assets/optimized/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 year
  - Browser Cache TTL: 1 year
```

---

### ✅ FASE 4: Otimizações Avançadas

#### 4.1 Preload de Recursos Críticos

**Adicionar no `<head>` do index.html:**

```html
<!-- Preload do JS principal -->
<link rel="modulepreload" href="/assets/index-Bbsu1uOS.js" />

<!-- Preload de imagens LCP -->
<link rel="preload" as="image" href="/assets/mosquito.jpg" type="image/jpeg" />

<!-- DNS Prefetch -->
<link rel="dns-prefetch" href="//fonts.googleapis.com" />
<link rel="dns-prefetch" href="//fonts.gstatic.com" />
```

---

#### 4.2 Service Worker (PWA Opcional)

**Arquivo:** `public/sw.js`

```javascript
const CACHE_NAME = 'febreamarela-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/index-1CB99kcS.css',
  '/assets/index-Bbsu1uOS.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

**Resultado:** Visitas subsequentes carregam em < 1s

---

#### 4.3 Font Display Swap com FontFaceObserver

**Para garantir que fontes não bloqueiem renderização:**

```javascript
// Instalar: npm install fontfaceobserver
import FontFaceObserver from 'fontfaceobserver';

const font = new FontFaceObserver('DM Sans');

font.load(null, 3000).then(() => {
  document.documentElement.classList.add('fonts-loaded');
}).catch(() => {
  // Fallback para system fonts
  document.documentElement.classList.add('fonts-failed');
});
```

**CSS:**
```css
body {
  font-family: system-ui, -apple-system, sans-serif;
}

.fonts-loaded body {
  font-family: 'DM Sans', system-ui, sans-serif;
}
```

---

## 📊 Métricas Esperadas Após Otimização

### Antes
- Performance: 80/100
- FCP: 3.0s
- LCP: 3.5s
- Speed Index: 6.2s
- Total Bytes: ~2.5 MB

### Depois (Meta)
- Performance: **95+/100**
- FCP: **< 1.8s** (↓ 40%)
- LCP: **< 2.5s** (↓ 29%)
- Speed Index: **< 3.4s** (↓ 45%)
- Total Bytes: **~800 KB** (↓ 68%)

---

## 🛠️ Checklist de Implementação

### Fase 1 (Quick Wins)
- [ ] Executar `node scripts/optimize-images.js`
- [ ] Substituir imagens no código por `<picture>` elements
- [ ] Fazer upload de `public/.htaccess`
- [ ] Verificar Critical CSS no `public/index.html`
- [ ] Testar em PageSpeed Insights

### Fase 2 (Code Splitting)
- [ ] Atualizar `vite.config.js` com `vite.config.optimized.js`
- [ ] Adicionar `React.lazy()` para StatsSection e Preloader
- [ ] Refatorar animações GSAP (apenas transform/opacity)
- [ ] Build e testar

### Fase 3 (Cloudflare)
- [ ] Ativar Auto Minify (JS, CSS, HTML)
- [ ] Ativar Brotli
- [ ] Ativar Polish (Lossy) + WebP + AVIF
- [ ] Configurar Page Rules para `/assets/*`
- [ ] Ativar Always Use HTTPS

### Fase 4 (Avançado)
- [ ] Adicionar Service Worker (opcional)
- [ ] Implementar FontFaceObserver
- [ ] Adicionar preload de recursos críticos
- [ ] Testar em múltiplos dispositivos

---

## 🧪 Ferramentas de Teste

1. **PageSpeed Insights:** https://pagespeed.web.dev/
2. **WebPageTest:** https://www.webpagetest.org/
3. **Lighthouse (Chrome DevTools):** F12 → Lighthouse
4. **GTmetrix:** https://gtmetrix.com/

---

## 📝 Notas Importantes

### Hostinger Específico
- Use o painel **hPanel** para acessar configurações do Cloudflare
- LiteSpeed Cache está disponível se usar WordPress (não é o caso)
- Para site estático, `.htaccess` é a melhor opção

### Cloudflare Específico
- Polish pode alterar URLs de imagens (use com cuidado)
- Brotli é superior ao Gzip (economiza ~20% mais)
- Page Rules têm limite de 3 no plano gratuito

### Monitoramento
- Configure **Cloudflare Analytics** para monitorar performance
- Use **Core Web Vitals** no Search Console
- Monitore **Real User Metrics (RUM)** com ferramentas como SpeedCurve

---

## 🚀 Deploy

```bash
# 1. Build otimizado
npm run build

# 2. Verificar tamanho do bundle
ls -lh dist/assets/

# 3. Fazer upload para Hostinger
# Via FTP/SFTP ou File Manager do hPanel

# 4. Purge Cloudflare Cache
# Cloudflare Dashboard → Caching → Purge Everything

# 5. Testar performance
# https://pagespeed.web.dev/report?url=https://febreamarela.blog/
```

---

## 💡 Dicas Extras

1. **Use imagens responsivas:** Sempre sirva o tamanho correto para cada dispositivo
2. **Lazy loading:** Use `loading="lazy"` em todas as imagens abaixo da dobra
3. **Fontes subset:** Considere usar apenas os caracteres necessários (latim)
4. **HTTP/2:** Certifique-se de que está ativo (Hostinger já suporta)
5. **CDN para imagens:** Considere Cloudinary ou Imgix para otimização automática

---

## 📞 Suporte

Se precisar de ajuda:
- Hostinger Support: https://www.hostinger.com/support
- Cloudflare Docs: https://developers.cloudflare.com/
- Web.dev Performance: https://web.dev/performance/

---

**Última atualização:** 2026-01-XX
**Autor:** Engenharia de Web Performance
