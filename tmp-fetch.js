const url = 'http://localhost:9002/';
(async () => {
  try {
    const res = await fetch(url, { redirect: 'manual' });
    console.log(url, res.status, res.statusText, 'length', res.headers.get('content-length'));
    const text = await res.text();
    const refs = Array.from(text.matchAll(/href=\"([^\"]*_next\/static[^\"]*)\"/g)).map(m => m[1]);
    const scripts = Array.from(text.matchAll(/src=\"([^\"]*_next\/static[^\"]*)\"/g)).map(m => m[1]);
    console.log('styles', refs.slice(0,10));
    console.log('scripts', scripts.slice(0,10));
    console.log('has app/page', text.includes('/_next/static/chunks/app/page.js'));
    console.log('has app/layout', text.includes('/_next/static/chunks/app/layout.js'));
    console.log('has page.css', text.includes('/_next/static/css/app/page.css'));
  } catch (err) {
    console.error(url, 'ERROR', err.message);
  }
})();
