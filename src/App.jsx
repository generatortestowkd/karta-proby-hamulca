import React, { useState, useEffect, useRef } from 'react';
import {
  AlertCircle, CheckCircle, AlertTriangle, Lock, X, Plus, Trash2, Download, Upload,
  LogOut, ArrowDown, ArrowUp, RefreshCw
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';

// ===== FIREBASE (ten sam projekt co „Zestawienie pojazdów KD” i „Karta próby hamulca”) =====
const firebaseConfig = {
  apiKey: "AIzaSyDPENv7EmaYfmg_Zkvz7eHmG47aQ_beh_8",
  authDomain: "zestawienie-pojazdow.firebaseapp.com",
  projectId: "zestawienie-pojazdow",
  storageBucket: "zestawienie-pojazdow.firebasestorage.app",
  messagingSenderId: "522920995518",
  appId: "1:522920995518:web:3b96cd98fee98d4c58ccef",
  measurementId: "G-MY6FEBL2N7"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Dane tej aplikacji są w osobnej kolekcji „kph_sluzbowy”.
// Zwykła karta próby hamulca używa kolekcji „kph” — tu tylko ją odczytujemy (import listy).
const VEHICLES_DOC = doc(db, 'kph_sluzbowy', 'pojazdy');
const UPDATE_DOC = doc(db, 'kph_sluzbowy', 'aktualizacja');
const MAIN_CARD_VEHICLES_DOC = doc(db, 'kph', 'pojazdy');

// ===== USTAWIENIA =====
const ADMIN_PASSWORD = 'KPH2026';
const DEFAULT_UPDATE = { date: '', changes: '' };

const EMPTY_VEHICLE = {
  name: '', masaSluzbowa: '', masaHamujaca: '', cisnienieGlowne: '', cisnienie: '',
  hamulecElektro: 'TAK', ukladSterowania: 'TAK', ukladDrzwi: 'TAK', inne: 'TAK',
  sprawdzony: true
};

const YES_NO_FIELDS = [
  { key: 'hamulecElektro', label: 'Hamulec elektrodynamiczny' },
  { key: 'ukladSterowania', label: 'Układ sterowania el.-pneum.' },
  { key: 'ukladDrzwi', label: 'Układ zamykania drzwi' },
  { key: 'inne', label: 'Inne urządzenia' }
];

// ===== POMOCNICZE =====
const toNumber = (val) => {
  if (val === '' || val === null || val === undefined) return '';
  const n = parseFloat(String(val).replace(',', '.'));
  return isNaN(n) ? '' : n;
};

const fmt = (n) => (Math.round(n * 100) / 100).toString().replace('.', ',');

const todayIso = () => new Date().toISOString().slice(0, 10);

const formatDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return d && m && y ? `${d}.${m}.${y}` : iso;
};

// Pojazd z zwykłej karty (masaOgolna) → pojazd tej aplikacji (masaSluzbowa, do sprawdzenia)
const fromMainCard = (v, i) => ({
  id: v.id || 'v' + Date.now() + '_' + i,
  name: v.name || '',
  masaSluzbowa: v.masaOgolna ?? '',
  masaHamujaca: v.masaHamujaca ?? '',
  cisnienieGlowne: v.cisnienieGlowne ?? 0.5,
  cisnienie: v.cisnienie ?? '',
  hamulecElektro: v.hamulecElektro || '-',
  ukladSterowania: v.ukladSterowania || '-',
  ukladDrzwi: v.ukladDrzwi || '-',
  inne: v.inne || '-',
  sprawdzony: false
});

// ===== UŁAMEK DO WZORÓW =====
function Fraction({ top, bottom }) {
  return (
    <span className="inline-flex flex-col items-center align-middle mx-1 leading-tight">
      <span className="px-1">{top}</span>
      <span className="px-1 border-t border-slate-800">{bottom}</span>
    </span>
  );
}

function RoundBadge({ up }) {
  const label = up ? 'Wynik zaokrąglamy w górę' : 'Wynik zaokrąglamy w dół';
  return (
    <span
      title={label}
      aria-label={label}
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 ${
        up ? 'bg-yellow-400 text-blue-900' : 'bg-blue-900 text-yellow-300'
      }`}
    >
      {up ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
    </span>
  );
}

function ResultRow({ label, sub, value, unit, strong }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3 border-b border-dashed border-slate-300 last:border-b-0">
      <div>
        <p className="text-slate-800">{label}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
      <p className={`text-right whitespace-nowrap tabular-nums ${strong ? 'text-2xl font-bold text-blue-900' : 'text-xl font-semibold text-slate-900'}`}>
        {value}<span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>
      </p>
    </div>
  );
}

export default function App() {
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLoaded, setVehiclesLoaded] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(DEFAULT_UPDATE);

  const [vehicle1, setVehicle1] = useState('');
  const [vehicle2, setVehicle2] = useState('');
  const [procentWymagany, setProcentWymagany] = useState('');

  // tryb administratora
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [newVehicle, setNewVehicle] = useState(EMPTY_VEHICLE);
  const [addError, setAddError] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [saveStatus, setSaveStatus] = useState(''); // '', 'saving', 'saved', 'error'
  const [saveError, setSaveError] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const vehiclesDirty = useRef(false);
  const updateDirty = useRef(false);

  // zmiany admina oznaczamy do zapisu w bazie
  const changeVehicles = (updater) => { vehiclesDirty.current = true; setVehicles(updater); };
  const changeUpdateInfo = (value) => { updateDirty.current = true; setUpdateInfo(value); };

  // ===== ODCZYT Z BAZY NA ŻYWO =====
  useEffect(() => {
    const fallback = setTimeout(() => setVehiclesLoaded(true), 6000);

    const unsubVehicles = onSnapshot(VEHICLES_DOC, snap => {
      if (snap.metadata.hasPendingWrites) return;
      const list = snap.exists() ? snap.data().list : null;
      if (Array.isArray(list)) setVehicles(list);
      setVehiclesLoaded(true);
    }, err => {
      console.error('Nie udało się pobrać listy pojazdów:', err);
      setVehiclesLoaded(true);
    });

    const unsubUpdate = onSnapshot(UPDATE_DOC, snap => {
      if (snap.metadata.hasPendingWrites) return;
      if (snap.exists()) setUpdateInfo({ ...DEFAULT_UPDATE, ...snap.data() });
    }, err => console.error('Nie udało się pobrać informacji o aktualizacji:', err));

    return () => { clearTimeout(fallback); unsubVehicles(); unsubUpdate(); };
  }, []);

  // ===== ZAPIS DO BAZY =====
  const saveToDb = async (ref, data) => {
    setSaveStatus('saving');
    try {
      await setDoc(ref, data);
      setSaveStatus('saved');
      setSaveError('');
    } catch (e) {
      console.error('Błąd zapisu:', e);
      setSaveStatus('error');
      setSaveError(e.message || String(e));
    }
  };

  useEffect(() => {
    if (!vehiclesDirty.current) return;
    setSaveStatus('saving');
    const t = setTimeout(() => {
      vehiclesDirty.current = false;
      saveToDb(VEHICLES_DOC, { list: vehicles, zmieniono: new Date().toISOString() });
    }, 800);
    return () => clearTimeout(t);
  }, [vehicles]);

  useEffect(() => {
    if (!updateDirty.current) return;
    setSaveStatus('saving');
    const t = setTimeout(() => {
      updateDirty.current = false;
      saveToDb(UPDATE_DOC, { date: updateInfo.date || '', changes: updateInfo.changes || '' });
    }, 800);
    return () => clearTimeout(t);
  }, [updateInfo]);

  // jeśli wybrany pojazd zniknął z listy — czyścimy wybór
  useEffect(() => {
    if (vehicle1 && !vehicles.some(v => v.id === vehicle1)) setVehicle1('');
    if (vehicle2 && !vehicles.some(v => v.id === vehicle2)) setVehicle2('');
  }, [vehicles, vehicle1, vehicle2]);

  // ===== OBLICZENIA =====
  const selected = [vehicle1, vehicle2]
    .map(id => vehicles.find(v => v.id === id))
    .filter(Boolean);

  const pw = toNumber(procentWymagany);
  const pwError = procentWymagany !== '' && (pw === '' || pw <= 0 || pw > 250)
    ? 'Wpisz procent większy od 0 (np. 65).' : '';

  const calculateResults = () => {
    if (selected.length === 0 || pw === '' || pwError) return null;
    const masaOgolna = selected.reduce((s, v) => s + (toNumber(v.masaSluzbowa) || 0), 0);
    const masaHamujacaRzeczywista = selected.reduce((s, v) => s + (toNumber(v.masaHamujaca) || 0), 0);
    if (masaOgolna <= 0) return null;

    const masaHamujacaWymaganaDokladna = masaOgolna * pw / 100;
    const masaHamujacaWymagana = Math.ceil(masaHamujacaWymaganaDokladna - 1e-9);
    const procentDokladny = 100 * masaHamujacaRzeczywista / masaOgolna;
    const procentMasyHamujacejRzeczywistej = Math.floor(procentDokladny + 1e-9);
    const cisnienie = Math.max(...selected.map(v => toNumber(v.cisnienie) || 0));
    const cisnienieGlowne = Math.max(...selected.map(v => toNumber(v.cisnienieGlowne) || 0));

    const isSuccess = masaHamujacaRzeczywista >= masaHamujacaWymagana &&
                      procentMasyHamujacejRzeczywistej >= pw;

    return {
      masaOgolna, masaHamujacaRzeczywista,
      masaHamujacaWymagana, masaHamujacaWymaganaDokladna,
      procentMasyHamujacejRzeczywistej, procentDokladny,
      cisnienie, cisnienieGlowne, isSuccess
    };
  };

  const results = calculateResults();
  const unverified = selected.filter(v => v.sprawdzony === false);

  // ===== LOGOWANIE =====
  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowLogin(false);
      setPassword('');
      setLoginError('');
    } else {
      setLoginError('Nieprawidłowe hasło.');
    }
  };

  const closeLogin = () => { setShowLogin(false); setPassword(''); setLoginError(''); };

  const handleLogout = () => { setIsAdmin(false); setAdminMessage(''); setAddError(''); };

  // ===== EDYCJA POJAZDÓW =====
  const updateVehicle = (id, field, value) => {
    changeVehicles(list => list.map(v => (v.id === id ? { ...v, [field]: value } : v)));
  };

  const deleteVehicle = (id) => {
    const v = vehicles.find(x => x.id === id);
    if (window.confirm(`Usunąć pojazd „${v?.name || 'bez nazwy'}” z listy?`)) {
      changeVehicles(list => list.filter(x => x.id !== id));
    }
  };

  const handleAddVehicle = () => {
    const name = newVehicle.name.trim();
    const ms = toNumber(newVehicle.masaSluzbowa);
    const mh = toNumber(newVehicle.masaHamujaca);
    const p = toNumber(newVehicle.cisnienie);
    const pg = toNumber(newVehicle.cisnienieGlowne);

    if (!name) return setAddError('Wpisz nazwę serii pojazdów.');
    if (vehicles.some(v => v.name.trim().toLowerCase() === name.toLowerCase()))
      return setAddError('Pojazd o tej nazwie już jest na liście.');
    if (ms === '' || ms <= 0) return setAddError('Wpisz masę bez podróżnych większą od zera.');
    if (mh === '' || mh <= 0) return setAddError('Wpisz masę hamującą większą od zera.');
    if (pg === '' || pg <= 0) return setAddError('Wpisz ciśnienie powietrza w przewodzie głównym większe od zera.');
    if (p === '' || p <= 0) return setAddError('Wpisz ciśnienie sprężonego powietrza w przewodzie większe od zera.');

    changeVehicles(list => [...list, {
      ...newVehicle, id: 'v' + Date.now(), name,
      masaSluzbowa: ms, masaHamujaca: mh, cisnienieGlowne: pg, cisnienie: p, sprawdzony: true
    }]);
    setNewVehicle(EMPTY_VEHICLE);
    setAddError('');
    setAdminMessage(`Dodano pojazd „${name}”.`);
  };

  const handleImportFromMainCard = async () => {
    const replace = vehicles.length === 0 || window.confirm(
      'Pobrać listę pojazdów z Karty próby hamulca?\n\nObecna lista w tej aplikacji zostanie zastąpiona. ' +
      'Masa ogólna z tamtej karty zostanie wpisana jako masa bez podróżnych i oznaczona „do sprawdzenia”.'
    );
    if (!replace) return;
    setImporting(true);
    try {
      const snap = await getDoc(MAIN_CARD_VEHICLES_DOC);
      const list = snap.exists() ? snap.data().list : null;
      if (!Array.isArray(list) || list.length === 0) {
        setAdminMessage('W Karcie próby hamulca nie ma jeszcze zapisanej listy pojazdów. Zapisz ją tam w panelu administratora albo dodaj pojazdy tutaj ręcznie.');
      } else {
        changeVehicles(list.map(fromMainCard));
        setAdminMessage(`Pobrano ${list.length} pojazdów. Sprawdź masę bez podróżnych przy każdym z nich i zaznacz „Dane sprawdzone”.`);
      }
    } catch (e) {
      console.error(e);
      setAdminMessage('Nie udało się pobrać listy z Karty próby hamulca: ' + (e.message || e));
    }
    setImporting(false);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(vehicles, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pojazdy-przejazd-sluzbowy.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const valid = Array.isArray(data) && data.length > 0 &&
          data.every(v => v && typeof v.name === 'string' && v.masaHamujaca !== undefined &&
            (v.masaSluzbowa !== undefined || v.masaOgolna !== undefined));
        if (!valid) throw new Error('zły format');
        const list = data.map((v, i) => v.masaSluzbowa !== undefined
          ? { ...EMPTY_VEHICLE, ...v, id: v.id || 'v' + Date.now() + '_' + i }
          : fromMainCard(v, i));
        if (window.confirm(`Zastąpić obecną listę ${list.length} pojazdami z pliku?`)) {
          changeVehicles(list);
          setAdminMessage(`Wczytano ${list.length} pojazdów z pliku.`);
        }
      } catch {
        setAdminMessage('Nie udało się wczytać pliku. Wybierz plik JSON wyeksportowany z tej aplikacji lub z Karty próby hamulca.');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const inputCls = 'w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-blue-900';

  // ===== WIDOK =====
  return (
    <div className="min-h-screen text-slate-900">
      {/* ================= NAGŁÓWEK ================= */}
      <header className="bg-blue-900 text-white">
        <div className="h-1.5 bg-yellow-400" />
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-yellow-300 text-sm font-medium">Koleje Dolnośląskie</p>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight mt-1">Karta próby hamulca</h1>
            <p className="mt-2 inline-flex items-center gap-2 bg-yellow-400 text-blue-900 text-sm font-semibold px-3 py-1 rounded-full">
              Przejazd służbowy bez podróżnych
            </p>
            {(updateInfo.date || updateInfo.changes) && (
              <p className="text-sm text-blue-100 mt-3 max-w-xl">
                {updateInfo.date && <>Aktualizacja: <strong className="text-white">{formatDate(updateInfo.date)}</strong></>}
                {updateInfo.date && updateInfo.changes && <br />}
                {updateInfo.changes}
              </p>
            )}
          </div>
          <button
            onClick={() => (isAdmin ? handleLogout() : setShowLogin(true))}
            title={isAdmin ? 'Wyjdź z trybu administratora' : 'Tryb administratora'}
            aria-label={isAdmin ? 'Wyjdź z trybu administratora' : 'Tryb administratora'}
            className="w-9 h-9 flex-shrink-0 rounded-full bg-blue-800 hover:bg-blue-700 flex items-center justify-center text-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            {isAdmin ? <LogOut size={16} /> : <Lock size={16} />}
          </button>
        </div>
        <div className="max-w-4xl mx-auto px-4 pb-5">
          <div role="note" className="bg-red-50 border border-red-200 rounded-md px-4 py-3 text-red-700 text-sm sm:text-base leading-snug flex items-start justify-center gap-3">
            <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-center">
              Aplikacja ma charakter wyłącznie pomocniczy i ułatwia wypełnienie karty próby hamulca.
              Korzystasz z niej na własną odpowiedzialność — nie zwalnia ona kierownika pociągu z obowiązku
              sprawdzenia, czy wyliczone wartości są prawidłowe.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* ================= WZORY ================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white rounded-md p-3 border-l-4 border-yellow-400 shadow-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="font-serif text-lg flex items-center">
                <span className="italic">M<sub>hw</sub></span>
                <span className="mx-1">=</span>
                <Fraction top={<span className="italic">M<sub>o</sub> × P<sub>w</sub></span>} bottom={<span>100</span>} />
              </div>
              <RoundBadge up />
            </div>
            <p className="text-xs text-slate-500 mt-1">M<sub>o</sub> – masa pociągu bez podróżnych, P<sub>w</sub> – procent wymagany (z WRJ)</p>
          </div>
          <div className="bg-white rounded-md p-3 border-l-4 border-blue-900 shadow-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="font-serif text-lg flex items-center">
                <span className="italic">P<sub>R</sub></span>
                <span className="mx-1">=</span>
                <Fraction top={<span className="italic">M<sub>hr</sub></span>} bottom={<span className="italic">M<sub>o</sub></span>} />
                <span className="ml-1">× 100</span>
              </div>
              <RoundBadge />
            </div>
            <p className="text-xs text-slate-500 mt-1">M<sub>hr</sub> – masa hamująca rzeczywista</p>
          </div>
        </section>

        {/* ================= DANE WEJŚCIOWE ================= */}
        <section className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="text-lg font-bold text-blue-900 mb-4">Dane do próby</h2>

          {!vehiclesLoaded ? (
            <p className="text-slate-500 flex items-center gap-2"><RefreshCw size={16} className="animate-spin" /> Wczytywanie listy pojazdów…</p>
          ) : vehicles.length === 0 ? (
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded text-sm text-slate-800">
              Lista pojazdów jest jeszcze pusta. Administrator może ją pobrać z Karty próby hamulca albo dodać pojazdy ręcznie (kłódka w prawym górnym rogu).
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="v1" className="block text-sm font-medium text-slate-700 mb-2">Pojazd 1 *</label>
                <select id="v1" value={vehicle1} onChange={e => setVehicle1(e.target.value)} className={inputCls}>
                  <option value="">— wybierz pojazd —</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="v2" className="block text-sm font-medium text-slate-700 mb-2">Pojazd 2 (opcjonalnie)</label>
                <select id="v2" value={vehicle2} onChange={e => setVehicle2(e.target.value)} className={inputCls} disabled={!vehicle1}>
                  <option value="">— brak —</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
                <p className="text-xs text-slate-500 mt-1">Wybierz, gdy jadą dwa połączone zespoły.</p>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="pw" className="block text-sm font-medium text-slate-700 mb-1">Procent wymagany (%) *</label>
                <p className="text-xs text-slate-500 mb-2">Bierzemy go z WRJ (wewnętrznego rozkładu jazdy).</p>
                <input
                  id="pw" type="text" inputMode="decimal" placeholder="np. 65"
                  value={procentWymagany} onChange={e => setProcentWymagany(e.target.value)}
                  className={`${inputCls} sm:max-w-xs`}
                />
                {pwError && <p className="text-sm text-red-700 mt-1">{pwError}</p>}
              </div>
            </div>
          )}
        </section>

        {/* ================= WYNIK ================= */}
        {results && (
          <section className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className={`px-5 py-4 flex items-center gap-3 ${results.isSuccess ? 'bg-green-700' : 'bg-red-700'} text-white`}>
              {results.isSuccess ? <CheckCircle size={28} /> : <AlertCircle size={28} />}
              <div>
                <p className="text-xl font-bold">{results.isSuccess ? 'Próba pomyślna' : 'Próba niepomyślna'}</p>
                {!results.isSuccess && <p className="text-sm text-red-100">Konieczne jest wyliczenie nowej prędkości.</p>}
              </div>
            </div>

            {unverified.length > 0 && (
              <div className="mx-5 mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded text-sm text-slate-800 flex gap-2">
                <AlertTriangle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <span>
                  Masa bez podróżnych dla {unverified.map(v => `„${v.name}”`).join(' i ')} nie została jeszcze sprawdzona przez administratora. Porównaj ją z dokumentacją pojazdu.
                </span>
              </div>
            )}

            <div className="px-5 py-2">
              <ResultRow label="Masa pociągu bez podróżnych" sub="Mo – suma mas wybranych pojazdów" value={fmt(results.masaOgolna)} unit="t" />
              <ResultRow label="Masa hamująca rzeczywista" sub="Mhr" value={fmt(results.masaHamujacaRzeczywista)} unit="t" />
              <ResultRow
                label="Masa hamująca wymagana"
                sub={`Mhw = ${fmt(results.masaOgolna)} × ${fmt(pw)} / 100 = ${fmt(results.masaHamujacaWymaganaDokladna)} → w górę`}
                value={results.masaHamujacaWymagana} unit="t"
              />
              <ResultRow
                label="Procent masy hamującej rzeczywistej"
                sub={`PR = ${fmt(results.masaHamujacaRzeczywista)} / ${fmt(results.masaOgolna)} × 100 = ${fmt(results.procentDokladny)} → w dół`}
                value={results.procentMasyHamujacejRzeczywistej} unit="%" strong
              />
              <ResultRow label="Procent wymagany" sub="z WRJ" value={fmt(pw)} unit="%" />
              <ResultRow label="Ciśnienie powietrza w przewodzie głównym" sub={selected.length > 1 ? 'większa z wartości obu pojazdów' : undefined} value={results.cisnienieGlowne ? fmt(results.cisnienieGlowne) : '—'} unit="MPa" />
              <ResultRow label="Ciśnienie sprężonego powietrza w przewodzie" sub={selected.length > 1 ? 'większa z wartości obu pojazdów' : undefined} value={fmt(results.cisnienie)} unit="MPa" />
            </div>

            <div className="px-5 pb-5">
              <h3 className="font-semibold text-blue-900 mt-2 mb-2">Pozostałe parametry</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="py-1 pr-3 font-normal">Urządzenie</th>
                      {selected.map((v, i) => <th key={v.id + i} className="py-1 px-2 font-normal">{v.name}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {YES_NO_FIELDS.map(f => (
                      <tr key={f.key} className="border-t border-slate-200">
                        <td className="py-2 pr-3">{f.label}</td>
                        {selected.map((v, i) => (
                          <td key={v.id + i} className={`py-2 px-2 font-semibold ${v[f.key] === 'TAK' ? 'text-green-700' : 'text-slate-400'}`}>{v[f.key]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ================= PANEL ADMINISTRATORA ================= */}
        {isAdmin && (
          <section className="bg-white rounded-lg shadow-sm p-5 border-t-4 border-yellow-400">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-lg font-bold text-blue-900">Panel administratora</h2>
              <button onClick={handleLogout} className="text-sm text-slate-600 hover:text-blue-900 inline-flex items-center gap-1">
                <LogOut size={14} /> Wyjdź
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-3">Zmiany zapisują się automatycznie i od razu widzą je wszyscy.</p>

            <div className={`mb-4 p-3 rounded-md text-sm border-l-4 ${
              saveStatus === 'error' ? 'bg-red-50 border-red-500 text-red-800'
              : saveStatus === 'saving' ? 'bg-yellow-50 border-yellow-400 text-slate-800'
              : 'bg-green-50 border-green-600 text-green-900'}`}>
              {saveStatus === 'error' && <>Nie udało się zapisać zmian w bazie. Szczegóły: {saveError}</>}
              {saveStatus === 'saving' && 'Zapisywanie…'}
              {saveStatus === 'saved' && 'Zapisano w bazie.'}
              {saveStatus === '' && 'Połączono z bazą.'}
            </div>

            {adminMessage && (
              <div className="mb-4 p-3 rounded-md text-sm bg-blue-50 border-l-4 border-blue-900 text-blue-900 flex justify-between gap-2">
                <span>{adminMessage}</span>
                <button onClick={() => setAdminMessage('')} aria-label="Zamknij komunikat"><X size={16} /></button>
              </div>
            )}

            {/* Informacja o aktualizacji */}
            <div className="mb-6">
              <h3 className="font-semibold text-slate-800 mb-2">Informacja o aktualizacji</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex gap-2">
                  <input type="date" value={updateInfo.date} onChange={e => changeUpdateInfo({ ...updateInfo, date: e.target.value })} className={inputCls} />
                  <button onClick={() => changeUpdateInfo({ ...updateInfo, date: todayIso() })} className="px-3 text-sm bg-slate-100 hover:bg-slate-200 rounded-md whitespace-nowrap">Dziś</button>
                </div>
                <textarea
                  rows={2} placeholder="Opis zmian"
                  value={updateInfo.changes} onChange={e => changeUpdateInfo({ ...updateInfo, changes: e.target.value })}
                  className={`${inputCls} sm:col-span-2`}
                />
              </div>
            </div>

            {/* Narzędzia listy */}
            <div className="flex flex-wrap gap-2 mb-5">
              <button onClick={handleImportFromMainCard} disabled={importing}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-blue-900 text-white hover:bg-blue-800 disabled:opacity-60">
                <RefreshCw size={14} className={importing ? 'animate-spin' : ''} /> Pobierz listę z Karty próby hamulca
              </button>
              <button onClick={handleExport} disabled={vehicles.length === 0}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-slate-100 hover:bg-slate-200 disabled:opacity-50">
                <Download size={14} /> Eksportuj do pliku
              </button>
              <button onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-slate-100 hover:bg-slate-200">
                <Upload size={14} /> Wczytaj z pliku
              </button>
              <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleImportFile} className="hidden" />
            </div>

            {/* Lista pojazdów */}
            <h3 className="font-semibold text-slate-800 mb-2">Pojazdy ({vehicles.length})</h3>
            <div className="space-y-3 mb-6">
              {vehicles.map(v => (
                <div key={v.id} className={`rounded-md border p-3 ${v.sprawdzony === false ? 'border-yellow-400 bg-yellow-50' : 'border-slate-200'}`}>
                  <div className="flex gap-2 mb-2">
                    <input value={v.name} onChange={e => updateVehicle(v.id, 'name', e.target.value)} className={`${inputCls} font-semibold`} aria-label="Nazwa pojazdu" />
                    <button onClick={() => deleteVehicle(v.id)} title="Usuń pojazd" aria-label={`Usuń ${v.name}`}
                      className="px-3 rounded-md text-red-700 hover:bg-red-50"><Trash2 size={16} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <label className="text-xs text-slate-600">Masa bez podróżnych (t)
                      <input inputMode="decimal" value={v.masaSluzbowa} onChange={e => updateVehicle(v.id, 'masaSluzbowa', e.target.value)} className={`${inputCls} mt-1`} />
                    </label>
                    <label className="text-xs text-slate-600">Masa hamująca (t)
                      <input inputMode="decimal" value={v.masaHamujaca} onChange={e => updateVehicle(v.id, 'masaHamujaca', e.target.value)} className={`${inputCls} mt-1`} />
                    </label>
                    <label className="text-xs text-slate-600">Ciśnienie powietrza w przewodzie głównym (MPa)
                      <input inputMode="decimal" value={v.cisnienieGlowne ?? ''} onChange={e => updateVehicle(v.id, 'cisnienieGlowne', e.target.value)} className={`${inputCls} mt-1`} />
                    </label>
                    <label className="text-xs text-slate-600">Ciśnienie sprężonego powietrza w przewodzie (MPa)
                      <input inputMode="decimal" value={v.cisnienie} onChange={e => updateVehicle(v.id, 'cisnienie', e.target.value)} className={`${inputCls} mt-1`} />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                    {YES_NO_FIELDS.map(f => (
                      <label key={f.key} className="text-xs text-slate-600">{f.label}
                        <select value={v[f.key]} onChange={e => updateVehicle(v.id, f.key, e.target.value)} className={`${inputCls} mt-1`}>
                          <option value="TAK">TAK</option>
                          <option value="-">-</option>
                        </select>
                      </label>
                    ))}
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={v.sprawdzony !== false} onChange={e => updateVehicle(v.id, 'sprawdzony', e.target.checked)} className="w-4 h-4 accent-blue-900" />
                    Dane sprawdzone
                  </label>
                </div>
              ))}
            </div>

            {/* Dodawanie pojazdu */}
            <div className="rounded-md bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-800 mb-3">Dodaj pojazd</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-2">
                <input placeholder="Nazwa serii, np. 36WEa-011 do 36WEa-016" value={newVehicle.name}
                  onChange={e => setNewVehicle({ ...newVehicle, name: e.target.value })} className={`${inputCls} sm:col-span-4`} />
                <input placeholder="Masa bez podróżnych (t)" inputMode="decimal" value={newVehicle.masaSluzbowa}
                  onChange={e => setNewVehicle({ ...newVehicle, masaSluzbowa: e.target.value })} className={inputCls} />
                <input placeholder="Masa hamująca (t)" inputMode="decimal" value={newVehicle.masaHamujaca}
                  onChange={e => setNewVehicle({ ...newVehicle, masaHamujaca: e.target.value })} className={inputCls} />
                <div className="hidden sm:block sm:col-span-2" />
                <label className="text-xs text-slate-600 sm:col-span-2">Ciśnienie powietrza w przewodzie głównym (MPa)
                  <input placeholder="np. 0,5" inputMode="decimal" value={newVehicle.cisnienieGlowne}
                    onChange={e => setNewVehicle({ ...newVehicle, cisnienieGlowne: e.target.value })} className={`${inputCls} mt-1`} />
                </label>
                <label className="text-xs text-slate-600 sm:col-span-2">Ciśnienie sprężonego powietrza w przewodzie (MPa)
                  <input placeholder="np. 1,0" inputMode="decimal" value={newVehicle.cisnienie}
                    onChange={e => setNewVehicle({ ...newVehicle, cisnienie: e.target.value })} className={`${inputCls} mt-1`} />
                </label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                {YES_NO_FIELDS.map(f => (
                  <label key={f.key} className="text-xs text-slate-600">{f.label}
                    <select value={newVehicle[f.key]} onChange={e => setNewVehicle({ ...newVehicle, [f.key]: e.target.value })} className={`${inputCls} mt-1`}>
                      <option value="TAK">TAK</option>
                      <option value="-">-</option>
                    </select>
                  </label>
                ))}
              </div>
              {addError && <p className="text-sm text-red-700 mb-2">{addError}</p>}
              <button onClick={handleAddVehicle}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-yellow-400 text-blue-900 font-semibold hover:bg-yellow-300">
                <Plus size={16} /> Dodaj pojazd
              </button>
            </div>
          </section>
        )}

        <footer className="text-center text-xs text-slate-500 pt-2 pb-6">
          Grzegorz Rejszel, kier. poc. 186
        </footer>
      </main>

      {/* ================= OKNO LOGOWANIA ================= */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={closeLogin}>
          <div className="bg-white rounded-lg shadow-xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-blue-900">Tryb administratora</h2>
              <button onClick={closeLogin} aria-label="Zamknij"><X size={18} /></button>
            </div>
            <input
              type="password" autoFocus placeholder="Hasło"
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className={inputCls}
            />
            {loginError && <p className="text-sm text-red-700 mt-2">{loginError}</p>}
            <button onClick={handleLogin} className="mt-3 w-full py-2 rounded-md bg-blue-900 text-white font-semibold hover:bg-blue-800">
              Zaloguj
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
