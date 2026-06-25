import React, { useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

const vehicles = [
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
];

export default function BrakeTestCalculator() {
  const [vehicle1, setVehicle1] = useState('');
  const [vehicle2, setVehicle2] = useState('');
  const [procentWymagany, setProcentWymagany] = useState('');
  const [showResults, setShowResults] = useState(false);

  const selectedVehicle1 = vehicles.find(v => v.name === vehicle1);
  const selectedVehicle2 = vehicles.find(v => v.name === vehicle2);

  const handleCalculate = () => {
    if (selectedVehicle1 && procentWymagany) {
      setShowResults(true);
    }
  };

  const handleReset = () => {
    setVehicle1('');
    setVehicle2('');
    setProcentWymagany('');
    setShowResults(false);
  };

  const calculateResults = () => {
    if (!selectedVehicle1 || !procentWymagany) return null;

    const masaOgolna = selectedVehicle1.masaOgolna + (selectedVehicle2?.masaOgolna || 0);
    const masaHamujacaRzeczywista = selectedVehicle1.masaHamujaca + (selectedVehicle2?.masaHamujaca || 0);

    const masaHamujacaWymagana = Math.ceil((masaOgolna * parseFloat(procentWymagany)) / 100);
    const procentMasyHamujacejRzeczywistej = Math.floor((masaHamujacaRzeczywista * 100) / masaOgolna);

    const cisnienieSprezonegoPowietrza = selectedVehicle2
      ? Math.max(selectedVehicle1.cisnienie, selectedVehicle2.cisnienie)
      : selectedVehicle1.cisnienie;

    const isSuccess = masaHamujacaRzeczywista >= masaHamujacaWymagana &&
                     procentMasyHamujacejRzeczywistej >= parseFloat(procentWymagany);

    return {
      masaOgolna,
      masaHamujacaRzeczywista,
      masaHamujacaWymagana,
      procentMasyHamujacejRzeczywistej,
      cisnienieSprezonegoPowietrza,
      isSuccess
    };
  };

  const results = calculateResults();

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
          <div className="text-center relative z-10">
            <h1 className="text-4xl font-bold text-blue-900">
              Próba hamulca
            </h1>
            <p className="text-lg text-gray-700 mt-3 font-medium">Aplikacja dla kierowników pociągu wypełniających kartę próby hamulca.</p>
          </div>
        </div>

        {/* Główna ramka z dwoma sekcjami */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-yellow-400">
          <div className="grid lg:grid-cols-2 gap-6 divide-x-0 lg:divide-x-2 divide-gray-300">
            {/* Lewy panel - wybór pojazdów */}
            <div className="pr-0 lg:pr-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">Wybór pojazdów</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pojazd 1 *
                  </label>
                  <select
                    value={vehicle1}
                    onChange={(e) => setVehicle1(e.target.value)}
                    className="w-full p-2 border-2 border-blue-300 rounded-md focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                  >
                    <option value="">-- Wybierz pojazd --</option>
                    {vehicles.map(v => (
                      <option key={v.name} value={v.name}>{v.name}</option>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pojazd 2 (opcjonalnie)
                  </label>
                  <select
                    value={vehicle2}
                    onChange={(e) => setVehicle2(e.target.value)}
                    className="w-full p-2 border-2 border-blue-300 rounded-md focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                    disabled={!vehicle1}
                  >
                    <option value="">-- Wybierz pojazd --</option>
                    {vehicles.map(v => (
                      <option key={v.name} value={v.name}>{v.name}</option>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Procent wymagany (%) *
                  </label>
                  <input
                    type="number"
                    value={procentWymagany}
                    onChange={(e) => setProcentWymagany(e.target.value)}
                    placeholder="np. 50"
                    className="w-full p-2 border-2 border-blue-300 rounded-md focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                    disabled={!vehicle1}
                  />
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
                    <button
                      onClick={handleReset}
                      className="bg-yellow-500 text-blue-900 font-bold py-3 px-6 rounded-md hover:bg-yellow-400 transition-colors"
                    >
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
      </div>
    </div>
  );
}
