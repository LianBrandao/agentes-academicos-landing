/* Agentes Acadêmicos — Prof. Lian Brandão
   Experiência de uma seção: abertura → pacote 3D → constelação dos 20 agentes → mergulho em cada um. */
(() => {
  'use strict';
  document.documentElement.classList.remove('no-js');

  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeIO = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeBack = t => { const c = 1.45; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const now = () => performance.now();

  /* ---------------- conteúdo (fiel ao Mapa dos Agentes do kit) ---------------- */
  const PHASES = [
    { name: 'Começar', c: '#00E5FF' },
    { name: 'Buscar e ler', c: '#45B6FF' },
    { name: 'Organizar', c: '#4F7DFF' },
    { name: 'Escrever', c: '#8B7BFF' },
    { name: 'Conferir e entregar', c: '#4FF0D2' },
  ];
  const AGENTS = [
    { n: '01', ph: 0, name: 'Maestro', use: 'Dizer o que você precisa, do seu jeito.',
      pratica: 'Você não precisa saber qual agente chamar. Escreve do seu jeito — “esse artigo serve pro meu trabalho?” — e o Maestro aciona só as funções necessárias.',
      get: 'Atendimento direto ou uma orientação curta, e a coordenação das funções necessárias para o seu pedido.' },
    { n: '02', ph: 0, name: 'Bússola', use: 'Encontrar um começo quando estiver perdido.',
      pratica: 'Faltam três semanas, você tem meia dúzia de PDFs e nenhuma ideia de por onde começar. A Bússola olha seu prazo e o seu material e devolve um próximo passo concreto.',
      get: 'Um próximo passo concreto, usando o seu momento, o seu prazo e o material que você já informou.' },
    { n: '03', ph: 0, name: 'Tema Claro', use: 'Delimitar um interesse amplo.',
      pratica: '“Quero pesquisar inteligência artificial na educação” é amplo demais. O Tema Claro propõe recortes por contexto, público ou período — e diz o que cada um exigiria.',
      get: 'Opções de recorte, condições a verificar e as decisões que ainda estão em aberto.' },
    { n: '04', ph: 0, name: 'Problema & Objetivos', use: 'Formular ou revisar a direção do estudo.',
      pratica: 'Seu orientador disse que a pergunta não conversa com os objetivos. Você envia os dois e recebe a análise de coerência — com o que ajustar.',
      get: 'Pergunta e objetivos propostos, ou a análise de coerência deles com os seus procedimentos.' },
    { n: '05', ph: 1, name: 'Estratégia de Busca', use: 'Planejar como localizar fontes.',
      pratica: 'Antes de abrir as bases de dados, você já sai com palavras-chave e uma estratégia. Depois, cola títulos e resumos e recebe uma triagem inicial.',
      get: 'Palavras-chave, uma estratégia de busca proposta e a triagem aparente dos títulos e resumos que você enviar.' },
    { n: '06', ph: 1, name: 'Leitor Profundo', use: 'Entender um artigo, capítulo, relatório ou trecho.',
      pratica: 'Artigo de 25 páginas na véspera da orientação. Você recebe objetivo, método e achados — cada um com a página de onde saiu, e o que não deu para verificar.',
      get: 'Explicação, extração dos campos pedidos ou uma ficha completa — sempre com a origem e os limites.' },
    { n: '07', ph: 1, name: 'Ficha Viva', use: 'Organizar documentos, fichas e contexto.',
      pratica: 'Fechou a conversa? Seu trabalho não se perde. A Ficha Viva organiza catálogo, versões e pendências para você retomar de onde parou.',
      get: 'Catálogo com IDs, versões, o perfil do seu trabalho e as pendências de revisão.' },
    { n: '08', ph: 2, name: 'Tabela Mestra', use: 'Ver informações de várias fontes juntas.',
      pratica: 'Dez artigos, dez jeitos de apresentar os resultados. A Tabela Mestra junta tudo em colunas — com unidades, grupos e a origem de cada número.',
      get: 'Uma tabela com campos, unidades, grupos, a origem de cada dado e a situação da conferência.' },
    { n: '09', ph: 2, name: 'Comparador', use: 'Comparar fontes ou avaliar se um artigo serve para o seu trabalho.',
      pratica: 'Dois autores parecem dizer o contrário. O Comparador mostra onde concordam, onde divergem e por quê — separando o que eles declaram do que é interpretação.',
      get: 'Relações, diferenças, pertinência justificada, possíveis usos e limites. Nota, só se você pedir — e com critérios.' },
    { n: '10', ph: 2, name: 'Radar de Lacunas', use: 'Descobrir o que o seu acervo ainda não cobre.',
      pratica: 'Você precisa justificar a sua pesquisa. O Radar mostra o que o seu acervo ainda não cobre — e não confunde isso com lacuna na literatura.',
      get: 'Ausências delimitadas, hipóteses de lacuna e a agenda declarada pelos autores — cada uma no seu lugar.' },
    { n: '11', ph: 2, name: 'Matriz de Evidências', use: 'Relacionar os seus objetivos às fontes.',
      pratica: 'Cada objetivo do seu trabalho ganha as fontes que o sustentam, os contrapontos e o que ainda falta cobrir.',
      get: 'Um quadro de contribuições, contrapontos e cobertura — sem confundir quantidade com qualidade.' },
    { n: '12', ph: 3, name: 'Arquiteto', use: 'Planejar a estrutura do trabalho.',
      pratica: 'Sumário em branco. O Arquiteto propõe as seções, a função de cada uma e quais fontes você já tem para apoiá-las.',
      get: 'Seções com função, apoios reais e pendências, adequadas ao tipo de estudo.' },
    { n: '13', ph: 3, name: 'Roteirizador', use: 'Saber o que desenvolver em uma seção.',
      pratica: 'Na hora de escrever, você recebe um roteiro por tópicos e parágrafos — com as fontes de cada um. Quem escreve é você.',
      get: 'Um roteiro por tópicos ou parágrafos, com fontes e as questões a resolver.' },
    { n: '14', ph: 3, name: 'Normas & Referências', use: 'Organizar citações e referências.',
      pratica: 'Lista de referências na ABNT sem caçar vírgula. Se faltar um dado, ele avisa — nunca inventa DOI.',
      get: 'Referências formatadas a partir dos metadados fornecidos e as pendências do padrão ou do manual.' },
    { n: '15', ph: 4, name: 'Auditor Anti-Invenção', use: 'Conferir uma entrega contra o original.',
      pratica: 'Antes de entregar, você confronta a ficha com o artigo original: valores, grupos e páginas conferidos, divergências apontadas.',
      get: 'Relatório de confronto: divergências, correções e itens não verificáveis.' },
    { n: '16', ph: 3, name: 'Editor de Clareza Autoral', use: 'Melhorar o texto que você escreveu.',
      pratica: 'Seu parágrafo ficou confuso. O Editor deixa claro, preserva o sentido e os dados — e mostra o que mudou.',
      get: 'Versão editada e as mudanças relevantes, preservando sentido e dados.' },
    { n: '17', ph: 4, name: 'Palco', use: 'Planejar uma apresentação visual e didática.',
      pratica: 'Apresentação amanhã. O Palco planeja os slides em 16:9: storyboard, gráficos com os dados do seu material e prompts para as ilustrações.',
      get: 'Storyboard 16:9, estilo consistente, seleção de gráficos e tabelas com dados e prompts das ilustrações.' },
    { n: '18', ph: 4, name: 'Modo Banca', use: 'Preparar-se para a defesa.',
      pratica: 'Simule a banca antes dela acontecer: perguntas sustentadas pelo seu próprio material e pistas para você preparar as respostas.',
      get: 'Perguntas possíveis sustentadas pelo material e pistas para você elaborar as respostas.' },
    { n: '19', ph: 1, name: 'Inspetor de Dados & Figuras', use: 'Ler e conferir tabela, planilha ou imagem.',
      pratica: 'Tabela borrada num PDF antigo? O Inspetor lê os valores com rótulos e unidades — e marca o que ficou ilegível em vez de chutar.',
      get: 'Valores localizados com rótulos, unidades e as dúvidas de leitura.' },
    { n: '20', ph: 4, name: 'Dossiê Final', use: 'Reunir o que foi realmente produzido.',
      pratica: 'No fim, tudo o que foi produzido de verdade num lugar só: peças, versões, revisão e pendências.',
      get: 'A compilação das peças escolhidas, com versões, revisão e pendências.' },
  ];
  const ORDER = PHASES.flatMap((_, k) => AGENTS.filter(a => a.ph === k)); // trilha por etapa

  /* ---------------- elementos ---------------- */
  const body = document.body;
  const world = $('#world'), nodesEl = $('#nodes'), core = $('#core'), coreBtn = $('#coreBtn');
  const canvas = $('#cosmos'), ctx = canvas.getContext('2d');
  const detail = $('#detail'), offer = $('#offer'), list = $('#list');
  const cursorLight = $('.cursor-light');
  const spotEl = $('#spot'), spotNum = $('#spotNum'), spotName = $('#spotName'), spotUse = $('#spotUse');

  /* ---------------- geometria da constelação ---------------- */
  const LAT = [-0.8, -0.42, 0, 0.42, 0.8];
  ORDER.forEach((a, i) => {
    const j = ORDER.filter(b => b.ph === a.ph).indexOf(a);
    const lat = LAT[a.ph], rr = Math.sqrt(1 - lat * lat), ang = j * Math.PI / 2 + a.ph * 0.62;
    Object.assign(a, { idx: i, ang, p: { x: Math.cos(ang) * rr, y: lat, z: Math.sin(ang) * rr }, sx: 0, sy: 0, far: null });
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'node';
    b.setAttribute('aria-label', `${a.n} ${a.name} — etapa ${PHASES[a.ph].name}`);
    b.innerHTML = `<span class="node-dot"></span><span class="node-num">${a.n}</span><span class="node-name">${esc(a.name)}</span>`;
    b.style.setProperty('--c', PHASES[a.ph].c);
    b.addEventListener('click', () => { if (justDragged()) return; openDetail(a, true); });
    b.addEventListener('focus', () => { if (state === 'hub' && !layer && b.matches(':focus-visible')) faceNode(a); });
    b.tabIndex = -1; b.style.pointerEvents = 'none'; a.off = true;
    nodesEl.appendChild(b); a.el = b;
  });

  /* chips de etapa */
  const chips = $('#chips');
  [{ name: 'Todos', c: '#EEF4FB' }, ...PHASES].forEach((ph, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip';
    b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
    b.innerHTML = `<i></i>${esc(ph.name)}`;
    b.style.setProperty('--c', ph.c);
    b.addEventListener('click', () => setFilter(i - 1));
    chips.appendChild(b);
  });

  /* lista */
  $('#listBody').innerHTML = PHASES.map((ph, k) =>
    `<section class="l-group" data-k="${k}"><h3><i></i>Etapa ${k + 1} · ${esc(ph.name)}</h3><div class="l-grid">` +
    ORDER.filter(a => a.ph === k).map(a => `<button class="l-item" type="button" data-n="${a.n}"><b>${a.n}</b><span>${esc(a.name)}</span></button>`).join('') +
    '</div></section>').join('');
  list.querySelectorAll('.l-group').forEach(g => g.style.setProperty('--c', PHASES[+g.dataset.k].c));
  list.querySelectorAll('.l-item').forEach(btn => btn.addEventListener('click', () => {
    const a = AGENTS.find(x => x.n === btn.dataset.n);
    closeList(true);
    history.replaceState({ h: '#agente-' + a.n }, '', '#agente-' + a.n);
    openDetail(a, false);
  }));

  /* ---------------- estado ---------------- */
  let state = 'intro';           // intro | pacote | opening | hub
  let layer = null;              // null | detail | offer | list
  let W = 0, H = 0, DPR = 1, R = 120, F = 400, YS = 1, cyNow = 0;
  const L = { pacCy: 0, pacAvail: 300, hubCy: 0, S: 160 };
  let rotY = -Math.PI / 2 - 1.5, rotX = -0.3, tRotX = -0.3, velY = 0, tw = null;
  let spot = null, holdUntil = 0, snapPending = false, spinDir = 1;
  const HOLD = 3000;
  let hubP = 0, openAt = 0, filter = -1, warp = 0, t = 0;
  let dragging = false, down = null, lastDragEnd = 0, lastInteract = 0;
  let current = null, returnFocus = null;

  function measure() {
    W = innerWidth; H = innerHeight;
    DPR = Math.min(devicePixelRatio || 1, W < 700 ? 1.6 : 2);
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const pt = $('.pac-top').getBoundingClientRect(), pb = $('.pac-bot').getBoundingClientRect();
    L.pacCy = (pt.bottom + pb.top) / 2; L.pacAvail = pb.top - pt.bottom;
    const ht = $('.hub-top').getBoundingClientRect(), hb = $('.hub-bot').getBoundingClientRect();
    L.hubCy = (ht.bottom + hb.top) / 2;
    const avail = hb.top - ht.bottom;
    R = Math.max(86, Math.min(W * (W < 700 ? 0.33 : 0.38), avail * 0.36, 320));
    F = R * 3.4;
    YS = clamp((avail * 0.78) / (2 * R), 1, 1.5); // em celular de pé, a esfera estica na vertical
    L.S = core.offsetWidth || 160;
  }

  /* ---------------- céu de estrelas ---------------- */
  const STARS = Array.from({ length: innerWidth < 700 ? 150 : 320 }, () => ({
    x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() * 2 - 1,
    tw: Math.random() * 6.28, cy: Math.random() < 0.18,
  }));
  function warpPulse(v) { if (!RM) warp = Math.max(warp, v); }

  function drawStars(dt) {
    const M = Math.max(W, H) * 0.62, ry = rotY * 0.18 + t * 0.012, c = Math.cos(ry), s = Math.sin(ry);
    for (const st of STARS) {
      if (warp > 0.01) {
        st.z += dt * warp * 2.4;
        if (st.z > 1) { st.z -= 2; st.x = Math.random() * 2 - 1; st.y = Math.random() * 2 - 1; }
      }
      const x = st.x * c + st.z * s, z = -st.x * s + st.z * c;
      const d = 2.25 - z;
      const sx = W / 2 + x * M / d, sy = H / 2 + st.y * M / d;
      if (sx < -10 || sx > W + 10 || sy < -10 || sy > H + 10) continue;
      const a = clamp((1.25 - d * 0.32) * (0.55 + 0.45 * Math.sin(t * 1.3 + st.tw)), 0.05, 1);
      const sz = Math.max(0.6, 2.2 - d * 0.55);
      ctx.fillStyle = st.cy ? `rgba(0,229,255,${a})` : `rgba(205,228,255,${a * 0.85})`;
      if (warp > 0.05) {
        const d2 = d + warp * 0.22;
        const px = W / 2 + x * M / d2, py = H / 2 + st.y * M / d2;
        ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = sz * 0.8;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(sx, sy); ctx.stroke();
      } else ctx.fillRect(sx, sy, sz, sz);
    }
  }

  /* ---------------- projeção 3D ---------------- */
  let TR = { cY: 1, sY: 0, cX: 1, sX: 0 };
  function proj(x, y, z) {
    const x1 = x * TR.cY + z * TR.sY, z1 = -x * TR.sY + z * TR.cY;
    const y2 = y * TR.cX - z1 * TR.sX, z2 = y * TR.sX + z1 * TR.cX;
    const s = F / (F - z2 * R);
    return { x: W / 2 + x1 * R * s, y: cyNow + y2 * R * s * YS, z: z2, s };
  }

  function drawRingsAndPath(alpha) {
    // órbitas das cinco etapas
    for (let k = 0; k < 5; k++) {
      const lat = LAT[k], rr = Math.sqrt(1 - lat * lat);
      const on = filter === -1 ? 0.12 : filter === k ? 0.55 : 0.035;
      ctx.strokeStyle = hexA(PHASES[k].c, on * alpha); ctx.lineWidth = filter === k ? 1.4 : 1;
      ctx.beginPath();
      for (let i = 0; i <= 56; i++) {
        const a = i / 56 * Math.PI * 2, q = proj(Math.cos(a) * rr, lat, Math.sin(a) * rr);
        i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y);
      }
      ctx.stroke();
    }
    // a trilha: liga os agentes na ordem da pesquisa
    const pts = ORDER.map(a => a._q).filter(Boolean);
    if (pts.length < 2) return;
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1], p1 = pts[i];
      const dep = clamp(((p0.z + p1.z) / 2 + 1) / 2);
      const dim = filter === -1 || (ORDER[i].ph === filter && ORDER[i - 1].ph === filter) ? 1 : 0.15;
      ctx.strokeStyle = `rgba(0,229,255,${(0.05 + 0.22 * dep) * alpha * dim})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
    }
    // pulso que percorre a trilha
    const u = (t * 1.6) % (pts.length - 1), i0 = Math.floor(u), f = u - i0;
    const a0 = pts[i0], a1 = pts[i0 + 1];
    const px = lerp(a0.x, a1.x, f), py = lerp(a0.y, a1.y, f);
    const g = ctx.createRadialGradient(px, py, 0, px, py, 14);
    g.addColorStop(0, `rgba(255,255,255,${0.95 * alpha})`); g.addColorStop(0.3, `rgba(0,229,255,${0.6 * alpha})`); g.addColorStop(1, 'rgba(0,229,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, 14, 0, 6.283); ctx.fill();
  }
  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
  }

  /* ---------------- quadro a quadro ---------------- */
  let last = now();
  function frame(tm) {
    const dt = Math.min(0.05, (tm - last) / 1000); last = tm; t += dt;
    warp *= Math.pow(0.18, dt);

    // rotação: segue o dedo → encaixa no agente mais à frente → passeio guiado quando ninguém mexe
    if (!dragging && !layer) {
      if (tw) {
        const p = tw.dur ? clamp((tm - tw.t0) / tw.dur) : 1;
        rotY = lerp(tw.from, tw.to, easeIO(p));
        if (p >= 1) { tw = null; holdUntil = tm + HOLD; }
      } else {
        velY *= Math.pow(0.05, dt);
        rotY += velY * dt;
        if (snapPending && Math.abs(velY) < 0.7) { snapPending = false; velY = 0; setSpot(frontMost(), 520); }
        else if (state === 'hub' && !RM && !snapPending && tm > holdUntil && tm - lastInteract > 3200) setSpot(nextSpot(spot, spinDir), 1150);
      }
    }
    rotX += (tRotX - rotX) * Math.min(1, dt * 3.4);

    // abertura do pacote → nascimento da constelação
    if (state === 'opening' || state === 'hub') {
      if (RM) hubP = 1;
      else hubP = clamp((tm - openAt - 480) / 1700); // por relógio: igual em qualquer aparelho
      if (state === 'opening' && hubP >= 1) toHubDone();
    }
    const e = easeIO(clamp(hubP * 1.25));
    cyNow = lerp(L.pacCy, L.hubCy, e);
    TR = { cY: Math.cos(rotY), sY: Math.sin(rotY), cX: Math.cos(rotX), sX: Math.sin(rotX) };

    ctx.clearRect(0, 0, W, H);
    if (!layerFull) {
      drawStars(dt);
      if (hubP > 0) { updateNodes(); drawRingsAndPath(clamp(hubP * 1.4)); }
    }
    placeCore(e);
    requestAnimationFrame(frame);
  }

  const small = () => W < 700;
  function updateNodes() {
    if (layer) return;
    for (const a of ORDER) {
      const k = RM ? 1 : clamp((hubP * 1.75 - a.idx * 0.036) / 0.78);
      const g = RM ? 1 : easeBack(k);
      const q = proj(a.p.x * g, a.p.y * g, a.p.z * g);
      a._q = q; a.sx = q.x; a.sy = q.y;
      const dep = (q.z + 1) / 2;
      const isSpot = a === spot && !dragging && !snapPending;
      let op = (0.3 + 0.7 * dep) * clamp(k * 1.6);
      if (filter !== -1 && a.ph !== filter) op *= 0.12;
      if (isSpot) op = Math.max(op, 0.96 * clamp(k * 1.6));
      if (isSpot !== a.sp) { a.sp = isSpot; a.el.classList.toggle('is-spot', isSpot); }
      const sc = q.s * (small() ? 0.92 : 1) * (0.55 + 0.45 * k) * (isSpot ? 1.12 : 1);
      // mantém o rótulo inteiro dentro da tela (largura estimada, sem ler o layout)
      const hw = (a.far ? 46 : 44 + Math.min(a.name.length, 22) * (small() ? 6.7 : 7.2)) * sc / 2;
      const nx = clamp(q.x, 8 + hw, W - 8 - hw);
      a.sx = nx;
      a.el.style.transform = `translate3d(${nx.toFixed(1)}px,${q.y.toFixed(1)}px,0) translate(-50%,-50%) scale(${sc.toFixed(3)})`;
      a.el.style.opacity = op.toFixed(3);
      a.el.style.zIndex = isSpot ? '1001' : String(500 + Math.round(q.z * 100));
      const far = isSpot || filter === a.ph ? false : dep < (small() ? 0.64 : 0.34) || (filter !== -1 && a.ph !== filter);
      if (far !== a.far) { a.far = far; a.el.classList.toggle('is-far', far); }
      const off = op < 0.2;
      if (off !== a.off) { a.off = off; a.el.style.pointerEvents = off ? 'none' : ''; a.el.tabIndex = off ? -1 : 0; }
    }
  }

  function placeCore(e) {
    const S = L.S;
    const pacScale = Math.min(1, L.pacAvail / (S * 1.55));
    const hubScale = Math.min(0.6, (R * 0.6) / S);
    const sc = lerp(pacScale, hubScale, e);
    core.style.transform = `translate3d(${(W / 2).toFixed(1)}px,${cyNow.toFixed(1)}px,0) translate(-50%,-50%) scale(${sc.toFixed(3)})`;
  }

  /* ---------------- abertura (nome do professor) ---------------- */
  let introDone = false;
  async function runIntro() {
    const img = $('.intro-logo');
    try { await Promise.race([img.decode(), wait(2500)]); } catch (_) { /* segue */ }
    if (introDone) return;
    if (RM) { body.classList.add('i1', 'i2', 'i3'); await wait(1500); return toPacote(); }
    await wait(150); if (introDone) return; body.classList.add('i1');
    await wait(700); if (introDone) return; body.classList.add('i2');
    await wait(1150); if (introDone) return; body.classList.add('i3');
    await wait(1350); toPacote();
  }
  function toPacote() {
    if (introDone) return; introDone = true;
    body.classList.add('i-out'); warpPulse(1.15);
    setTimeout(() => {
      state = 'pacote';
      body.classList.remove('is-intro'); body.classList.add('is-live', 'is-pacote');
      measure();
    }, RM ? 0 : 360);
    setTimeout(() => { const i = $('#intro'); if (i) i.remove(); }, 1400);
  }
  $('#intro').addEventListener('click', toPacote);

  /* ---------------- abrir o pacote ---------------- */
  function openPack() {
    if (state !== 'pacote') return;
    state = 'opening'; openAt = now();
    core.classList.add('is-open'); warpPulse(0.9);
    body.classList.add('is-opening');
    setSpot(ORDER[0], 2400); // a esfera gira e para no primeiro agente
    coreBtn.setAttribute('aria-label', 'Ver o pacote completo e o preço');
    setTimeout(() => { body.classList.remove('is-pacote'); body.classList.add('is-hub'); }, RM ? 0 : 520);
  }
  function toHubDone() {
    state = 'hub'; body.classList.remove('is-opening'); lastInteract = now() - 1800;
    setTimeout(() => body.classList.add('hint-off'), 9000);
  }
  function skipToHub() {
    introDone = true;
    const i = $('#intro'); if (i) i.remove();
    body.classList.remove('is-intro', 'is-pacote', 'is-opening'); body.classList.add('is-live', 'is-hub');
    core.classList.add('is-open'); coreBtn.setAttribute('aria-label', 'Ver o pacote completo e o preço');
    state = 'hub'; hubP = 1; measure();
    rotY = ORDER[0].ang - Math.PI / 2; setSpot(ORDER[0]); holdUntil = now() + HOLD;
    setTimeout(() => body.classList.add('hint-off'), 9000);
  }
  $('#btnOpen').addEventListener('click', openPack);
  coreBtn.addEventListener('click', () => {
    if (justDragged()) return;
    if (state === 'pacote') openPack(); else if (state === 'hub') openOffer(true);
  });
  $('#btnOffer').addEventListener('click', () => openOffer(true));
  $('#btnList').addEventListener('click', () => openList(true));

  /* ---------------- agente em destaque ---------------- */
  const baseX = () => (filter === -1 ? -0.3 : LAT[filter] < 0 ? -1.12 : 1.12);
  const eligible = a => filter === -1 || a.ph === filter;
  function turnTo(a, dur) {
    const target = a.ang - Math.PI / 2;
    const d = Math.atan2(Math.sin(target - rotY), Math.cos(target - rotY));
    velY = 0; snapPending = false;
    tw = { from: rotY, to: rotY + d, t0: now(), dur: RM ? 0 : dur };
  }
  function frontMost() {
    let best = null;
    for (const a of ORDER) if (eligible(a) && a._q && (!best || a._q.z > best._q.z)) best = a;
    return best || ORDER[0];
  }
  function nextSpot(a, dir) {
    const pool = ORDER.filter(eligible), i = pool.indexOf(a);
    return pool[((i < 0 ? 0 : i + dir) + pool.length) % pool.length];
  }
  function setSpot(a, dur) {
    if (!a) return;
    if (dur != null) turnTo(a, dur);
    if (a === spot) return;
    spot = a;
    spotEl.style.setProperty('--c', PHASES[a.ph].c);
    spotNum.textContent = a.n; spotName.textContent = a.name; spotUse.textContent = a.use;
    spotEl.setAttribute('aria-label', `Ver como funciona o agente ${a.n}, ${a.name}`);
    spotEl.classList.remove('is-swap'); void spotEl.offsetWidth; spotEl.classList.add('is-swap');
  }
  spotEl.addEventListener('click', () => { if (spot) openDetail(spot, true); });

  /* ---------------- filtro por etapa ---------------- */
  function setFilter(k) {
    filter = k;
    chips.querySelectorAll('.chip').forEach((c, i) => c.setAttribute('aria-pressed', String(i - 1 === k)));
    tRotX = baseX();
    if (k !== -1) setSpot(ORDER.find(a => a.ph === k), 900);
    lastInteract = now();
  }
  function faceNode(a) { setSpot(a, 650); lastInteract = now(); }

  /* ---------------- arrastar para girar ---------------- */
  function justDragged() { return now() - lastDragEnd < 320; }
  world.addEventListener('pointerdown', ev => {
    if (state !== 'hub' || layer) return;
    down = { x: ev.clientX, y: ev.clientY, lx: ev.clientX, ly: ev.clientY, lt: now(), id: ev.pointerId };
    velY = 0; tw = null; snapPending = false; lastInteract = now();
  });
  addEventListener('pointermove', ev => {
    if (FINE) { const cl = cursorLight; cl.style.transform = `translate3d(${ev.clientX}px,${ev.clientY}px,0)`; body.classList.add('has-pointer'); }
    if (!down || ev.pointerId !== down.id) return;
    const dx = ev.clientX - down.lx, dy = ev.clientY - down.ly, tm = now();
    if (!dragging && Math.hypot(ev.clientX - down.x, ev.clientY - down.y) > 7) {
      dragging = true;
      try { world.setPointerCapture(ev.pointerId); } catch (_) { /* ok */ }
    }
    if (dragging) {
      const k = small() ? 0.0105 : 0.0075;
      rotY += dx * k;                                        // a esfera acompanha o dedo
      tRotX = rotX = clamp(rotX - dy * k * 0.5, -1.3, 1.3);  // para cima/baixo, no mesmo sentido do dedo
      body.classList.add('hint-off');
      const v = dx * k / Math.max(0.008, (tm - down.lt) / 1000);
      velY = clamp(velY * 0.5 + v * 0.5, -5, 5);
    }
    down.lx = ev.clientX; down.ly = ev.clientY; down.lt = tm; lastInteract = tm;
  });
  const endDrag = ev => {
    if (!down || (ev && ev.pointerId !== down.id)) return;
    if (dragging) {
      lastDragEnd = now();
      if (now() - down.lt > 90) velY = 0;                    // dedo parado antes de soltar: sem embalo
      if (Math.abs(velY) > 0.25) spinDir = Math.sign(velY);
      else if (ev && ev.clientX !== down.x) spinDir = Math.sign(ev.clientX - down.x);
      snapPending = true; tRotX = baseX();                   // solta: volta à inclinação e encaixa num agente
    }
    dragging = false; down = null; lastInteract = now();
  };
  addEventListener('pointerup', endDrag); addEventListener('pointercancel', endDrag);
  world.addEventListener('wheel', ev => {
    if (state !== 'hub' || layer) return;
    ev.preventDefault(); tw = null; velY = clamp(velY + (ev.deltaY + ev.deltaX) * 0.004, -4, 4);
    spinDir = Math.sign(velY) || spinDir; snapPending = true; lastInteract = now();
  }, { passive: false });

  /* ---------------- portal (entrar em uma camada) ---------------- */
  let layerFull = false, layerTimer = 0;
  function enterLayer(el, ox, oy, color) {
    clearTimeout(layerTimer);
    const pr = Math.hypot(Math.max(ox, W - ox), Math.max(oy, H - oy)) + 30;
    el.style.setProperty('--px', ox + 'px'); el.style.setProperty('--py', oy + 'px'); el.style.setProperty('--pr', pr + 'px');
    el.style.setProperty('--c', color);
    world.style.transformOrigin = `${ox}px ${oy}px`;
    world.style.transform = 'scale(2.6)'; world.style.opacity = '0';
    body.classList.add('has-layer');
    world.inert = true; document.querySelectorAll('.ui').forEach(u => { u.inert = true; });
    warpPulse(0.7);
    void el.offsetWidth; // aplica o estado inicial antes de animar
    el.classList.add('is-open');
    setTimeout(() => el.classList.add('is-in'), RM ? 0 : 120);
    layerTimer = setTimeout(() => { layerFull = true; }, 950);
  }
  function leaveLayer(el, ox, oy) {
    clearTimeout(layerTimer);
    layerFull = false;
    el.style.setProperty('--px', ox + 'px'); el.style.setProperty('--py', oy + 'px');
    el.classList.remove('is-in');
    setTimeout(() => el.classList.remove('is-open'), RM ? 0 : 140);
    world.style.transformOrigin = `${ox}px ${oy}px`;
    world.style.transform = ''; world.style.opacity = '';
    world.inert = false; document.querySelectorAll('.ui').forEach(u => { u.inert = false; });
    body.classList.remove('has-layer');
    layer = null; lastInteract = now();
    if (el === detail && current) setSpot(current, 700);
    if (returnFocus) { const r = returnFocus; returnFocus = null; setTimeout(() => r.focus({ preventScroll: true }), 700); }
  }

  /* ---------------- um agente por dentro ---------------- */
  const D = {
    big: $('#dBig'), phase: $('#dPhase span'), name: $('#dNameTxt'), use: $('#dUse'), pratica: $('#dPratica'),
    get: $('#dGet'), counter: $('#dCounter'), inner: $('#dInner'), scroll: $('#dScroll'),
    prevName: $('#dPrevName'), nextName: $('#dNextName'), nextCard: $('#dNextCard'), ncName: $('#dNextCardName'), ncUse: $('#dNextCardUse'),
  };
  const near = (a, d) => AGENTS[(AGENTS.indexOf(a) + d + AGENTS.length) % AGENTS.length];
  function fillDetail(a) {
    current = a;
    detail.style.setProperty('--c', PHASES[a.ph].c);
    D.big.textContent = a.n;
    D.phase.textContent = `Etapa ${a.ph + 1} · ${PHASES[a.ph].name}`;
    D.name.textContent = a.name;
    D.use.textContent = a.use;
    D.pratica.textContent = a.pratica;
    D.get.textContent = a.get;
    D.counter.textContent = `Agente ${a.n} de 20`;
    const p = near(a, -1), n = near(a, 1);
    D.prevName.textContent = `${p.n} · ${p.name}`;
    D.nextName.textContent = `${n.n} · ${n.name}`;
    D.ncName.textContent = `${n.n} · ${n.name}`;
    D.ncUse.textContent = n.use;
    D.nextCard.style.setProperty('--c', PHASES[n.ph].c);
    D.scroll.scrollTop = 0;
  }
  function openDetail(a, push) {
    if (state !== 'hub') skipToHub();
    if (layer === 'detail') return switchDetail(a, 1);
    if (layer) closeAnyNoHistory();
    fillDetail(a);
    layer = 'detail'; returnFocus = a.el;
    if (push) history.pushState({ h: '#agente-' + a.n }, '', '#agente-' + a.n);
    const ox = a.sx || W / 2, oy = a.sy || H / 2;
    enterLayer(detail, ox, oy, PHASES[a.ph].c);
    setTimeout(() => $('#dName').focus({ preventScroll: true }), RM ? 0 : 500);
  }
  let switching = false;
  function switchDetail(a, dir) {
    if (!a || a === current || switching) return;
    switching = true;
    const outC = dir > 0 ? 'out-l' : 'out-r', inC = dir > 0 ? 'out-r' : 'out-l';
    D.inner.classList.add(outC);
    setTimeout(() => {
      fillDetail(a);
      returnFocus = a.el;
      history.replaceState({ h: '#agente-' + a.n }, '', '#agente-' + a.n);
      D.inner.classList.add('no-t', inC); D.inner.classList.remove(outC);
      void D.inner.offsetWidth;
      D.inner.classList.remove('no-t', inC);
      switching = false;
    }, RM ? 0 : 280);
  }
  const step = d => switchDetail(near(current, d), d);
  $('#dPrev').addEventListener('click', () => step(-1));
  $('#dNext').addEventListener('click', () => step(1));
  D.nextCard.addEventListener('click', () => step(1));

  // deslizar para o lado troca de agente
  let sw = null;
  D.scroll.addEventListener('pointerdown', ev => { sw = { x: ev.clientX, y: ev.clientY, id: ev.pointerId }; });
  D.scroll.addEventListener('pointerup', ev => {
    if (!sw || ev.pointerId !== sw.id) return;
    const dx = ev.clientX - sw.x, dy = ev.clientY - sw.y; sw = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.6) step(dx < 0 ? 1 : -1);
  });
  D.scroll.addEventListener('pointercancel', () => { sw = null; });

  /* ---------------- o pacote completo ---------------- */
  function openOffer(push) {
    if (state !== 'hub') skipToHub();
    if (layer === 'offer') return;
    if (layer) closeAnyNoHistory();
    layer = 'offer'; returnFocus = coreBtn;
    if (push) history.pushState({ h: '#oferta' }, '', '#oferta');
    offer.querySelector('.layer-scroll').scrollTop = 0;
    enterLayer(offer, W / 2, cyNow, '#00E5FF');
    setTimeout(() => $('#oTitle').focus({ preventScroll: true }), RM ? 0 : 500);
  }

  /* ---------------- lista ---------------- */
  function openList(push) {
    if (state !== 'hub') skipToHub();
    if (layer) closeAnyNoHistory();
    layer = 'list'; returnFocus = $('#btnList');
    if (push) history.pushState({ h: '#agentes' }, '', '#agentes');
    list.classList.add('is-open'); world.inert = true;
    setTimeout(() => $('#lTitle').focus({ preventScroll: true }), 300);
  }
  function closeList(silent) {
    list.classList.remove('is-open'); world.inert = false; layer = null;
    if (!silent && returnFocus) { returnFocus.focus({ preventScroll: true }); returnFocus = null; }
  }

  /* ---------------- fechar e histórico (botão voltar do celular) ---------------- */
  function closeAnyNoHistory() {
    if (layer === 'detail') leaveLayer(detail, current ? current.sx : W / 2, current ? current.sy : H / 2);
    else if (layer === 'offer') leaveLayer(offer, W / 2, cyNow);
    else if (layer === 'list') closeList();
  }
  function requestClose() {
    if (history.state && history.state.h) history.back();
    else { closeAnyNoHistory(); history.replaceState(null, '', location.pathname + location.search); }
  }
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', requestClose));

  function route() {
    const h = location.hash;
    if (h.startsWith('#agente-')) {
      const a = AGENTS.find(x => x.n === h.slice(8));
      if (a) { if (layer === 'detail') switchDetail(a, 1); else openDetail(a, false); return; }
    }
    if (h === '#oferta') return openOffer(false);
    if (h === '#agentes') return openList(false);
    if (layer) closeAnyNoHistory();
  }
  addEventListener('popstate', route);

  /* ---------------- teclado ---------------- */
  addEventListener('keydown', ev => {
    if (state === 'intro' && (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Escape')) { ev.preventDefault(); return toPacote(); }
    if (ev.key === 'Escape' && layer) { ev.preventDefault(); return requestClose(); }
    if (layer === 'detail') {
      if (ev.key === 'ArrowRight') step(1);
      if (ev.key === 'ArrowLeft') step(-1);
      return;
    }
    if (state === 'hub' && !layer) {
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') {
        spinDir = ev.key === 'ArrowRight' ? 1 : -1; setSpot(nextSpot(spot, spinDir), 650); lastInteract = now();
      }
    }
  });

  /* ---------------- início ---------------- */
  addEventListener('resize', () => { measure(); });
  document.addEventListener('visibilitychange', () => { last = now(); });
  measure();
  requestAnimationFrame(frame);

  const startHash = location.hash;
  if (startHash === '#constelacao') {
    skipToHub();
  } else if (/^#(agente-\d\d|oferta|agentes)$/.test(startHash)) {
    skipToHub();
    history.replaceState(null, '', location.pathname + location.search);
    history.pushState({ h: startHash }, '', startHash);
    setTimeout(route, 650);
  } else {
    runIntro();
  }
})();
