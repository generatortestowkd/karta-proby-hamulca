import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle, Lock, X, Plus, Trash2, RotateCcw, Download, Upload, LogOut, ArrowDown, ArrowUp } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

// ===== FIREBASE (ten sam projekt co „Zestawienie pojazdów KD”) =====
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

// Dane karty próby hamulca trzymamy w osobnej kolekcji „kph”,
// żeby nie mieszały się z danymi zestawienia pojazdów.
const VEHICLES_DOC = doc(db, 'kph', 'pojazdy');
const UPDATE_DOC = doc(db, 'kph', 'aktualizacja');

// ===== USTAWIENIA =====
const ADMIN_PASSWORD = 'KPH2026';

const DEFAULT_VEHICLES = [
  { name: "SA108-011", masaOgolna: 59, masaHamujaca: 82, cisnienie: 0.8, hamulecElektro: "-", ukladSterowania: "-", ukladDrzwi: "TAK", inne: "TAK" },
  { name: "SA132-002", masaOgolna: 98, masaHamujaca: 147, cisnienie: 0.8, hamulecElektro: "-", ukladSterowania: "-", ukladDrzwi: "TAK", inne: "TAK" },
  { name: "SA134-001 do SA134-002", masaOgolna: 86, masaHamujaca: 147, cisnienie: 0.8, hamulecElektro: "-", ukladSterowania: "-", ukladDrzwi: "TAK", inne: "TAK" },
  { name: "SA134-003 do SA134-007", masaOgolna: 98, masaHamujaca: 147, cisnienie: 0.8, hamulecElektro: "-", ukladSterowania: "-", ukladDrzwi: "TAK", inne: "TAK" },
  { name: "SA134-023 do SA134-025", masaOgolna: 98, masaHamujaca: 147, cisnienie: 0.8, hamulecElektro: "-", ukladSterowania: "-", ukladDrzwi: "TAK", inne: "TAK" },
  { name: "SA135-001 do SA135-003", masaOgolna: 55, masaHamujaca: 93, cisnienie: 0.8, hamulecElektro: "-", ukladSterowania: "-", ukladDrzwi: "TAK", inne: "TAK" },
  { name: "SA135-004 do SA135-009", masaOgolna: 55, masaHamujaca: 93, cisnienie: 0.8, hamulecElektro: "-", ukladSterowania: "-", ukladDrzwi: "TAK", inne: "TAK" },
  { name: "SA139-010 do SA139-014", masaOgolna: 106, masaHamujaca: 157, cisnienie: 1.0, hamulecElektro: "-", ukladSterowania: "TAK", ukladDrzwi: "TAK", inne: "TAK" },
  { name: "48WEc-024 do 48WEc-036", masaOgolna: 201, masaHamujaca: 358, cisnienie: 0.95, hamulecElektro: "TAK", ukladSterowania: "TAK", ukladDrzwi: "TAK", inne: "TAK" },
  { name: "31WE-001 do 31WE-005", masaOgolna: 172, masaHamujaca: 281, cisnienie: 1.0, hamulecElektro: "TAK", ukladSterowania: "TAK", ukladDrzwi: "TAK", inne: "TAK" },
  { name: "31WE-020 do 31WE-024", masaOgolna: 172, masaHamujaca: 281, cisnienie: 1.0, hamulecElektro: "TAK", ukladSterowania: "TAK", ukladDrzwi: "TAK", inne: "TAK" },
  { name: "36WEa-011 do 36WEa-016", masaOgolna: 135, masaHamujaca: 217, cisnienie: 1.0, hamulecElektro: "TAK", ukladSterowania: "TAK", ukladDrzwi: "TAK", inne: "TAK" },
  { name: "36WEh-012 do 36WEh-017", masaOgolna: 143, masaHamujaca: 228, cisnienie: 1.0, hamulecElektro: "TAK", ukladSterowania: "TAK", ukladDrzwi: "TAK", inne: "TAK" },
  { name: "45WE-019 do 45WE-029", masaOgolna: 207, masaHamujaca: 335, cisnienie: 1.0, hamulecElektro: "TAK", ukladSterowania: "TAK", ukladDrzwi: "TAK", inne: "TAK" },
  { name: "EN57-1703", masaOgolna: 138, masaHamujaca: 130, cisnienie: 0.7, hamulecElektro: "-", ukladSterowania: "TAK", ukladDrzwi: "TAK", inne: "TAK" },
  { name: "EN57AKD 1937", masaOgolna: 155, masaHamujaca: 174, cisnienie: 0.7, hamulecElektro: "TAK", ukladSterowania: "TAK", ukladDrzwi: "TAK", inne: "TAK" },
  { name: "EN57AKM 1718", masaOgolna: 140, masaHamujaca: 165, cisnienie: 0.7, hamulecElektro: "TAK", ukladSterowania: "TAK", ukladDrzwi: "TAK", inne: "TAK" },
  { name: "EN57AL 1501", masaOgolna: 147, masaHamujaca: 161, cisnienie: 0.7, hamulecElektro: "TAK", ukladSterowania: "TAK", ukladDrzwi: "TAK", inne: "TAK" },
  { name: "EN57AL 1542", masaOgolna: 147, masaHamujaca: 161, cisnienie: 0.7, hamulecElektro: "TAK", ukladSterowania: "TAK", ukladDrzwi: "TAK", inne: "TAK" },
  { name: "EN67AL 1938", masaOgolna: 145, masaHamujaca: 161, cisnienie: 0.7, hamulecElektro: "TAK", ukladSterowania: "TAK", ukladDrzwi: "TAK", inne: "TAK" }
].map((v, i) => ({ id: 'v' + (i + 1), ...v }));

const EMPTY_VEHICLE = {
  name: '', masaOgolna: '', masaHamujaca: '', cisnienie: '',
  hamulecElektro: 'TAK', ukladSterowania: 'TAK', ukladDrzwi: 'TAK', inne: 'TAK'
};

const YES_NO_FIELDS = [
  { key: 'hamulecElektro', label: 'Hamulec elektrodynamiczny' },
  { key: 'ukladSterowania', label: 'Układ sterowania el.-pneum.' },
  { key: 'ukladDrzwi', label: 'Układ zamykania drzwi' },
  { key: 'inne', label: 'Inne urządzenia' }
];

// ===== INFORMACJA O AKTUALIZACJI =====
const DEFAULT_UPDATE = {
  date: '2026-09-25',
  changes: 'Dodano tryb administratora, edycję listy pojazdów oraz wzory do obliczeń.'
};

const formatDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}.${m}.${y}` : iso;
};

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const toNumber = (val) => {
  if (val === '' || val === null || val === undefined) return '';
  const n = parseFloat(String(val).replace(',', '.'));
  return isNaN(n) ? '' : n;
};

// ===== UŁAMEK DO WZORÓW =====
function Fraction({ top, bottom }) {
  return (
    <span className="inline-flex flex-col items-center align-middle mx-1 leading-tight">
      <span className="px-1">{top}</span>
      <span className="px-1 border-t border-gray-800">{bottom}</span>
    </span>
  );
}

export default function BrakeTestCalculator() {
  const [vehicles, setVehicles] = useState(DEFAULT_VEHICLES);
  const [vehiclesLoaded, setVehiclesLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // '', 'saving', 'saved', 'error'
  const [saveError, setSaveError] = useState('');
  const vehiclesDirty = useRef(false);
  const updateDirty = useRef(false);
  const [vehicle1, setVehicle1] = useState('');
  const [vehicle2, setVehicle2] = useState('');
  const [procentWymagany, setProcentWymagany] = useState('');
  const [showResults, setShowResults] = useState(false);

  // tryb administratora
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [newVehicle, setNewVehicle] = useState(EMPTY_VEHICLE);
  const [addError, setAddError] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const fileInputRef = useRef(null);

  // informacja o aktualizacji (data + opis zmian)
  const [updateInfo, setUpdateInfo] = useState(DEFAULT_UPDATE);

  // zmiany robione przez administratora — oznaczamy je do zapisu w bazie
  const changeVehicles = (updater) => { vehiclesDirty.current = true; setVehicles(updater); };
  const changeUpdateInfo = (value) => { updateDirty.current = true; setUpdateInfo(value); };

  // odczyt z bazy na żywo — każda zmiana admina od razu pojawia się u wszystkich
  useEffect(() => {
    const fallback = setTimeout(() => setVehiclesLoaded(true), 6000);

    const unsubVehicles = onSnapshot(VEHICLES_DOC, snap => {
      if (snap.metadata.hasPendingWrites) return;
      const list = snap.exists() ? snap.data().list : null;
      if (Array.isArray(list) && list.length > 0) setVehicles(list);
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

  // zapis do bazy (z krótkim opóźnieniem, żeby nie zapisywać przy każdym znaku)
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

  // jeśli wybrany pojazd został usunięty — wyczyść wybór
  useEffect(() => {
    if (vehicle1 && !vehicles.some(v => v.id === vehicle1)) { setVehicle1(''); setShowResults(false); }
    if (vehicle2 && !vehicles.some(v => v.id === vehicle2)) setVehicle2('');
  }, [vehicles, vehicle1, vehicle2]);

  const selectedVehicle1 = vehicles.find(v => v.id === vehicle1);
  const selectedVehicle2 = vehicles.find(v => v.id === vehicle2);

  const handleCalculate = () => {
    if (selectedVehicle1 && procentWymagany) setShowResults(true);
  };

  const handleReset = () => {
    setVehicle1('');
    setVehicle2('');
    setProcentWymagany('');
    setShowResults(false);
  };

  const calculateResults = () => {
    if (!selectedVehicle1 || !procentWymagany) return null;

    const pw = parseFloat(procentWymagany);
    const masaOgolna = Number(selectedVehicle1.masaOgolna) + Number(selectedVehicle2?.masaOgolna || 0);
    const masaHamujacaRzeczywista = Number(selectedVehicle1.masaHamujaca) + Number(selectedVehicle2?.masaHamujaca || 0);
    if (!masaOgolna) return null;

    // Mhw = Mo × Pw / 100 — zaokrąglamy w górę
    const masaHamujacaWymagana = Math.ceil((masaOgolna * pw) / 100);

    // Pr = 100 × Mhr / Mo — zaokrąglamy w dół
    const procentMasyHamujacejRzeczywistej = Math.floor((masaHamujacaRzeczywista * 100) / masaOgolna);

    const cisnienieSprezonegoPowietrza = selectedVehicle2
      ? Math.max(Number(selectedVehicle1.cisnienie), Number(selectedVehicle2.cisnienie))
      : Number(selectedVehicle1.cisnienie);

    const isSuccess = masaHamujacaRzeczywista >= masaHamujacaWymagana &&
                      procentMasyHamujacejRzeczywistej >= pw;

    return {
      masaOgolna, masaHamujacaRzeczywista,
      masaHamujacaWymagana,
      procentMasyHamujacejRzeczywistej,
      cisnienieSprezonegoPowietrza, isSuccess
    };
  };

  const results = calculateResults();

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

  const closeLogin = () => {
    setShowLogin(false);
    setPassword('');
    setLoginError('');
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setAdminMessage('');
    setAddError('');
  };

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
    const mo = toNumber(newVehicle.masaOgolna);
    const mh = toNumber(newVehicle.masaHamujaca);
    const p = toNumber(newVehicle.cisnienie);

    if (!name) return setAddError('Wpisz nazwę serii pojazdów.');
    if (vehicles.some(v => v.name.trim().toLowerCase() === name.toLowerCase()))
      return setAddError('Pojazd o tej nazwie już jest na liście.');
    if (mo === '' || mo <= 0) return setAddError('Wpisz masę ogólną większą od zera.');
    if (mh === '' || mh <= 0) return setAddError('Wpisz masę hamującą większą od zera.');
    if (p === '' || p <= 0) return setAddError('Wpisz ciśnienie większe od zera.');

    changeVehicles(list => [...list, {
      ...newVehicle, id: 'v' + Date.now(), name,
      masaOgolna: mo, masaHamujaca: mh, cisnienie: p
    }]);
    setNewVehicle(EMPTY_VEHICLE);
    setAddError('');
    setAdminMessage(`Dodano pojazd „${name}”.`);
  };

  const handleRestoreDefaults = () => {
    if (window.confirm('Przywrócić oryginalną listę pojazdów? Wszystkie zmiany i dodane pojazdy zostaną usunięte.')) {
      changeVehicles(DEFAULT_VEHICLES);
      setAdminMessage('Przywrócono domyślną listę pojazdów.');
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(vehicles, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pojazdy-karta-proby-hamulca.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const valid = Array.isArray(data) && data.length > 0 &&
          data.every(v => v && typeof v.name === 'string' && v.masaOgolna !== undefined && v.masaHamujaca !== undefined);
        if (!valid) throw new Error('zły format');
        const withIds = data.map((v, i) => ({ ...v, id: v.id || 'v' + Date.now() + '_' + i }));
        if (window.confirm(`Zastąpić obecną listę ${withIds.length} pojazdami z pliku?`)) {
          changeVehicles(withIds);
          setAdminMessage(`Wczytano ${withIds.length} pojazdów z pliku.`);
        }
      } catch {
        setAdminMessage('Nie udało się wczytać pliku. Wybierz plik wyeksportowany z tej aplikacji.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!vehiclesLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-yellow-50 to-blue-50 flex items-center justify-center p-4">
        <p className="text-blue-900 font-medium">Ładowanie listy pojazdów…</p>
      </div>
    );
  }

  const inputCls = "w-full p-2 border-2 border-blue-300 rounded-md focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400";
  const smallInputCls = "w-full p-1.5 text-sm border-2 border-blue-200 rounded-md focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-yellow-50 to-blue-50 p-4 relative">
      {/* Tło z pociągiem */}
      <div className="fixed inset-0 opacity-10 pointer-events-none" style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=1200)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}></div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6 overflow-hidden relative">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'url(https://kolejedolnoslaskie.pl/wp-content/uploads/2024/01/Koleje-Dolnoslaskie-Impuls-2-fot.-Dawid-Tatarkiewicz-19-scaled.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          ></div>

          {/* Mała ikonka trybu administratora */}
          {!isAdmin && (
            <button
              onClick={() => setShowLogin(true)}
              title="Tryb administratora"
              aria-label="Tryb administratora"
              className="absolute top-3 right-3 z-20 p-2 rounded-full text-gray-400 hover:text-blue-900 hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-colors"
            >
              <Lock size={18} />
            </button>
          )}

          {/* Autor — lewy górny róg */}
          <div className="absolute top-3 left-3 z-20 text-xs sm:text-sm text-gray-700 font-medium bg-white/70 px-2 py-1 rounded">
            Autor: Grzegorz Rejszel (kier. poć. 186)
          </div>

          <div className="text-center relative z-10 pt-6 sm:pt-2">
            <h1 className="text-4xl font-bold text-blue-900">Próba hamulca</h1>
            <p className="text-lg text-gray-700 mt-3 font-medium">Aplikacja dla kierowników pociągu wypełniających kartę próby hamulca.</p>

            {(updateInfo.date || updateInfo.changes) && (
              <div className="inline-block mt-4 bg-white/80 border-l-4 border-yellow-400 px-4 py-2 rounded text-left max-w-2xl">
                {updateInfo.date && (
                  <p className="text-sm font-semibold text-blue-900">Aktualizacja: {formatDate(updateInfo.date)}</p>
                )}
                {updateInfo.changes && (
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">{updateInfo.changes}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {isAdmin ? (
          /* ================= PANEL ADMINISTRATORA ================= */
          <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-blue-900">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h2 className="text-2xl font-semibold text-blue-900">Tryb administratora — lista pojazdów</h2>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-yellow-500 text-blue-900 font-bold py-2 px-4 rounded-md hover:bg-yellow-400 transition-colors"
              >
                <LogOut size={18} /> Zakończ i wróć
              </button>
            </div>

            <div className={`mb-4 p-3 rounded-md text-sm border-l-4 ${
              saveStatus === 'error' ? 'bg-red-50 border-red-500 text-red-800'
              : saveStatus === 'saving' ? 'bg-yellow-50 border-yellow-400 text-blue-900'
              : 'bg-green-50 border-green-500 text-green-800'}`}>
              {saveStatus === 'error'
                ? <>Nie udało się zapisać zmian w bazie. Pokaż ten komunikat w czacie: <span className="font-mono">{saveError}</span></>
                : saveStatus === 'saving' ? 'Zapisywanie zmian…'
                : saveStatus === 'saved' ? 'Wszystkie zmiany zapisane w bazie.'
                : 'Zmiany wprowadzone tutaj zapiszą się w bazie i będą widoczne dla wszystkich.'}
            </div>

            {adminMessage && (
              <div className="mb-4 p-3 rounded-md bg-blue-50 border-l-4 border-blue-500 text-sm text-blue-900 flex justify-between items-start gap-3">
                <span>{adminMessage}</span>
                <button onClick={() => setAdminMessage('')} aria-label="Zamknij komunikat"><X size={16} /></button>
              </div>
            )}

            {/* Informacja o aktualizacji */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-md p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-3">Informacja o aktualizacji (wyświetlana w nagłówku)</h3>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data aktualizacji</label>
                  <input
                    type="date"
                    value={updateInfo.date}
                    onChange={e => changeUpdateInfo({ ...updateInfo, date: e.target.value })}
                    className={inputCls}
                  />
                  <button
                    onClick={() => changeUpdateInfo({ ...updateInfo, date: todayIso() })}
                    className="mt-2 text-sm text-blue-900 underline hover:text-blue-700"
                  >
                    Ustaw dzisiejszą datę
                  </button>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Wprowadzone zmiany</label>
                  <textarea
                    rows={3}
                    value={updateInfo.changes}
                    onChange={e => changeUpdateInfo({ ...updateInfo, changes: e.target.value })}
                    placeholder="np. Dodano pojazd 36WEh-018, poprawiono masę EN57AKM 1718."
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Dodawanie nowej serii */}
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-md p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-3">Dodaj nową serię pojazdów</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="sm:col-span-2 lg:col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa (tak jak ma się wyświetlać na liście)</label>
                  <input
                    type="text"
                    value={newVehicle.name}
                    onChange={e => setNewVehicle({ ...newVehicle, name: e.target.value })}
                    placeholder="np. 36WEh-018 do 36WEh-020"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Masa ogólna [t]</label>
                  <input type="number" min="0" step="any" value={newVehicle.masaOgolna}
                    onChange={e => setNewVehicle({ ...newVehicle, masaOgolna: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Masa hamująca [t]</label>
                  <input type="number" min="0" step="any" value={newVehicle.masaHamujaca}
                    onChange={e => setNewVehicle({ ...newVehicle, masaHamujaca: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ciśnienie [MPa]</label>
                  <input type="number" min="0" step="0.01" value={newVehicle.cisnienie}
                    onChange={e => setNewVehicle({ ...newVehicle, cisnienie: e.target.value })} className={inputCls} />
                </div>
                <div className="hidden lg:block" />
                {YES_NO_FIELDS.map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                    <select value={newVehicle[f.key]}
                      onChange={e => setNewVehicle({ ...newVehicle, [f.key]: e.target.value })} className={inputCls}>
                      <option value="TAK">TAK</option>
                      <option value="-">-</option>
                    </select>
                  </div>
                ))}
              </div>
              {addError && <p className="text-sm text-red-700 mt-3">{addError}</p>}
              <button
                onClick={handleAddVehicle}
                className="mt-4 flex items-center gap-2 bg-blue-900 text-white font-bold py-2 px-5 rounded-md hover:bg-blue-800 transition-colors"
              >
                <Plus size={18} /> Dodaj pojazd
              </button>
            </div>

            {/* Lista istniejących pojazdów */}
            <h3 className="font-semibold text-blue-900 mb-1">Pojazdy na liście ({vehicles.length})</h3>
            <p className="text-sm text-gray-600 mb-3">Zmiany zapisują się automatycznie i od razu widzą je wszyscy.</p>

            <div className="space-y-3">
              {vehicles.map(v => (
                <div key={v.id} className="border-2 border-blue-100 rounded-md p-3 bg-blue-50/40">
                  <div className="flex gap-2 items-end mb-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nazwa</label>
                      <input type="text" value={v.name}
                        onChange={e => updateVehicle(v.id, 'name', e.target.value)}
                        className={smallInputCls + ' font-semibold'} />
                    </div>
                    <button
                      onClick={() => deleteVehicle(v.id)}
                      title="Usuń pojazd"
                      aria-label={`Usuń ${v.name}`}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Masa ogólna [t]</label>
                      <input type="number" min="0" step="any" value={v.masaOgolna}
                        onChange={e => updateVehicle(v.id, 'masaOgolna', toNumber(e.target.value))} className={smallInputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Masa ham. [t]</label>
                      <input type="number" min="0" step="any" value={v.masaHamujaca}
                        onChange={e => updateVehicle(v.id, 'masaHamujaca', toNumber(e.target.value))} className={smallInputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Ciśnienie [MPa]</label>
                      <input type="number" min="0" step="0.01" value={v.cisnienie}
                        onChange={e => updateVehicle(v.id, 'cisnienie', toNumber(e.target.value))} className={smallInputCls} />
                    </div>
                    {YES_NO_FIELDS.map(f => (
                      <div key={f.key}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                        <select value={v[f.key]}
                          onChange={e => updateVehicle(v.id, f.key, e.target.value)} className={smallInputCls}>
                          <option value="TAK">TAK</option>
                          <option value="-">-</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Kopia zapasowa */}
            <div className="mt-6 pt-4 border-t-2 border-gray-200 flex flex-wrap gap-3">
              <button onClick={handleExport}
                className="flex items-center gap-2 border-2 border-blue-900 text-blue-900 font-semibold py-2 px-4 rounded-md hover:bg-blue-50 transition-colors">
                <Download size={18} /> Zapisz listę do pliku
              </button>
              <button onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 border-2 border-blue-900 text-blue-900 font-semibold py-2 px-4 rounded-md hover:bg-blue-50 transition-colors">
                <Upload size={18} /> Wczytaj listę z pliku
              </button>
              <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleImport} className="hidden" />
              <button onClick={handleRestoreDefaults}
                className="flex items-center gap-2 border-2 border-red-600 text-red-700 font-semibold py-2 px-4 rounded-md hover:bg-red-50 transition-colors sm:ml-auto">
                <RotateCcw size={18} /> Przywróć listę domyślną
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ================= WZORY (pomoc) ================= */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-6">
              <div className="bg-white rounded-lg shadow p-2 sm:p-3 border-l-4 border-yellow-400 flex flex-col items-center text-center min-w-0 overflow-hidden">
                <p className="text-xs font-semibold text-blue-900 mb-1 leading-tight">Masa hamująca wymagana</p>
                <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                  <div className="font-serif text-gray-900 flex items-center text-sm sm:text-base whitespace-nowrap">
                    <span className="italic">M<sub>hw</sub></span>
                    <span className="mx-0.5 sm:mx-1">=</span>
                    <Fraction
                      top={<span className="italic">M<sub>o</sub> × P<sub>w</sub></span>}
                      bottom={<span>100</span>}
                    />
                  </div>
                  <span className="inline-flex items-center gap-1">
                  <span
                    title="Wynik zaokrąglamy w górę"
                    aria-label="Wynik zaokrąglamy w górę"
                    className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-yellow-500 text-blue-900 flex-shrink-0"
                  >
                    <ArrowUp size={14} />
                  </span>
                  <span className="text-xs font-medium text-gray-700 leading-tight text-left">zaokrąglenie w górę</span>
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 leading-snug break-words">M<sub>o</sub> – masa ogólna, P<sub>w</sub> – procent wymagany (z WRJ)</p>
              </div>

              <div className="bg-white rounded-lg shadow p-2 sm:p-3 border-l-4 border-yellow-400 flex flex-col items-center text-center min-w-0 overflow-hidden">
                <p className="text-xs font-semibold text-blue-900 mb-1 leading-tight">Procent masy hamującej rzeczywistej</p>
                <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                  <div className="font-serif text-gray-900 flex items-center text-sm sm:text-base whitespace-nowrap">
                    <span className="italic">P<sub>R</sub></span>
                    <span className="mx-0.5 sm:mx-1">=</span>
                    <Fraction
                      top={<span className="italic">M<sub>hr</sub></span>}
                      bottom={<span className="italic">M<sub>o</sub></span>}
                    />
                    <span>× 100</span>
                  </div>
                  <span className="inline-flex items-center gap-1">
                  <span
                    title="Wynik zaokrąglamy w dół"
                    aria-label="Wynik zaokrąglamy w dół"
                    className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-900 text-white flex-shrink-0"
                  >
                    <ArrowDown size={14} />
                  </span>
                  <span className="text-xs font-medium text-gray-700 leading-tight text-left">zaokrąglenie w dół</span>
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 leading-snug break-words">M<sub>hr</sub> – masa hamująca rzeczywista, M<sub>o</sub> – masa ogólna</p>
              </div>
            </div>

            {/* ================= WIDOK GŁÓWNY ================= */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-yellow-400">
              <div className="grid lg:grid-cols-2 gap-6 divide-x-0 lg:divide-x-2 divide-gray-300">
                {/* Lewy panel - wybór pojazdów */}
                <div className="pr-0 lg:pr-6">
                  <h2 className="text-xl font-semibold text-blue-900 mb-3">Wybór pojazdów</h2>

                  <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-md">
                    <p className="text-sm text-blue-900">
                      Przy wykonywaniu próby hamulca dla dwóch połączonych składów należy wybrać dwa pojazdy.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pojazd 1 *</label>
                      <select value={vehicle1} onChange={(e) => setVehicle1(e.target.value)} className={inputCls}>
                        <option value="">-- Wybierz pojazd --</option>
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>

                    {selectedVehicle1 && (
                      <div className="bg-blue-50 p-4 rounded-md border-l-4 border-blue-500">
                        <p className="text-sm"><strong>Masa ogólna:</strong> {selectedVehicle1.masaOgolna} t</p>
                        <p className="text-sm"><strong>Masa hamująca rzeczywista:</strong> {selectedVehicle1.masaHamujaca} t</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pojazd 2 (opcjonalnie)</label>
                      <select value={vehicle2} onChange={(e) => setVehicle2(e.target.value)} className={inputCls} disabled={!vehicle1}>
                        <option value="">-- Wybierz pojazd --</option>
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>

                    {selectedVehicle2 && (
                      <div className="bg-blue-50 p-4 rounded-md border-l-4 border-blue-500">
                        <p className="text-sm"><strong>Masa ogólna:</strong> {selectedVehicle2.masaOgolna} t</p>
                        <p className="text-sm"><strong>Masa hamująca rzeczywista:</strong> {selectedVehicle2.masaHamujaca} t</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Procent wymagany (%) *</label>
                      <p className="text-xs text-gray-500 mb-2">Bierzemy go z WRJ (wewnętrznego rozkładu jazdy).</p>
                      <input type="number" value={procentWymagany} onChange={(e) => setProcentWymagany(e.target.value)}
                        placeholder="np. 50" className={inputCls} disabled={!vehicle1} />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleCalculate}
                        disabled={!vehicle1 || !procentWymagany}
                        className="flex-1 bg-blue-900 text-white font-bold py-3 px-6 rounded-md hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        WYLICZ
                      </button>
                      {showResults && (
                        <button onClick={handleReset}
                          className="bg-yellow-500 text-blue-900 font-bold py-3 px-6 rounded-md hover:bg-yellow-400 transition-colors">
                          RESET
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Prawy panel - wyniki */}
                <div className="pl-0 lg:pl-6 mt-6 lg:mt-0">
                  <h2 className="text-xl font-semibold text-blue-900 mb-4">Podsumowanie wyliczeń</h2>

                  {showResults && results ? (
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-md space-y-2 border-l-4 border-yellow-400">
                        <p className="text-sm"><strong>Masa ogólna składu:</strong> {results.masaOgolna} t</p>
                        <p className="text-sm"><strong>Masa ogólna pociągu:</strong> {results.masaOgolna} t</p>
                        <p className="text-sm"><strong>Masa hamująca wymagana:</strong> {results.masaHamujacaWymagana} t</p>
                        <p className="text-sm"><strong>Masa hamująca rzeczywista:</strong> {results.masaHamujacaRzeczywista} t</p>
                        <p className="text-sm"><strong>Procent masy hamującej wymaganej:</strong> {procentWymagany}%</p>
                        <p className="text-sm"><strong>Procent masy hamującej rzeczywistej:</strong> {results.procentMasyHamujacejRzeczywistej}%</p>
                        <p className="text-sm"><strong>Ciśnienie powietrza w przewodzie głównym:</strong> 0,5 MPa</p>
                        <p className="text-sm"><strong>Ciśnienie sprężonego powietrza w przewodzie:</strong> {results.cisnienieSprezonegoPowietrza} MPa</p>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-md space-y-2 border-l-4 border-blue-500">
                        <h3 className="font-semibold text-sm text-blue-900 mb-2">Pozostałe parametry:</h3>
                        <p className="text-sm"><strong>Sprawny hamulec elektrodynamiczny:</strong> {selectedVehicle1.hamulecElektro}</p>
                        <p className="text-sm"><strong>Sprawny układ sterowania hamulcem el.-pneum.:</strong> {selectedVehicle1.ukladSterowania}</p>
                        <p className="text-sm"><strong>Sprawny układ zamykania drzwi wejściowych:</strong> {selectedVehicle1.ukladDrzwi}</p>
                        <p className="text-sm"><strong>Sprawne inne urządzenia:</strong> {selectedVehicle1.inne}</p>
                      </div>

                      <div className={`p-4 rounded-md flex items-start gap-3 ${results.isSuccess ? 'bg-green-100 border-2 border-green-500' : 'bg-red-100 border-2 border-red-500'}`}>
                        {results.isSuccess ? (
                          <>
                            <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={24} />
                            <div>
                              <p className="font-bold text-green-800">Próba pomyślna ✓</p>
                              <p className="text-sm text-green-700">Wszystkie warunki zostały spełnione.</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
                            <div>
                              <p className="font-bold text-red-800">Próba niepomyślna ✗</p>
                              <p className="text-sm text-red-700">Konieczne jest wyliczenie nowej prędkości.</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-12">
                      <p>Wybierz pojazd i wprowadź procent wymagany,</p>
                      <p>a następnie kliknij "WYLICZ"</p>
                      <p>aby zobaczyć wyniki obliczeń.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </>
        )}
      </div>

      {/* ================= OKNO LOGOWANIA ================= */}
      {showLogin && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={closeLogin}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm border-t-4 border-blue-900" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-blue-900 flex items-center gap-2"><Lock size={18} /> Tryb administratora</h2>
              <button onClick={closeLogin} aria-label="Zamknij" className="text-gray-500 hover:text-gray-800"><X size={20} /></button>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hasło</label>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={e => { setPassword(e.target.value); setLoginError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }}
              className={inputCls}
            />
            {loginError && <p className="text-sm text-red-700 mt-2">{loginError}</p>}
            <button
              onClick={handleLogin}
              className="mt-4 w-full bg-blue-900 text-white font-bold py-2 rounded-md hover:bg-blue-800 transition-colors"
            >
              Zaloguj
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
