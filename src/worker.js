/**
 * Cloudflare Worker - Cache Headers Optimization
 * Site: febreamarela.blog
 * 
 * Este worker adiciona headers de cache otimizados para diferentes tipos de assets
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Fazer a requisição ao origin
    const response = await fetch(request);
    
    // Clonar a resposta para modificar os headers
    const newResponse = new Response(response.body, response);
    
    // Assets com hash (JS, CSS) - Cache agressivo (1 ano, immutable)
    if (pathname.match(/\/assets\/.*\.(js|css)$/)) {
      newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      newResponse.headers.set('CDN-Cache-Control', 'public, max-age=31536000, immutable');
    }
    
    // Imagens otimizadas (WebP, AVIF) - Cache agressivo
    else if (pathname.match(/\/assets\/optimized\/.*\.(webp|avif|png|jpg|jpeg)$/)) {
      newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      newResponse.headers.set('CDN-Cache-Control', 'public, max-age=31536000, immutable');
    }
    
    // Imagens normais - Cache longo
    else if (pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|avif)$/)) {
      newResponse.headers.set('Cache-Control', 'public, max-age=2592000'); // 30 dias
      newResponse.headers.set('CDN-Cache-Control', 'public, max-age=2592000');
    }
    
    // Fontes - Cache longo
    else if (pathname.match(/\.(woff2|woff|ttf|eot)$/)) {
      newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      newResponse.headers.set('CDN-Cache-Control', 'public, max-age=31536000, immutable');
    }
    
    // JSON e dados - Cache médio
    else if (pathname.match(/\.(json|txt)$/)) {
      newResponse.headers.set('Cache-Control', 'public, max-age=86400'); // 1 dia
      newResponse.headers.set('CDN-Cache-Control', 'public, max-age=86400');
    }
    
    // HTML - Cache curto com revalidação
    else if (pathname.match(/\.(html|htm)$/) || pathname === '/') {
      newResponse.headers.set('Cache-Control', 'public, max-age=3600, must-revalidate'); // 1 hora
      newResponse.headers.set('CDN-Cache-Control', 'public, max-age=3600');
    }
    
    // Adicionar headers de segurança
    newResponse.headers.set('X-Content-Type-Options', 'nosniff');
    newResponse.headers.set('X-Frame-Options', 'SAMEORIGIN');
    newResponse.headers.set('X-XSS-Protection', '1; mode=block');
    newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Adicionar Vary header para cache correto com compressão
    newResponse.headers.append('Vary', 'Accept-Encoding');
    
    // Adicionar Server-Timing para debugging
    newResponse.headers.set('Server-Timing', 'desc="Cloudflare Worker"');
    
    return newResponse;
  },
};
