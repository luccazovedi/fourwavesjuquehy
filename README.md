# Four Waves Juquehy

Site institucional do Condomínio Four Waves Juquehy: casas com 4 suítes e piscina privativa a 200 m da praia.

Site estático (HTML, CSS e JS puros), sem etapa de build.

- `index.html`: conteúdo
- `styles.css`: visual
- `script.js`: menu mobile, animações e formulário de reserva (abre o WhatsApp com a mensagem pronta)
- `assets/img/`: fotos (capa, seções e uma pasta por casa, com miniaturas em `thumb/`)
- `gallery-data.js`: lista das fotos de cada casa usada na galeria

## Rodar localmente

```bash
python3 -m http.server 8000
```

Abra http://localhost:8000.

## Publicar

Funciona direto no GitHub Pages (Settings → Pages → branch e pasta raiz), Netlify, Vercel ou Cloudflare Pages.
