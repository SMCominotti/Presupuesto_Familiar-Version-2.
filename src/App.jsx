import React, { useState, useEffect } from 'react';

const CAT = { f: { l: 'Fijo', i: '🏠' }, p: { l: 'Provisión', i: '📅' }, v: { l: 'Variable', i: '🛒' } };
const FREQ = { m: { l: 'Mensual', d: 1 }, b: { l: 'Bimestral', d: 2 }, t: { l: 'Trimestral', d: 3 }, c: { l: 'Cuatrimestral', d: 4 }, s: { l: 'Semestral', d: 6 }, a: { l: 'Anual', d: 12 } };
const ETIQ = ['', 'comida', 'combustible', 'ocio', 'transporte', 'salud', 'educacion', 'otro'];
const MES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export default function App() {
  const def = { ing: [{ id: 1, d: 'Sueldo', m: 0, t: 'fijo' }], gas: [], meta: 0, per: { n: 'Diciembre 2025', nt: '' }, hist: [], prov: {}, cuot: {}, alC: [] };
  const [d, setD] = useState(def);
  const [load, setLoad] = useState(true);
  const [v, setV] = useState('main');
  const [showA, setShowA] = useState(false);
  const [nvo, setNvo] = useState({ d: '', m: '', c: 'f', fr: 'm', e: '', ms: 1, cu: 12, tp: 'r' });
  const [exp, setExp] = useState({ f: true, p: true, v: true });
  const [showC, setShowC] = useState(false);
  const [nvoM, setNvoM] = useState('');
  const [al, setAl] = useState([]);
  const [ed, setEd] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get('pres-v7', true);
        if (r?.value) setD({ ...def, ...JSON.parse(r.value) });
      } catch (e) {}
      setLoad(false);
    })();
  }, []);

  useEffect(() => {
    if (!load) {
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
      
      if (a.length > 0) {
        const timer = setTimeout(() => {
          const newCerradas = [...d.alC, ...a.map(x => x.id)];
          save({ ...d, alC: newCerradas });
        }, 10000);
        return () => clearTimeout(timer);
      }
    }
  }, [d.gas, d.prov, d.cuot, load]);

  const save = async (nd) => {
    setD(nd);
    try {
      await window.storage.set('pres-v7', JSON.stringify(nd), true);
    } catch (e) {}
  };

  const cerrarAlerta = (id) => {
    const newData = { ...d, alC: [...d.alC, id] };
    setD(newData);
    save(newData);
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
  const fmt = (n) => n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const updI = (ni) => save({ ...d, ing: ni });
  const updG = (ng) => save({ ...d, gas: ng });
  const updM = (m) => save({ ...d, meta: m });
  const updN = (n) => save({ ...d, per: { ...per, nt: n } });

  const addI = (tipo) => updI([...ing, { id: Date.now(), d: '', m: 0, t: tipo }]);
  const modI = (id, f, v) => updI(ing.map(i => i.id === id ? { ...i, [f]: f === 'm' ? parseFloat(v) || 0 : v } : i));
  const delI = (id) => { if (ing.length > 1) updI(ing.filter(i => i.id !== id)); };

  const addG = () => {
    if (nvo.d && nvo.m) {
      const g = { ...nvo, id: Date.now(), m: parseFloat(nvo.m), cu: nvo.c === 'p' ? parseInt(nvo.cu) : undefined, tp: nvo.c === 'p' ? nvo.tp : undefined };
      save({ ...d, gas: [...gas, g], cuot: g.c === 'p' ? { ...cuot, [g.id]: 0 } : cuot });
      setNvo({ d: '', m: '', c: 'f', fr: 'm', e: '', ms: 1, cu: 12, tp: 'r' });
      setShowA(false);
    }
  };

  const delG = (id) => {
    const np = { ...prov };
    const nc = { ...cuot };
    delete np[id];
    delete nc[id];
    save({ ...d, gas: gas.filter(g => g.id !== id), prov: np, cuot: nc });
    setEd(null);
  };

  const editG = (id, c, v) => updG(gas.map(g => g.id === id ? { ...g, [c]: ['m', 'ms', 'cu'].includes(c) ? parseFloat(v) || 0 : v } : g));
  const resetP = (id) => save({ ...d, prov: { ...prov, [id]: 0 }, cuot: { ...cuot, [id]: 0 } });

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
    save({ ...d, hist: [r, ...hist], per: { n: nvoM, nt: '' }, prov: np, cuot: nc, gas: gas.filter(g => g.c !== 'v'), ing: ing.filter(i => i.t === 'fijo'), alC: [] });
    setShowC(false);
    setNvoM('');
  };

  if (load) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="text-green-400">Cargando...</div></div>;

  if (v === 'hist') return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold text-green-400">📜 Historial</h1>
          <button onClick={() => setV('main')} className="p-2 bg-gray-800 rounded-lg">✕</button>
        </div>
        {hist.length === 0 ? <p className="text-gray-500 text-center py-12">No hay meses</p> :
          hist.map((h, i) => (
            <div key={i} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="font-semibold text-lg mb-2">{h.n}</h3>
              {h.nt && <p className="text-sm text-gray-400 italic mb-3">📝 {h.nt}</p>}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Ingresos:</span> <span className="text-green-400">${fmt(h.ing)}</span></div>
                {h.ingF !== undefined && <div><span className="text-gray-500">└ Fijos:</span> <span className="text-green-300">${fmt(h.ingF)}</span></div>}
                {h.ingO > 0 && <div><span className="text-gray-500">└ Ocasionales:</span> <span className="text-yellow-400">${fmt(h.ingO)}</span></div>}
                <div><span className="text-gray-500">Gastos:</span> <span className="text-red-400">${fmt(h.gas)}</span></div>
                <div><span className="text-gray-500">Disponible:</span> <span className={h.disp >= 0 ? 'text-green-400' : 'text-red-400'}>${fmt(h.disp)}</span></div>
              </div>
              {h.porE && Object.keys(h.porE).length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <p className="text-xs text-gray-500 mb-2">Por categoría:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(h.porE).map(([e, m]) => (
                      <div key={e} className="flex justify-between text-xs">
                        <span className="text-gray-400 capitalize">{e}:</span>
                        <span className="text-cyan-400">${fmt(m)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        }
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Presupuesto Familiar</h1>
          <p className="text-gray-500 text-sm mt-1">{per.n}</p>
        </div>

        {al.length > 0 && (
          <div className="space-y-2">
            {al.map(a => (
              <div key={a.id} className={a.tp === 'u' ? 'flex items-center gap-3 p-3 rounded-xl bg-red-500/20 border border-red-500/30' : 'flex items-center gap-3 p-3 rounded-xl bg-yellow-500/20 border border-yellow-500/30'}>
                <span>{a.tp === 'u' ? '🚨' : '⚠️'}</span>
                <span className="text-sm flex-1">{a.msg}</span>
                <button onClick={() => cerrarAlerta(a.id)} className="text-gray-400 hover:text-gray-200 p-1" title="Cerrar (o espera 10 seg)">✕</button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={() => setV('hist')} className="flex-1 py-3 bg-gray-800 rounded-xl text-sm">📜</button>
          <button onClick={() => setShowC(true)} className="flex-1 py-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 text-sm">📅 Cerrar</button>
        </div>

        {showC && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full border border-gray-700">
              <h3 className="text-xl font-semibold mb-4">Cerrar "{per.n}"</h3>
              <input type="text" value={nvoM} onChange={e => setNvoM(e.target.value)} placeholder="Nuevo mes" className="w-full bg-gray-800 rounded-lg px-4 py-3 border border-gray-700 outline-none mb-4" />
              <div className="flex gap-3">
                <button onClick={cerrar} disabled={!nvoM} className="flex-1 bg-green-500 text-gray-900 font-semibold py-3 rounded-lg disabled:opacity-50">Cerrar</button>
                <button onClick={() => setShowC(false)} className="px-6 bg-gray-800 rounded-lg">Cancelar</button>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-gradient-to-br from-green-500/20 to-cyan-500/20 border border-green-500/30 p-6">
          <p className="text-gray-400 text-sm mb-1">Disponible</p>
          <p className={disp >= 0 ? 'text-4xl font-bold text-green-400' : 'text-4xl font-bold text-red-400'}>$ {fmt(disp)}</p>
          <div className="mt-4 h-3 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-500 to-cyan-500" style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800"><p className="text-xs text-gray-400">📈</p><p className="text-lg font-semibold text-green-400">${fmt(totI)}</p></div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800"><p className="text-xs text-gray-400">📉</p><p className="text-lg font-semibold text-red-400">${fmt(totG)}</p></div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800"><p className="text-xs text-gray-400">📅</p><p className="text-lg font-semibold text-cyan-400">${fmt(totP)}</p></div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800"><p className="text-xs text-gray-400">🐷</p><p className="text-lg font-semibold text-lime-400">${fmt(meta)}</p></div>
        </div>

        <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-5">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold">💵 Fijos</h2>
            <button onClick={() => addI('fijo')} className="text-green-400">➕</button>
          </div>
          {ingF.map(i => (
            <div key={i.id} className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3 mb-2">
              <input type="text" value={i.d} onChange={e => modI(i.id, 'd', e.target.value)} placeholder="Descripción" className="flex-1 bg-transparent outline-none" />
              <span className="text-green-400">$</span>
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
          <p className="text-xs text-gray-500 mb-3">Se borran al cerrar</p>
          {ingO.map(i => (
            <div key={i.id} className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3 mb-2">
              <input type="text" value={i.d} onChange={e => modI(i.id, 'd', e.target.value)} placeholder="Venta/beca" className="flex-1 bg-transparent outline-none" />
              <span className="text-yellow-400">$</span>
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
              <span className="text-lime-400">$</span>
              <input type="number" value={meta || ''} onChange={e => updM(parseFloat(e.target.value) || 0)} className="w-24 bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-700 outline-none text-right text-lime-400 font-semibold" />
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-5">
          <h2 className="text-lg font-semibold mb-3">📝 Notas</h2>
          <textarea value={per.nt} onChange={e => updN(e.target.value)} placeholder="Comentarios..." className="w-full bg-gray-800/50 rounded-lg px-4 py-3 border border-gray-700 outline-none min-h-[80px]" />
        </div>

        {Object.entries(CAT).map(([k, cat]) => (
          <div key={k} className="bg-gray-900/50 rounded-2xl border border-gray-800">
            <button onClick={() => setExp({ ...exp, [k]: !exp[k] })} className="w-full flex justify-between p-5">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cat.i}</span>
                <div className="text-left">
                  <h3 className="font-semibold">{cat.l}</h3>
                  <p className="text-xs text-gray-500">{porC[k].length} • ${fmt(k === 'p' ? porC[k].reduce((s, g) => s + calcM(g), 0) : porC[k].reduce((s, g) => s + g.m, 0))}/mes</p>
                </div>
              </div>
              <span>{exp[k] ? '▲' : '▼'}</span>
            </button>
            {exp[k] && (
              <div className="px-5 pb-5 space-y-2">
                {porC[k].map(g => (
                  <div key={g.id} className="bg-gray-800/50 rounded-lg p-3">
                    {ed === g.id ? (
                      <div className="space-y-3">
                        <input type="text" value={g.d} onChange={e => editG(g.id, 'd', e.target.value)} className="w-full bg-gray-700 rounded-lg px-3 py-2 outline-none" />
                        <div className="grid grid-cols-2 gap-2">
                          <div><label className="text-xs text-gray-500">Monto</label><input type="number" value={g.m || ''} onChange={e => editG(g.id, 'm', e.target.value)} className="w-full bg-gray-700 rounded px-2 py-1 outline-none" /></div>
                          <div><label className="text-xs text-gray-500">Etiqueta</label>
                            <select value={g.e || ''} onChange={e => editG(g.id, 'e', e.target.value)} className="w-full bg-gray-700 rounded px-2 py-1 outline-none">
                              {ETIQ.map(et => <option key={et} value={et}>{et === '' ? '(ninguna)' : et.charAt(0).toUpperCase() + et.slice(1)}</option>)}
                            </select>
                          </div>
                        </div>
                        {g.c === 'p' && (
                          <>
                            <div className="grid grid-cols-2 gap-2">
                              <select value={g.fr} onChange={e => editG(g.id, 'fr', e.target.value)} className="bg-gray-700 rounded px-2 py-1 outline-none">{Object.entries(FREQ).map(([fk, fv]) => <option key={fk} value={fk}>{fv.l}</option>)}</select>
                              <select value={g.ms} onChange={e => editG(g.id, 'ms', e.target.value)} className="bg-gray-700 rounded px-2 py-1 outline-none">{MES.map((m, idx) => <option key={idx} value={idx + 1}>{m}</option>)}</select>
                            </div>
                            <div className="flex gap-2">
                              <label className="flex items-center gap-2 text-sm"><input type="radio" checked={g.tp === 'r'} onChange={() => editG(g.id, 'tp', 'r')} /><span>♻️ Recurrente</span></label>
                              <label className="flex items-center gap-2 text-sm"><input type="radio" checked={g.tp === 'f'} onChange={() => editG(g.id, 'tp', 'f')} /><span>📌 Finito</span></label>
                            </div>
                            {g.tp === 'f' && <div><label className="text-xs text-gray-500">Cuotas</label><input type="number" value={g.cu || ''} onChange={e => editG(g.id, 'cu', e.target.value)} className="w-full bg-gray-700 rounded px-2 py-1 outline-none" /></div>}
                            <div className="grid grid-cols-2 gap-2">
                              <div><label className="text-xs text-gray-500">Acum</label><input type="number" value={prov[g.id] || 0} onChange={e => save({ ...d, prov: { ...prov, [g.id]: parseFloat(e.target.value) || 0 } })} className="w-full bg-gray-700 rounded px-2 py-1 outline-none text-yellow-400" /></div>
                              <div><label className="text-xs text-gray-500">Pagadas</label><input type="number" value={cuot[g.id] || 0} onChange={e => save({ ...d, cuot: { ...cuot, [g.id]: parseInt(e.target.value) || 0 } })} className="w-full bg-gray-700 rounded px-2 py-1 outline-none text-cyan-400" /></div>
                            </div>
                            <p className="text-xs text-cyan-400 bg-cyan-500/10 rounded p-2">💡 ${fmt(calcM(g))}/mes • ${fmt(prov[g.id] || 0)}/${fmt(g.m)}</p>
                            <button onClick={() => resetP(g.id)} className="w-full bg-yellow-500/20 text-yellow-400 py-2 rounded text-sm">🔄 Resetear</button>
                          </>
                        )}
                        <div className="flex gap-2">
                          <button onClick={() => setEd(null)} className="flex-1 bg-green-500 text-gray-900 font-semibold py-2 rounded">✓</button>
                          <button onClick={() => delG(g.id)} className="px-4 bg-red-500/20 text-red-400 rounded text-sm">Eliminar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <p>{g.d}</p>
                          <div className="flex gap-2 mt-1 flex-wrap text-xs">
                            {g.e && <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">{g.e}</span>}
                            {g.c === 'p' && (
                              <>
                                <span className="text-cyan-400">${fmt(g.m)} {FREQ[g.fr].l}</span>
                                <span className="text-gray-500">{MES[g.ms - 1]}</span>
                                <span className={g.tp === 'r' ? 'text-purple-400' : 'text-orange-400'}>{g.tp === 'r' ? '♻️' : '📌'}{g.tp === 'f' ? ` ${cuot[g.id] || 0}/${g.cu}` : ''}</span>
                                <span className="text-yellow-400">${fmt(prov[g.id] || 0)}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className="text-red-400 font-semibold">-${fmt(g.c === 'p' ? calcM(g) : g.m)}</span>
                        <button onClick={() => setEd(g.id)} className="text-gray-600 hover:text-blue-400">✏️</button>
                        <button onClick={() => delG(g.id)} className="text-gray-600 hover:text-red-400">🗑️</button>
                      </div>
                    )}
                  </div>
                ))}
                {porC[k].length === 0 && <p className="text-gray-600 text-sm text-center py-4">Sin gastos</p>}
              </div>
            )}
          </div>
        ))}

        {showA ? (
          <div className="bg-gray-900 rounded-2xl border border-green-500/30 p-5 space-y-4">
            <h3 className="font-semibold text-green-400">Nuevo Gasto</h3>
            <input type="text" value={nvo.d} onChange={e => setNvo({ ...nvo, d: e.target.value })} placeholder="Descripción" className="w-full bg-gray-800 rounded-lg px-4 py-3 border border-gray-700 outline-none" />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={nvo.m} onChange={e => setNvo({ ...nvo, m: e.target.value })} placeholder="Monto" className="bg-gray-800 rounded-lg px-4 py-3 border border-gray-700 outline-none" />
              <select value={nvo.e || ''} onChange={e => setNvo({ ...nvo, e: e.target.value })} className="bg-gray-800 rounded-lg px-4 py-3 border border-gray-700 outline-none">
                {ETIQ.map(et => <option key={et} value={et}>{et === '' ? '(ninguna)' : et.charAt(0).toUpperCase() + et.slice(1)}</option>)}
              </select>
            </div>
            <select value={nvo.c} onChange={e => setNvo({ ...nvo, c: e.target.value })} className="w-full bg-gray-800 rounded-lg px-4 py-3 border border-gray-700 outline-none">
              {Object.entries(CAT).map(([k, v]) => <option key={k} value={k}>{v.i} {v.l}</option>)}
            </select>
            {nvo.c === 'p' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <select value={nvo.fr} onChange={e => setNvo({ ...nvo, fr: e.target.value })} className="bg-gray-800 rounded-lg px-4 py-3 border border-gray-700 outline-none">
                    {Object.entries(FREQ).map(([k, v]) => <option key={k} value={k}>{v.l}</option>)}
                  </select>
                  <select value={nvo.ms} onChange={e => setNvo({ ...nvo, ms: parseInt(e.target.value) })} className="bg-gray-800 rounded-lg px-4 py-3 border border-gray-700 outline-none">
                    {MES.map((m, i) => <option key={i} value={i + 1}>Vence: {m}</option>)}
                  </select>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" checked={nvo.tp === 'r'} onChange={() => setNvo({ ...nvo, tp: 'r' })} />
                    <span>♻️ Recurrente (se repite)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" checked={nvo.tp === 'f'} onChange={() => setNvo({ ...nvo, tp: 'f' })} />
                    <span>📌 Finito (cuotas)</span>
                  </label>
                </div>
                {nvo.tp === 'f' && (
                  <div>
                    <label className="text-xs text-gray-500">Total cuotas</label>
                    <input type="number" value={nvo.cu} onChange={e => setNvo({ ...nvo, cu: e.target.value })} placeholder="12" className="w-full bg-gray-800 rounded-lg px-4 py-3 border border-gray-700 outline-none" />
                  </div>
                )}
                {nvo.m && (
                  <p className="text-sm text-cyan-400 bg-cyan-500/10 rounded p-3">
                    💡 ${fmt(parseFloat(nvo.m) / FREQ[nvo.fr].d)}/mes{nvo.tp === 'f' && ` • Total ${nvo.cu} cuotas`}
                  </p>
                )}
              </>
            )}
            <div className="flex gap-3">
              <button onClick={addG} className="flex-1 bg-green-500 text-gray-900 font-semibold py-3 rounded">Agregar</button>
              <button onClick={() => setShowA(false)} className="px-6 bg-gray-800 rounded">Cancelar</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowA(true)} className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-700 text-gray-500 hover:border-green-500/50 hover:text-green-400 flex items-center justify-center">
            ➕ Agregar
          </button>
        )}

        <p className="text-center text-gray-600 text-xs pb-4">💚 Hecho para finanzas en familia</p>
      </div>
    </div>
  );
}
