// Conduit Tech Backbone — interactive diagram logic
(function () {
  const svg = document.getElementById('diagram');
  const viewport = document.getElementById('viewport');
  const details = document.getElementById('details');

  // Inputs / outputs for every node, used to render the details panel.
  const NODE_INFO = {
    'tv1': {
      title: 'TV1',
      desc: 'Front-of-house television. Displays the program feed selected on the HDMI switch.',
      inputs: ['HDMI · program video (from HDMI Switch)'],
      outputs: [],
    },
    'tv2': {
      title: 'TV2',
      desc: 'Second program television. Mirrors TV1.',
      inputs: ['HDMI · program video (from HDMI Switch)'],
      outputs: [],
    },
    'tv3': {
      title: 'TV3 — Prompter',
      desc: 'On-stage prompter. Shows lyrics, countdown timer, and notes for the worship team.',
      inputs: ['HDMI · prompter feed (from Computer 1)'],
      outputs: [],
    },
    'led': {
      title: 'LED Wall Screen',
      desc: 'Main stage LED wall. Driven directly by Computer 1.',
      inputs: ['HDMI · visuals / lyrics (from Computer 1)'],
      outputs: [],
    },
    'hdmi-switch': {
      title: 'HDMI Switch',
      desc: 'Distributes / switches the HDMI program signal coming from Computer 2 out to TV1 and TV2.',
      inputs: ['HDMI · program video (from Computer 2)'],
      outputs: ['HDMI → TV1', 'HDMI → TV2'],
    },
    'c1': {
      title: 'Computer 1 — Mac',
      desc: 'Lyrics / visuals master. Runs the lyrics + visuals app and acts as an NDI source for Computer 2.',
      inputs: ['USB-C · audio (from Sound Mixer)'],
      outputs: [
        'HDMI → LED Wall (visuals / lyrics)',
        'HDMI → TV3 (prompter view)',
        'NDI → Computer 2 (lyrics as a network source)',
      ],
    },
    'c2': {
      title: 'Computer 2 — Windows (own PC)',
      desc: 'Program PC. Runs BibleShow locally and the program app that combines NDI sources, then sends one HDMI program feed out to the HDMI switch.',
      inputs: [
        'NDI · Lyrics (from Computer 1)',
        'NDI · Bible verses (from BibleShow — same PC, internal)',
      ],
      outputs: ['HDMI → HDMI Switch (program video)'],
    },
    'bibleshow': {
      title: 'BibleShow (on Computer 2)',
      desc: 'Local application running on Computer 2 that displays Bible passages. It publishes its output as an NDI source so the program app on the same PC can use it like any other camera/source.',
      inputs: ['User input (operator picks the verse)'],
      outputs: ['NDI source (consumed by the program app on the same PC)'],
    },
    'c2-program': {
      title: 'Program app (on Computer 2)',
      desc: 'The app that builds the program output for the TVs. It receives multiple NDI sources and decides which one to send out as the program feed.',
      inputs: [
        'NDI · Lyrics (from Computer 1)',
        'NDI · BibleShow (local)',
      ],
      outputs: ['HDMI · program → HDMI Switch'],
    },
    'mics': {
      title: 'Microphones & Instruments',
      desc: 'All audio sources from the stage / lectern: vocals, instruments, lectern mic, etc. These are the inputs into the audio chain.',
      inputs: ['Performers / speakers'],
      outputs: ['Mic / line level → Sound Mixer'],
    },
    'mixer': {
      title: 'Sound Mixer',
      desc: 'House audio mixer. Combines and balances all the mic/instrument inputs into one main mix and routes it to the speakers and to Computer 1.',
      inputs: ['XLR / TRS · mics & instruments'],
      outputs: [
        'Main mix → Speakers (the goal of the chain)',
        'USB-C → Computer 1 (for recording / streaming)',
      ],
    },
    'speakers': {
      title: 'Speakers (FOH)',
      desc: 'Final audio output — what the congregation actually hears. The whole purpose of the audio chain ends here.',
      inputs: ['Main mix from the Sound Mixer'],
      outputs: ['Sound to the room'],
    },
  };

  // Which nodes participate in each flow (for dimming the rest).
  const FLOW_NODES = {
    'hdmi-tv':    ['tv1', 'tv2', 'hdmi-switch', 'c2', 'c2-program'],
    'hdmi-led':   ['led', 'c1'],
    'ndi-lyrics': ['c1', 'c2', 'c2-program'],
    'ndi-bible':  ['bibleshow', 'c2-program', 'c2'],
    'audio-in':   ['mics', 'mixer'],
    'audio-out':  ['mixer', 'speakers'],
    'audio-usb':  ['mixer', 'c1'],
    'prompter':   ['c1', 'tv3'],
  };

  const FLOW_COLOR = {
    'hdmi-tv':    '#3b82f6',
    'hdmi-led':   '#a855f7',
    'ndi-lyrics': '#10b981',
    'ndi-bible':  '#14b8a6',
    'audio-in':   '#eab308',
    'audio-out':  '#f97316',
    'audio-usb':  '#f59e0b',
    'prompter':   '#ef4444',
  };

  // ---------- Flow highlighting ----------
  const flowButtons = document.querySelectorAll('.flow-btn');
  let activeFlow = 'all';

  function applyFlow(flow) {
    activeFlow = flow;
    flowButtons.forEach(b => b.classList.toggle('active', b.dataset.flow === flow));

    svg.classList.remove('dim');
    document.querySelectorAll('.edge').forEach(e => e.classList.remove('flow-active'));
    document.querySelectorAll('.edge-labels text').forEach(t => t.classList.remove('flow-active'));
    document.querySelectorAll('.node, .subnode').forEach(n => n.classList.remove('flow-related'));

    if (flow && flow !== 'all') {
      svg.classList.add('dim');
      document.querySelectorAll(`.edge[data-flow="${flow}"]`).forEach(e => e.classList.add('flow-active'));
      document.querySelectorAll(`.edge-labels text[data-flow="${flow}"]`).forEach(t => t.classList.add('flow-active'));
      (FLOW_NODES[flow] || []).forEach(id => {
        document.querySelectorAll(`[data-id="${id}"]`).forEach(n => n.classList.add('flow-related'));
      });
    }
  }

  flowButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const f = btn.dataset.flow;
      applyFlow(activeFlow === f && f !== 'all' ? 'all' : f);
    });
  });

  // ---------- Details panel ----------
  function renderNodeDetails(id) {
    const info = NODE_INFO[id];
    if (!info) {
      details.innerHTML = `<h3>${id}</h3><p class="muted">No details available.</p>`;
      return;
    }
    const list = (arr) => arr && arr.length
      ? `<ul>${arr.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>`
      : `<p class="muted">—</p>`;
    details.innerHTML = `
      <h3>${escapeHtml(info.title)}</h3>
      <p>${escapeHtml(info.desc)}</p>
      <div class="io"><h4>Inputs</h4>${list(info.inputs)}</div>
      <div class="io"><h4>Outputs</h4>${list(info.outputs)}</div>
    `;
  }

  function renderEdgeDetails(edge) {
    const flow = edge.dataset.flow;
    const color = FLOW_COLOR[flow] || '#cbd5e1';
    details.innerHTML = `
      <h3 style="color:${color}">Connection</h3>
      <p>${escapeHtml(edge.dataset.info || '')}</p>
    `;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => (
      { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]
    ));
  }

  // Node + sub-node clicks
  document.querySelectorAll('.node, .subnode').forEach(node => {
    node.addEventListener('click', (ev) => {
      ev.stopPropagation();
      document.querySelectorAll('.node.selected, .subnode.selected')
        .forEach(n => n.classList.remove('selected'));
      node.classList.add('selected');
      renderNodeDetails(node.dataset.id);
    });
  });

  // Edge clicks
  document.querySelectorAll('.edge').forEach(edge => {
    edge.addEventListener('click', (ev) => {
      ev.stopPropagation();
      renderEdgeDetails(edge);
    });
  });

  // Click empty area to clear
  svg.addEventListener('click', (ev) => {
    if (ev.target === svg || ev.target === viewport) {
      document.querySelectorAll('.node.selected, .subnode.selected')
        .forEach(n => n.classList.remove('selected'));
      details.innerHTML = '<p class="muted">Click any device or cable to see its inputs and outputs here.</p>';
    }
  });

  // ---------- Pan & Zoom ----------
  const baseVB = svg.viewBox.baseVal;
  let vb = { x: baseVB.x, y: baseVB.y, w: baseVB.width, h: baseVB.height };
  const initial = { ...vb };

  function setVB() { svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`); }

  function zoomAt(cx, cy, factor) {
    const rect = svg.getBoundingClientRect();
    const px = vb.x + (cx / rect.width) * vb.w;
    const py = vb.y + (cy / rect.height) * vb.h;
    const ratio = initial.h / initial.w;
    const newW = Math.min(Math.max(vb.w * factor, 240), 4800);
    const newH = newW * ratio;
    vb.x = px - (cx / rect.width) * newW;
    vb.y = py - (cy / rect.height) * newH;
    vb.w = newW; vb.h = newH;
    setVB();
  }

  svg.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    const rect = svg.getBoundingClientRect();
    const cx = ev.clientX - rect.left;
    const cy = ev.clientY - rect.top;
    zoomAt(cx, cy, ev.deltaY > 0 ? 1.12 : 1/1.12);
  }, { passive: false });

  document.getElementById('zoom-in').addEventListener('click', () => {
    const r = svg.getBoundingClientRect(); zoomAt(r.width/2, r.height/2, 1/1.2);
  });
  document.getElementById('zoom-out').addEventListener('click', () => {
    const r = svg.getBoundingClientRect(); zoomAt(r.width/2, r.height/2, 1.2);
  });
  document.getElementById('zoom-fit').addEventListener('click', () => {
    vb = { ...initial }; setVB(); applyFlow('all');
  });

  // Drag to pan
  let panning = false, panStart = null;
  svg.addEventListener('mousedown', (ev) => {
    if (ev.target.closest('.node') || ev.target.closest('.subnode') || ev.target.closest('.edge')) return;
    panning = true;
    panStart = { x: ev.clientX, y: ev.clientY, vbx: vb.x, vby: vb.y };
    svg.classList.add('grabbing');
  });
  window.addEventListener('mousemove', (ev) => {
    if (!panning) return;
    const rect = svg.getBoundingClientRect();
    const dx = (ev.clientX - panStart.x) * (vb.w / rect.width);
    const dy = (ev.clientY - panStart.y) * (vb.h / rect.height);
    vb.x = panStart.vbx - dx; vb.y = panStart.vby - dy;
    setVB();
  });
  window.addEventListener('mouseup', () => { panning = false; svg.classList.remove('grabbing'); });

  // Touch pan / pinch
  let touchState = null;
  svg.addEventListener('touchstart', (ev) => {
    if (ev.touches.length === 1) {
      touchState = { mode: 'pan', x: ev.touches[0].clientX, y: ev.touches[0].clientY, vbx: vb.x, vby: vb.y };
    } else if (ev.touches.length === 2) {
      const [a,b] = ev.touches;
      touchState = { mode:'pinch', dist: Math.hypot(b.clientX-a.clientX, b.clientY-a.clientY), vbw: vb.w, vbh: vb.h };
    }
  }, { passive: true });
  svg.addEventListener('touchmove', (ev) => {
    if (!touchState) return;
    if (touchState.mode === 'pan' && ev.touches.length === 1) {
      const rect = svg.getBoundingClientRect();
      const dx = (ev.touches[0].clientX - touchState.x) * (vb.w / rect.width);
      const dy = (ev.touches[0].clientY - touchState.y) * (vb.h / rect.height);
      vb.x = touchState.vbx - dx; vb.y = touchState.vby - dy;
      setVB();
    } else if (touchState.mode === 'pinch' && ev.touches.length === 2) {
      const [a,b] = ev.touches;
      const dist = Math.hypot(b.clientX-a.clientX, b.clientY-a.clientY);
      const factor = touchState.dist / dist;
      const rect = svg.getBoundingClientRect();
      const cx = (a.clientX + b.clientX)/2 - rect.left;
      const cy = (a.clientY + b.clientY)/2 - rect.top;
      zoomAt(cx, cy, factor);
      touchState.dist = dist;
    }
  }, { passive: true });
  svg.addEventListener('touchend', () => { touchState = null; });

  // Keyboard shortcuts
  document.addEventListener('keydown', (ev) => {
    if (ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA') return;
    const map = {
      '0':'all',
      '1':'hdmi-tv',
      '2':'hdmi-led',
      '3':'ndi-lyrics',
      '4':'ndi-bible',
      '5':'prompter',
      '6':'audio-in',
      '7':'audio-out',
      '8':'audio-usb',
    };
    if (map[ev.key]) applyFlow(map[ev.key]);
    if (ev.key === 'Escape') { vb = { ...initial }; setVB(); applyFlow('all'); }
  });

  applyFlow('all');
})();
