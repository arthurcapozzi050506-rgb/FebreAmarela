# 🚀 Guia de Otimização de Performance - febreamarela.blog

## 📊 Estado Atual vs Meta

| Métrica | Atual | Meta | Melhoria |
|---------|-------|------|----------|
| Performance Score | 79 | 95+ | +20% |
| FCP | 3.1s | <1.8s | -42% |
| LCP | 3.6s | <2.5s | -31% |
| TBT | 0ms | ✅ OK | - |
| CLS | 0 | ✅ OK | - |

---

## ✅ SOLUÇÕES IMPLEMENTADAS

### 1. Critical CSS Inline + Font Loading Não-Bloqueante
**Arquivo:** `index.html`

**O que foi feito:**
- ✅ CSS crítico (header, hero, tipografia) embutido no `<head>`
- ✅ CSS completo carregado com `media="print" onload="this.media='all'"`
- ✅ Google Fonts com preload + media="print" (não-bloqueante)
- ✅ Preload da imagem LCP (mosquito.jpg) com `fetchpriority="high"`

**Impacto esperado:** FCP melhora ~1.3s

---

### 2. Cache Agressivo + Compressão Brotli
**Arquivo:** `public/.htaccess`

**O que foi feito:**
- ✅ Assets com hash (.js, .css, .woff2): 1 ano de cache (immutable)
- ✅ Imagens: 1 ano de cache
- ✅ HTML: 1 hora (com revalidação)
- ✅ Compressão Brotli + Gzip automática
- ✅ Servir WebP/AVIF automaticamente

**Impacto esperado:** Redução de 60-75% no tamanho transferido

---

## 🎯 PRÓXIMOS PASSOS (Implementação Manual)

### 🔥 PASSO 1: Migrar Imagens do Worker para Hostinger

**Problema:** Imagens carregando de `rough-band-64f8.capozziarthur12.workers.dev` (928KB)

**Solução:**

#### 1.1 Baixar as imagens originais
```bash
# Criar pasta de assets
mkdir -p public/assets

# Baixar imagens do worker
curl -o public/assets/mosquito.jpg https://rough-band-64f8.capozziarthur12.workers.dev/assets/mosquito.jpg
curl -o public/assets/primata.jpg https://rough-band-64f8.capozziarthur12.workers.dev/assets/primata.jpg
curl -o public/assets/vacinacao.jpg https://rough-band-64f8.capozziarthur12.workers.dev/assets/vacinacao.jpg
curl -o public/assets/foliage.png https://rough-band-64f8.capozziarthur12.workers.dev/assets/foliage.png
```

#### 1.2 Otimizar imagens com sharp
```bash
# Instalar sharp
npm install --save-dev sharp

# Criar script de otimização
cat > scripts/optimize-images.js << 'EOF'
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const images = [
  { name: 'mosquito.jpg', width: 800, quality: 80 },
  { name: 'primata.jpg', width: 1024, quality: 80 },
  { name: 'vacinacao.jpg', width: 1000, quality: 80 },
  { name: 'foliage.png', width: 1226, quality: 80 },
];

async function optimize() {
  for (const img of images) {
    const input = `public/assets/${img.name}`;
    const ext = path.extname(img.name);
    const base = path.basename(img.name, ext);
    
    // WebP
    await sharp(input)
      .resize(img.width)
      .webp({ quality: img.quality })
      .toFile(`public/assets/${base}.webp`);
    
    // AVIF
    await sharp(input)
      .resize(img.width)
      .avif({ quality: img.quality - 15 })
      .toFile(`public/assets/${base}.avif`);
    
    console.log(`✓ ${img.name} otimizado`);
  }
}

optimize();
EOF

# Executar otimização
node scripts/optimize-images.js
```

**Resultado esperado:**
- `foliage.png`: 928KB → ~45KB (WebP) = **95% de redução**
- `mosquito.jpg`: ~200KB → ~80KB (WebP) = **60% de redução**
- Economia total: ~1MB

---

#### 1.3 Atualizar App.tsx para usar imagens locais

**Substituir todas as referências de imagens:**

```typescript
// ANTES (worker externo)
<img src="https://rough-band-64f8.capozziarthur12.workers.dev/assets/mosquito.jpg" />

// DEPOIS (imagem local otimizada)
<picture>
  <source 
    type="image/avif" 
    srcSet="/assets/mosquito.avif"
    sizes="(max-width: 768px) 100vw, 50vw"
  />
  <source 
    type="image/webp" 
    srcSet="/assets/mosquito.webp"
    sizes="(max-width: 768px) 100vw, 50vw"
  />
  <img 
    src="/assets/mosquito.jpg"
    alt="Mosquito Aedes aegypti, vetor do ciclo urbano"
    width="800"
    height="880"
    loading="eager"
    fetchPriority="high"
    decoding="async"
  />
</picture>
```

**Para a imagem LCP (mosquito), usar:**
```typescript
<img 
  src="/assets/mosquito.webp"
  alt="Mosquito Aedes aegypti, vetor do ciclo urbano"
  width="800"
  height="880"
  loading="eager"
  fetchPriority="high"
  decoding="async"
/>
```

**Para imagens abaixo da dobra (primata, vacinação, folhagem):**
```typescript
<img 
  src="/assets/primata.webp"
  alt="Mico-leão-dourado sobre um galho"
  width="1024"
  height="683"
  loading="lazy"
  decoding="async"
/>
```

---

### 🔥 PASSO 2: Deploy do .htaccess

**Upload via FTP/SFTP ou File Manager do hPanel:**

```bash
# Via SCP (se tiver acesso SSH)
scp public/.htaccess user@hostinger:/public_html/

# Ou via File Manager do hPanel:
# 1. Acesse: hPanel → Arquivos → Gerenciador de Arquivos
# 2. Navegue até public_html/
# 3. Faça upload do arquivo .htaccess
```

**Verificar se está funcionando:**
```bash
curl -I https://febreamarela.blog/assets/mosquito.webp
```

**Deve retornar:**
```
HTTP/2 200
cache-control: public, max-age=31536000, immutable
content-encoding: br
content-type: image/webp
```

---

### 🔥 PASSO 3: Corrigir Forced Reflow no JS

**Problema:** `vendor-D3F3s8fL.js` causando 105ms de reflow forçado

**Causa:** Leitura de propriedades geométricas (offsetWidth, offsetHeight) após alterar o DOM

**Solução:** Usar "Read/Write Batching" com `requestAnimationFrame`

#### 3.1 Identificar o código problemático

No arquivo `src/hooks/useGsapAnimations.ts`, procure por padrões como:

```typescript
// ❌ ANTES (causa reflow)
element.style.width = '100px';
const width = element.offsetWidth; // Lê após escrever
element.style.height = `${width * 2}px`;
```

#### 3.2 Refatorar com Read/Write Batching

```typescript
// ✅ DEPOIS (sem reflow)
// Fase de LEITURA (batch)
const measurements = new Map();
elements.forEach(el => {
  measurements.set(el, {
    width: el.offsetWidth,
    height: el.offsetHeight,
  });
});

// Fase de ESCRITA (batch)
requestAnimationFrame(() => {
  elements.forEach(el => {
    const { width } = measurements.get(el);
    el.style.width = '100px';
    el.style.height = `${width * 2}px`;
  });
});
```

#### 3.3 Aplicar no useGsapAnimations.ts

**Localizar e refatorar funções que leem propriedades geométricas:**

```typescript
// Exemplo: initMicroInteractions
function initMicroInteractions(q, rootRef) {
  const buttons = q('.button, .text-link').filter(el => el instanceof HTMLElement);
  
  buttons.forEach(button => {
    button.addEventListener('mousemove', (e) => {
      // ❌ ANTES (causa reflow)
      // const rect = button.getBoundingClientRect();
      
      // ✅ DEPOIS (cache do rect)
      if (!button._cachedRect) {
        button._cachedRect = button.getBoundingClientRect();
      }
      const rect = button._cachedRect;
      
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      gsap.to(button, {
        x: x * 0.1,
        y: y * 0.1,
        duration: 0.3,
        ease: 'power2.out',
      });
    });
    
    button.addEventListener('mouseleave', () => {
      // Limpar cache
      button._cachedRect = null;
      
      gsap.to(button, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.5)',
      });
    });
  });
}
```

---

### 🔥 PASSO 4: Build e Deploy

```bash
# 1. Build otimizado
npm run build

# 2. Verificar tamanho do bundle
ls -lh dist/assets/

# 3. Fazer upload para Hostinger
# Via FTP/SFTP ou File Manager do hPanel
# Upload da pasta dist/ para public_html/

# 4. Limpar cache do navegador (Ctrl+Shift+R)

# 5. Testar performance
# https://pagespeed.web.dev/report?url=https://febreamarela.blog/
```

---

## 📊 Métricas Esperadas Após Implementação

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Performance | 79 | **95+** | +20% |
| FCP | 3.1s | **1.8s** | -42% |
| LCP | 3.6s | **2.5s** | -31% |
| Total Bytes | ~2.5MB | **~800KB** | -68% |

---

## 🧪 Checklist de Validação

### Antes do Deploy
- [ ] Imagens otimizadas com sharp (WebP + AVIF)
- [ ] App.tsx atualizado com `<picture>` elements
- [ ] .htaccess com cache agressivo
- [ ] index.html com critical CSS inline
- [ ] Build sem erros (`npm run build`)

### Após o Deploy
- [ ] Imagens carregando de `/assets/` (não do worker)
- [ ] Headers de cache corretos (`curl -I`)
- [ ] Compressão Brotli ativa
- [ ] WebP/AVIF servidos automaticamente
- [ ] PageSpeed Insights ≥ 95

---

## 💡 Dicas Extras

### 1. Monitoramento Contínuo
```bash
# Script para verificar performance semanalmente
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://febreamarela.blog/&strategy=mobile" | jq '.lighthouseResult.categories.performance.score'
```

### 2. LiteSpeed Cache Plugin (se usar WordPress)
Se o site migrar para WordPress, ative:
- ✅ Page Optimization → CSS Combine
- ✅ Page Optimization → JS Combine
- ✅ Media → Image WebP Replacement
- ✅ Cache → Browser TTL: 1 year

### 3. CDN de Imagens (Opcional)
Considere Cloudinary ou Imgix para otimização automática:
```typescript
<img src="https://res.cloudinary.com/demo/image/upload/w_800,q_auto/mosquito.jpg" />
```

---

## 📞 Suporte

- **Hostinger:** https://www.hostinger.com/support
- **PageSpeed Insights:** https://pagespeed.web.dev/
- **Web.dev Performance:** https://web.dev/performance/

---

**Última atualização:** 2026-01-XX
**Autor:** Engenharia de Web Performance
