import React, { useState, useEffect } from 'react';

const CAT = { f: { l: 'Fijo', i: '🏠' }, p: { l: 'Provisión', i: '📅' }, v: { l: 'Variable', i: '🛒' } };
const FREQ = { m: { l: 'Mensual', d: 1 }, b: { l: 'Bimestral', d: 2 }, t: { l: 'Trimestral', d: 3 }, c: { l: 'Cuatrimestral', d: 4 }, s: { l: 'Semestral', d: 6 }, a: { l: 'Anual', d: 12 } };
const ETIQ = ['', 'comida', 'combustible', 'ocio', 'transporte', 'salud', 'educacion', 'otro'];
const MES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const DATOS_DEMO = {
  ing: [
    { id: 1, d: 'Sueldo Principal', m: 2400, t: 'fijo' },
    { id: 2, d: 'Freelance', m: 500, t: 'ocasional' }
  ],
  gas: [
    { id: 1, d: 'Alquiler', m: 850, c: 'f', e: 'otro' },
    { id: 2, d: 'Internet + Móvil', m: 65, c: 'f', e: 'otro' },
    { id: 3, d: 'Luz y Gas', m: 120, c: 'f', e: 'otro' },
    { id: 4, d: 'Seguro Coche', m: 600, c: 'p', fr: 'a', e: 'transporte', ms: 6, cu: 12, tp: 'r' },
    { id: 5, d: 'Vacaciones', m: 1200, c: 'p', fr: 's', e: 'ocio', ms: 7, cu: 6, tp: 'r' },
    { id: 6, d: 'Supermercado', m: 450, c: 'v', e: 'comida' },
    { id: 7, d: 'Gasolina', m: 180, c: 'v', e: 'combustible' },
    { id: 8, d: 'Ocio y salidas', m: 150, c: 'v', e: 'ocio' }
  ],
  meta: 300,
  per: { n: 'Enero 2026', nt: 'Mes de ejemplo para demostración' },
  hist: [
    {
      n: 'Diciembre 2025',
      f: Date.now() - 2592000000,
      nt: 'Cerramos con buen balance',
      ing: 2900,
      ingF: 2400,
      ingO: 500,
      gas: 2315,
      ah: 300,
      disp: 285,
      det: { f: 1035, p: 150, v: 780 },
      porE: { comida: 450, transporte: 230, ocio: 150, otro: 1035 }
    },
    {
      n: 'Noviembre 2025',
      f: Date.now() - 5184000000,
      nt: '',
      ing: 2400,
      ingF: 2400,
      ingO: 0,
      gas: 2065,
      ah: 300,
      disp: 35,
      det: { f: 1035, p: 150, v: 880 },
      porE: { comida: 480, transporte: 200, ocio: 120, otro: 1035 }
    }
  ],
  prov: { 4: 400, 5: 800 },
  cuot: { 4: 8, 5: 8 },
  alC: []
};

export default function App() {
  const [d, setD] = useState(DATOS_DEMO);
  const [v, setV] = useState('main');
  const [showA, setShowA] = useState(false);
  const [nvo, setNvo] = useState({ d: '', m: '', c: 'f', fr: 'm', e: '', ms: 1, cu: 12, tp: 'r' });
  const [exp, setExp] = useState({ f: true, p: true, v: true });
  const [showC, setShowC] = useState(false);
  const [nvoM, setNvoM] = useState('');
  const [al, setAl] = useState([]);
  const [ed, setEd] = useState(null);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    const a = [];
    const m = new Date().getMonth() + 1;
    d.gas.filter(g => g.c === 'p').forEach(g => {
      const aid = `a${g.id}`;
      if (!d.alC.includes(aid) && (g.ms === m || g.ms === (m % 12) + 1)) {
        const ac = d.prov[g.id] || 0;
        const f = g.m - ac;
        if (f > 0) a.push({ id: aid, tp: g.ms === m ? 'u' : 'p', msg: g.ms === m ? `¡${g.d} vence! Faltan ${fmt(f)}` : `${g.d} próximo mes. ${fmt(ac)}/${fmt(g.m)}` });
      }
    });
    setAl(a);
  }, [d.gas, d.prov, d.cuot]);

  const cerrarAlerta = (id) => setD({ ...d, alC: [...d.alC, id] });
  const resetearDemo = () => {
    setD(DATOS_DEMO);
    setShowBanner(true);
    setV('main');
    setShowA(false);
    setShowC(false);
    setEd(null);
  };

  const { ing, gas, meta, per, hist, prov, cuot } = d;
  const ingF = ing.filter(i => i.t === 'fijo');
  const ingO = ing.filter(i => i.t === 'ocasional');
  const totI = ing.reduce((s, i) => s + (parseFloat(i.m) || 0), 0);
  const porC = { f: gas.filter(g => g.c === 'f'), p: gas.filter(g => g.c === 'p'), v: gas.filter(g => g.c === 'v') };
  
  const calcM = (g) => {
    if (g.c !== 'p') return g.m;
    const acumulado = prov[g.id] || 0;
    if (acumulado >= g.m) return 0;
    const falta = g.m - acumulado;
    const cuotaMensual = g.m / FREQ[g.fr].d;
    return Math.min(falta, cuotaMensual);
  };
  
  const totF = porC.f.reduce((s, g) => s + parseFloat(g.m || 0), 0);
  const totP = porC.p.reduce((s, g) => s + calcM(g), 0);
  const totV = porC.v.reduce((s, g) => s + parseFloat(g.m || 0), 0);
  const totG = totF + totP + totV;
  const disp = totI - totG - meta;
  const pct = totI > 0 ? ((totG + meta) / totI) * 100 : 0;
  const fmt = (n) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const updI = (ni) => setD({ ...d, ing: ni });
  const updG = (ng) => setD({ ...d, gas: ng });
  const updM = (m) => setD({ ...d, meta: m });
  const updN = (n) => setD({ ...d, per: { ...per, nt: n } });

  const addI = (tipo) => updI([...ing, { id: Date.now(), d: '', m: 0, t: tipo }]);
  const modI = (id, f, v) => updI(ing.map(i => i.id === id ? { ...i, [f]: f === 'm' ? parseFloat(v) || 0 : v } : i));
  const delI = (id) => { if (ing.length > 1) updI(ing.filter(i => i.id !== id)); };

  const addG = () => {
    if (nvo.d && nvo.m) {
      const g = { ...nvo, id: Date.now(), m: parseFloat(nvo.m), cu: nvo.c === 'p' ? parseInt(nvo.cu) : undefined, tp: nvo.c === 'p' ? nvo.tp : undefined };
      setD({ ...d, gas: [...gas, g], cuot: g.c === 'p' ? { ...cuot, [g.id]: 0 } : cuot });
      setNvo({ d: '', m: '', c: 'f', fr: 'm', e: '', ms: 1, cu: 12, tp: 'r' });
      setShowA(false);
    }
  };

  const delG = (id) => {
    const np = { ...prov };
    const nc = { ...cuot };
    delete np[id];
    delete nc[id];
    setD({ ...d, gas: gas.filter(g => g.id !== id), prov: np, cuot: nc });
    setEd(null);
  };

  const editG = (id, c, v) => updG(gas.map(g => g.id === id ? { ...g, [c]: ['m', 'ms', 'cu'].includes(c) ? parseFloat(v) || 0 : v } : g));
  const resetP = (id) => setD({ ...d, prov: { ...prov, [id]: 0 }, cuot: { ...cuot, [id]: 0 } });

  const cerrar = () => {
    const porE = {};
    gas.forEach(g => {
      if (g.e) {
        const e = g.e.toLowerCase();
        porE[e] = (porE[e] || 0) + (g.c === 'p' ? calcM(g) : g.m);
      }
    });
    const r = { n: per.n, f: Date.now(), nt: per.nt, ing: totI, ingF: ingF.reduce((s, i) => s + i.m, 0), ingO: ingO.reduce((s, i) => s + i.m, 0), gas: totG, ah: meta, disp, det: { f: totF, p: totP, v: totV }, porE };
    const np = { ...prov };
    const nc = { ...cuot };
    gas.filter(g => g.c === 'p').forEach(g => {
      np[g.id] = (np[g.id] || 0) + calcM(g);
      nc[g.id] = (nc[g.id] || 0) + 1;
      if (np[g.id] >= g.m) {
        if (g.tp === 'r') {
          np[g.id] = 0;
          nc[g.id] = 0;
        } else if (nc[g.id] >= g.cu) {
          np[g.id] = g.m;
          nc[g.id] = g.cu;
        }
      }
    });
    setD({ ...d, hist: [r, ...hist], per: { n: nvoM, nt: '' }, prov: np, cuot: nc, gas: gas.filter(g => g.c !== 'v'), ing: ing.filter(i => i.t === 'fijo'), alC: [] });
    setShowC(false);
    setNvoM('');
  };

  if (v === 'hist') return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold text-green-400">📜 Historial</h1>
          <button onClick={() => setV('main')} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700">✕</button>
        </div>
        {hist.map((h, i) => (
          <div key={i} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <h3 className="font-semibold text-lg mb-2">{h.n}</h3>
            {h.nt && <p className="text-sm text-gray-400 italic mb-3">📝 {h.nt}</p>}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">Ingresos:</span> <span className="text-green-400">€{fmt(h.ing)}</span></div>
              <div><span className="text-gray-500">Gastos:</span> <span className="text-red-400">€{fmt(h.gas)}</span></div>
              <div><span className="text-gray-500">Disponible:</span> <span className={h.disp >= 0 ? 'text-green-400' : 'text-red-400'}>€{fmt(h.disp)}</span></div>
            </div>
            {h.porE && Object.keys(h.porE).length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-800">
                <p className="text-xs text-gray-500 mb-2">Por categoría:</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(h.porE).map(([e, m]) => (
                    <div key={e} className="flex justify-between text-xs">
                      <span className="text-gray-400 capitalize">{e}:</span>
                      <span className="text-cyan-400">€{fmt(m)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {showBanner && (
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎭</span>
              <div className="flex-1">
                <h3 className="font-semibold text-purple-300 mb-1">Modo Demostración</h3>
                <p className="text-sm text-gray-300">Puedes editar todos los valores y probar la app. Los cambios NO se guardan permanentemente.</p>
              </div>
              <button onClick={() => setShowBanner(false)} className="text-gray-400 hover:text-gray-200">✕</button>
            </div>
          </div>
        )}

        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Presupuesto Familiar</h1>
          <p className="text-gray-500 text-sm mt-1">{per.n}</p>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setV('hist')} className="flex-1 py-3 bg-gray-800 rounded-xl text-sm hover:bg-gray-700">📜</button>
          <button onClick={resetearDemo} className="flex-1 py-3 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-400 text-sm hover:bg-purple-500/30">🔄</button>
          <button onClick={() => setShowC(true)} className="flex-1 py-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 text-sm hover:bg-green-500/30">📅</button>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-green-500/20 to-cyan-500/20 border border-green-500/30 p-6">
          <p className="text-gray-400 text-sm mb-1">Disponible</p>
          <p className={disp >= 0 ? 'text-4xl font-bold text-green-400' : 'text-4xl font-bold text-red-400'}>€ {fmt(disp)}</p>
          <div className="mt-4 h-3 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-500 to-cyan-500" style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800"><p className="text-xs text-gray-400">📈</p><p className="text-lg font-semibold text-green-400">€{fmt(totI)}</p></div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800"><p className="text-xs text-gray-400">📉</p><p className="text-lg font-semibold text-red-400">€{fmt(totG)}</p></div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800"><p className="text-xs text-gray-400">📅</p><p className="text-lg font-semibold text-cyan-400">€{fmt(totP)}</p></div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800"><p className="text-xs text-gray-400">🐷</p><p className="text-lg font-semibold text-lime-400">€{fmt(meta)}</p></div>
        </div>

        <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-5">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold">💵 Fijos</h2>
            <button onClick={() => addI('fijo')} className="text-green-400">➕</button>
          </div>
          {ingF.map(i => (
            <div key={i.id} className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3 mb-2">
              <input type="text" value={i.d} onChange={e => modI(i.id, 'd', e.target.value)} placeholder="Descripción" className="flex-1 bg-transparent outline-none" />
              <span className="text-green-400">€</span>
              <input type="number" value={i.m || ''} onChange={e => modI(i.id, 'm', e.target.value)} className="w-24 bg-transparent outline-none text-right text-green-400 font-semibold" />
              {ing.length > 1 && <button onClick={() => delI(i.id)} className="text-gray-600 hover:text-red-400">🗑️</button>}
            </div>
          ))}
        </div>

        <div className="bg-gray-900/50 rounded-2xl border border-yellow-500/30 p-5">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold">💸 Ocasionales</h2>
            <button onClick={() => addI('ocasional')} className="text-yellow-400">➕</button>
          </div>
          {ingO.map(i => (
            <div key={i.id} className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3 mb-2">
              <input type="text" value={i.d} onChange={e => modI(i.id, 'd', e.target.value)} className="flex-1 bg-transparent outline-none" />
              <span className="text-yellow-400">€</span>
              <input type="number" value={i.m || ''} onChange={e => modI(i.id, 'm', e.target.value)} className="w-24 bg-transparent outline-none text-right text-yellow-400 font-semibold" />
              <button onClick={() => delI(i.id)} className="text-gray-600 hover:text-red-400">🗑️</button>
            </div>
          ))}
          {ingO.length === 0 && <p className="text-gray-600 text-sm text-center py-2">Ninguno</p>}
        </div>

        <div className="bg-lime-500/10 rounded-2xl border border-lime-500/30 p-5">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-400">Meta Ahorro</p>
            <div className="flex items-center gap-2">
              <span className="text-lime-400">€</span>
              <input type="number" value={meta || ''} onChange={e => updM(parseFloat(e.target.value) || 0)} className="w-24 bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-700 outline-none text-right text-lime-400 font-semibold" />
            </div>
          </div>
        </div>

        {Object.entries(CAT).map(([k, cat]) => (
          <div key={k} className="bg-gray-900/50 rounded-2xl border border-gray-800">
            <button onClick={() => setExp({ ...exp, [k]: !exp[k] })} className="w-full flex justify-between p-5">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cat.i}</span>
                <div className="text-left">
                  <h3 className="font-semibold">{cat.l}</h3>
                  <p className="text-xs text-gray-500">{porC[k].length} gastos</p>
                </div>
              </div>
              <span>{exp[k] ? '▲' : '▼'}</span>
            </button>
            {exp[k] && (
              <div className="px-5 pb-5 space-y-2">
                {porC[k].map(g => (
                  <div key={g.id} className="bg-gray-800/50 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p>{g.d}</p>
                      {g.e && <span className="text-xs text-gray-500">{g.e}</span>}
                    </div>
                    <span className="text-red-400">€{fmt(g.c === 'p' ? calcM(g) : g.m)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}