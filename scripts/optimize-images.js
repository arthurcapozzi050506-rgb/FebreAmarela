#!/usr/bin/env node

/**
 * Script de Otimização de Imagens para febreamarela.blog
 * Uso: node scripts/optimize-images.js
 * 
 * Este script:
 * 1. Redimensiona imagens para os tamanhos necessários
 * 2. Converte para WebP e AVIF
 * 3. Gera srcset para responsividade
 * 4. Comprime mantendo qualidade
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configurações de otimização
const CONFIG = {
  inputDir: './public/assets',
  outputDir: './public/assets/optimized',
  formats: ['webp', 'avif'],
  sizes: {
    // Tamanhos para srcset (largura em pixels)
    mobile: [320, 480, 640],
    tablet: [768, 1024],
    desktop: [1280, 1920],
  },
  quality: {
    webp: 80,
    avif: 65,
  },
};

// Imagens a otimizar
const IMAGES = [
  {
    name: 'foliage.png',
    sizes: [333, 666, 1000], // Tamanhos específicos para foliage
    description: 'Folhagem decorativa',
  },
  {
    name: 'mosquito.jpg',
    sizes: [400, 800, 1200],
    description: 'Mosquito Aedes aegypti',
  },
  {
    name: 'primata.jpg',
    sizes: [400, 800, 1200],
    description: 'Mico-leão-dourado',
  },
  {
    name: 'vacinacao.jpg',
    sizes: [400, 800, 1200],
    description: 'Vacinação',
  },
];

async function optimizeImage(imageConfig) {
  const inputPath = path.join(CONFIG.inputDir, imageConfig.name);
  const ext = path.extname(imageConfig.name);
  const baseName = path.basename(imageConfig.name, ext);

  console.log(`\n📸 Otimizando: ${imageConfig.name}`);
  console.log(`   Descrição: ${imageConfig.description}`);

  // Verificar se arquivo existe
  if (!fs.existsSync(inputPath)) {
    console.warn(`   ⚠️  Arquivo não encontrado: ${inputPath}`);
    return;
  }

  // Criar diretório de saída
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  const results = {
    original: null,
    optimized: [],
  };

  // Obter informações da imagem original
  const metadata = await sharp(inputPath).metadata();
  results.original = {
    width: metadata.width,
    height: metadata.height,
    size: fs.statSync(inputPath).size,
  };

  console.log(`   Original: ${metadata.width}x${metadata.height} (${(results.original.size / 1024).toFixed(1)} KB)`);

  // Otimizar para cada tamanho e formato
  for (const size of imageConfig.sizes) {
    for (const format of CONFIG.formats) {
      const outputName = `${baseName}-${size}w.${format}`;
      const outputPath = path.join(CONFIG.outputDir, outputName);

      try {
        const quality = CONFIG.quality[format];
        
        await sharp(inputPath)
          .resize(size, null, {
            withoutEnlargement: true,
            kernel: sharp.kernel.lanczos3,
          })
          .toFormat(format, {
            quality,
            effort: format === 'avif' ? 6 : 4,
          })
          .toFile(outputPath);

        const newSize = fs.statSync(outputPath).size;
        const savings = ((1 - newSize / results.original.size) * 100).toFixed(1);

        results.optimized.push({
          name: outputName,
          size: newSize,
          width: size,
          format,
          savings: parseFloat(savings),
        });

        console.log(`   ✓ ${outputName}: ${(newSize / 1024).toFixed(1)} KB (${savings}% menor)`);
      } catch (error) {
        console.error(`   ✗ Erro ao criar ${outputName}:`, error.message);
      }
    }
  }

  // Gerar srcset para HTML
  console.log(`\n   📝 Código HTML sugerido:`);
  console.log(`   <picture>`);
  
  // AVIF (prioridade)
  const avifSources = results.optimized
    .filter(r => r.format === 'avif')
    .map(r => `${CONFIG.outputDir.replace('./public', '')}/${r.name} ${r.width}w`)
    .join(',\n         ');
  console.log(`     <source type="image/avif" srcset="\n         ${avifSources}\n       " sizes="(max-width: 768px) 100vw, 50vw">`);
  
  // WebP
  const webpSources = results.optimized
    .filter(r => r.format === 'webp')
    .map(r => `${CONFIG.outputDir.replace('./public', '')}/${r.name} ${r.width}w`)
    .join(',\n         ');
  console.log(`     <source type="image/webp" srcset="\n         ${webpSources}\n       " sizes="(max-width: 768px) 100vw, 50vw">`);
  
  // Fallback (imagem original otimizada)
  console.log(`     <img src="${CONFIG.outputDir.replace('./public', '')}/${baseName}-800w.webp" alt="${imageConfig.description}" loading="lazy" decoding="async">`);
  console.log(`   </picture>`);

  return results;
}

async function main() {
  console.log('🚀 Iniciando otimização de imagens...\n');
  console.log(`Diretório de entrada: ${CONFIG.inputDir}`);
  console.log(`Diretório de saída: ${CONFIG.outputDir}`);
  console.log(`Formatos: ${CONFIG.formats.join(', ')}`);

  const allResults = [];

  for (const imageConfig of IMAGES) {
    const result = await optimizeImage(imageConfig);
    if (result) {
      allResults.push(result);
    }
  }

  // Resumo final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DA OTIMIZAÇÃO');
  console.log('='.repeat(60));

  let totalOriginal = 0;
  let totalOptimized = 0;

  allResults.forEach(result => {
    totalOriginal += result.original.size;
    const bestOptimized = result.optimized.reduce((min, curr) => 
      curr.size < min.size ? curr : min
    );
    totalOptimized += bestOptimized.size;
  });

  const totalSavings = ((1 - totalOptimized / totalOriginal) * 100).toFixed(1);

  console.log(`\nTamanho original total: ${(totalOriginal / 1024).toFixed(1)} KB`);
  console.log(`Tamanho otimizado total: ${(totalOptimized / 1024).toFixed(1)} KB`);
  console.log(`Economia total: ${totalSavings}%`);
  console.log(`\n✅ Otimização concluída!`);
  console.log(`\n📝 Próximos passos:`);
  console.log(`   1. Substitua as imagens no código HTML pelos novos <picture> elements`);
  console.log(`   2. Faça upload da pasta ${CONFIG.outputDir} para o servidor`);
  console.log(`   3. Teste o site e verifique se as imagens carregam corretamente`);
}

main().catch(console.error);
