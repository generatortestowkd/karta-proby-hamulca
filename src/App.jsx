import React, { useState, useEffect } from 'react';
import { ChevronDown, LogOut, Plus, Trash2 } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDPENv7EmaYfmg_Zkvz7eHmG47aQ_beh_8",
  authDomain: "zestawienie-pojazdow.firebaseapp.com",
  projectId: "zestawienie-pojazdow",
  storageBucket: "zestawienie-pojazdow.firebasestorage.app",
  messagingSenderId: "522920995518",
  appId: "1:522920995518:web:3b96cd98fee98d4c58ccef",
  measurementId: "G-MY6FEBL2N7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===== MASA WŁASNA (wg wykazu KD, stan na 2026.08.25) =====
// Pole "own" w bazie to MASA SŁUŻBOWA.
// Masa własna jest podana tylko na części pojazdów – tutaj są wartości domyślne
// dla pojazdów, które są już w bazie (używane, gdy dokument w Firestore nie ma pola "wlasna").
const masaWlasnaDefaults = {
  'SA106-011': '50t',
  'SA132-002': '76t',
  'SA134-001': '76t',
  'SA134-002': '76t',
  'SA134-003': '76t',
  'SA134-004': '76t',
  'SA134-005': '76t',
  'SA134-006': '76t',
  'SA134-007': '76t',
  'SA134-023': '76t',
  'SA134-024': '76t',
  'SA134-025': '76t',
  'SA135-001': '44t',
  'SA135-002': '44t',
  'SA135-003': '44t',
  'SA135-004': '44t',
  'SA135-005': '44t',
  'SA135-006': '44t',
  'SA135-007': '44t',
  'SA135-008': '44t',
  'SA135-009': '44t',
  '31WE-001': '135t',
  '31WE-002': '135t',
  '31WE-003': '135t',
  '31WE-004': '135t',
  '31WE-005': '135t',
  'EN57 AKD-1937': '127.1t',
  'EN57 AL-1542': '130t',
};

// ===== NOWE POJAZDY: 48WEc-062 do 48WEc-071 (wg wykazu KD, stan na 2026.08.25) =====
// Dodawane automatycznie do bazy przy pierwszym uruchomieniu nowej wersji (tylko te, których jeszcze nie ma).
const MIGRATION_48WEC_062_071 = 'added_48WEc_062_071';
const newVehicles48WEc = {
  '48WEc-062': { inv: ['94512142087-7', '94512142088-5', '94512142089-3', '94512142090-1', '94512142091-9'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '26.09.2026' },
  '48WEc-063': { inv: ['94512142472-1', '94512142473-9', '94512142474-7', '94512142475-4', '94512142476-2'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '26.09.2026' },
  '48WEc-064': { inv: ['94512142477-0', '94512142478-8', '94512142479-6', '94512142480-4', '94512142481-2'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '26.09.2026' },
  '48WEc-065': { inv: ['94512142482-0', '94512142483-8', '94512142484-6', '94512142485-3', '94512142486-1'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '26.09.2026' },
  '48WEc-066': { inv: ['94512142487-9', '94512142488-7', '94512142489-5', '94512142490-3', '94512142491-1'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '26.09.2026' },
  '48WEc-067': { inv: ['94512142452-3', '94512142453-1', '94512142454-9', '94512142455-6', '94512142456-4'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '26.09.2026' },
  '48WEc-068': { inv: ['94512142457-2', '94512142458-0', '94512142459-8', '94512142460-6', '94512142461-4'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '26.09.2026' },
  '48WEc-069': { inv: ['94512142462-2', '94512142463-0', '94512142464-8', '94512142465-5', '94512142466-3'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '26.09.2026' },
  '48WEc-070': { inv: ['94512142467-1', '94512142468-9', '94512142469-7', '94512142470-5', '94512142471-3'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '26.09.2026' },
  '48WEc-071': { inv: ['94512142442-4', '94512142443-2', '94512142444-0', '94512142445-7', '94512142446-5'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '26.09.2026' },
};

// ===== DEFAULTOWE POJAZDY =====
const defaultVehicles = {
  '48WEc-024': { inv: ['94512141698-2', '94512141699-0', '94512141700-6', '94512141701-4', '94512141702-2'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '2026-01-01' },
  '48WEc-025': { inv: ['94512141703-0', '94512141704-8', '94512141705-5', '94512141706-3', '94512141707-1'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '2026-01-01' },
  '48WEc-026': { inv: ['94512141708-9', '94512141709-7', '94512141710-5', '94512141711-3', '94512141712-1'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '2026-01-01' },
  '48WEc-027': { inv: ['94512141713-9', '94512141714-7', '94512141715-4', '94512141716-2', '94512141717-0'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '2026-01-01' },
  '48WEc-028': { inv: ['94512141718-8', '94512141719-6', '94512141720-4', '94512141721-2', '94512141722-0'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '2026-01-01' },
  '48WEc-029': { inv: ['94512141761-8', '94512141762-6', '94512141763-4', '94512141764-2', '94512141765-9'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '2026-01-01' },
  '48WEc-030': { inv: ['94512141766-7', '94512141767-5', '94512141768-3', '94512141769-1', '94512141770-9'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '2026-01-01' },
  '48WEc-031': { inv: ['94512141771-7', '94512141772-5', '94512141773-3', '94512141774-1', '94512141775-8'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '2026-01-01' },
  '48WEc-032': { inv: ['94512141776-6', '94512141777-4', '94512141778-2', '94512141779-0', '94512141780-8'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '2026-01-01' },
  '48WEc-033': { inv: ['94512141781-6', '94512141782-4', '94512141783-2', '94512141784-0', '94512141785-7'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '2026-01-01' },
  '48WEc-034': { inv: ['94512141786-5', '94512141787-3', '94512141788-1', '94512141789-9', '94512141790-7'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '2026-01-01' },
  '48WEc-035': { inv: ['94512141791-5', '94512141792-3', '94512141793-1', '94512141794-9', '94512141795-6'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '2026-01-01' },
  '48WEc-036': { inv: ['94512141796-4', '94512141797-2', '94512141798-0', '94512141799-8', '94512141800-4'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '2026-01-01' },
  '48WEc-037': { inv: ['94512141831-9', '94512141832-7', '94512141833-5', '94512141834-3', '94512141835-0'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '2026-01-01' },
  '48WEc-038': { inv: ['94512141836-8', '94512141837-6', '94512141838-4', '94512141839-2', '94512141840-0'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '2026-01-01' },
  '48WEc-039': { inv: ['94512141841-8', '94512141842-6', '94512141843-4', '94512141844-2', '94512141845-9'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '2026-01-01' },
  '48WEc-040': { inv: ['94512141846-7', '94512141847-5', '94512141848-3', '94512141849-1', '94512141850-9'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '2026-01-01' },
  '48WEc-041': { inv: ['94512141811-1', '94512141812-9', '94512141813-7', '94512141814-5', '94512141815-2'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '2026-01-01' },
  '48WEc-042': { inv: ['94512141816-0', '94512141817-8', '94512141818-6', '94512141819-4', '94512141820-2'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '2026-01-01' },
  '48WEc-043': { inv: ['94512141821-0', '94512141822-8', '94512141823-6', '94512141824-4', '94512141825-1'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '2026-01-01' },
  '48WEc-044': { inv: ['94512141826-9', '94512141827-7', '94512141828-5', '94512141829-3', '94512141830-1'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '2026-01-01' },
  '48WEc-045': { inv: ['94512141851-7', '94512141852-5', '94512141853-3', '94512141854-1', '94512141855-8'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '2026-01-01' },
  '48WEc-046': { inv: ['94512141856-6', '94512141857-4', '94512141858-2', '94512141859-0', '94512141860-8'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '2026-01-01' },
  '48WEc-047': { inv: ['94512141801-2', '94512141802-0', '94512141803-8', '94512141804-6', '94512141805-3'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '2026-01-01' },
  '48WEc-048': { inv: ['94512141806-1', '94512141807-9', '94512141808-7', '94512141809-5', '94512141810-3'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '2026-01-01' },
  '48WEc-053': { inv: ['94512142042-2', '94512142043-0', '94512142044-8', '94512142045-5', '94512142046-3'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '2026-01-01' },
  '48WEc-054': { inv: ['94512142047-1', '94512142048-9', '94512142049-7', '94512142050-5', '94512142051-3'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '2026-01-01' },
  '48WEc-055': { inv: ['94512142052-1', '94512142053-9', '94512142054-7', '94512142055-4', '94512142056-2'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '2026-01-01' },
  '48WEc-056': { inv: ['94512142057-0', '94512142058-8', '94512142059-6', '94512142060-4', '94512142061-2'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '2026-01-01' },
  '48WEc-057': { inv: ['94512142062-0', '94512142063-8', '94512142064-6', '94512142065-3', '94512142066-1'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '2026-01-01' },
  '48WEc-058': { inv: ['94512142067-9', '94512142068-7', '94512142069-5', '94512142070-3', '94512142071-1'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '2026-01-01' },
  '48WEc-059': { inv: ['94512142072-9', '94512142073-7', '94512142074-5', '94512142075-2', '94512142076-0'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '2026-01-01' },
  '48WEc-060': { inv: ['94512142077-8', '94512142078-6', '94512142079-4', '94512142080-2', '94512142081-0'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '2026-01-01' },
  '48WEc-061': { inv: ['94512142082-8', '94512142083-6', '94512142084-4', '94512142085-1', '94512142086-9'], len: '90.53m', own: '169t', brk: '358t', tot: '201t', dateAdded: '2026-01-01' },
  'SA134-001': { inv: ['95512820025-5', '95512820026-3'], len: '41.7m', own: '77t', brk: '147t', tot: '86t', dateAdded: '2026-01-01' },
  'SA134-003': { inv: ['95512820009-9', '95512820010-7'], len: '41.7m', own: '77t', brk: '147t', tot: '98t', dateAdded: '2026-01-01' },
  'SA134-004': { inv: ['95512820011-5', '95512820012-3'], len: '41.7m', own: '77t', brk: '147t', tot: '98t', dateAdded: '2026-01-01' },
  'SA134-005': { inv: ['95512820013-1', '95512820014-9'], len: '41.7m', own: '77t', brk: '147t', tot: '98t', dateAdded: '2026-01-01' },
  'SA134-006': { inv: ['95512820015-6', '95512820016-7'], len: '41.7m', own: '77t', brk: '147t', tot: '98t', dateAdded: '2026-01-01' },
  'SA134-007': { inv: ['95512720045-4', '95512720046-2'], len: '41.7m', own: '77t', brk: '147t', tot: '98t', dateAdded: '2026-01-01' },
  'SA134-023': { inv: ['95512820017-2', '95512820018-0'], len: '41.7m', own: '77t', brk: '147t', tot: '98t', dateAdded: '2026-01-01' },
  'SA134-024': { inv: ['95512820019-8', '95512820020-6'], len: '41.7m', own: '77t', brk: '147t', tot: '98t', dateAdded: '2026-01-01' },
  'SA134-025': { inv: ['95512820021-4', '95512820022-2'], len: '41.7m', own: '77t', brk: '147t', tot: '98t', dateAdded: '2026-01-01' },
  'SA135-001': { inv: ['95512810018-2'], len: '24.5m', own: '45t', brk: '93t', tot: '55t', dateAdded: '2026-01-01' },
  'SA135-002': { inv: ['95512810019-0'], len: '24.5m', own: '45t', brk: '93t', tot: '55t', dateAdded: '2026-01-01' },
  'SA135-003': { inv: ['95512810020-8'], len: '24.5m', own: '45t', brk: '93t', tot: '55t', dateAdded: '2026-01-01' },
  'SA135-004': { inv: ['95512810049-7'], len: '24.5m', own: '45t', brk: '93t', tot: '55t', dateAdded: '2026-01-01' },
  'SA135-005': { inv: ['95512810050-5'], len: '24.5m', own: '45t', brk: '93t', tot: '55t', dateAdded: '2026-01-01' },
  'SA135-006': { inv: ['95512810051-3'], len: '24.5m', own: '45t', brk: '93t', tot: '55t', dateAdded: '2026-01-01' },
  'SA135-007': { inv: ['95512810052-1'], len: '24.5m', own: '45t', brk: '93t', tot: '55t', dateAdded: '2026-01-01' },
  'SA135-008': { inv: ['95512810053-9'], len: '24.5m', own: '45t', brk: '93t', tot: '55t', dateAdded: '2026-01-01' },
  'SA135-009': { inv: ['95512810054-7'], len: '24.5m', own: '45t', brk: '93t', tot: '55t', dateAdded: '2026-01-01' },
  'SA139-010': { inv: ['95512720136-1', '95512720137-9'], len: '43.73m', own: '88t', brk: '157t', tot: '106t', dateAdded: '2026-01-01' },
  'SA139-011': { inv: ['95512720144-5', '95512720145-2'], len: '43.73m', own: '88t', brk: '157t', tot: '106t', dateAdded: '2026-01-01' },
  'SA139-012': { inv: ['95512720146-0', '95512720147-8'], len: '43.73m', own: '88t', brk: '157t', tot: '106t', dateAdded: '2026-01-01' },
  'SA139-013': { inv: ['95512720148-6', '95512720149-4'], len: '43.73m', own: '88t', brk: '157t', tot: '106t', dateAdded: '2026-01-01' },
  'SA139-014': { inv: ['95512720150-2', '95512720151-0'], len: '43.73m', own: '88t', brk: '157t', tot: '106t', dateAdded: '2026-01-01' },
  '31WE-001': { inv: ['94512140287-5', '94512140288-3', '94512140289-1', '94512140290-9'], len: '74.4m', own: '136t', brk: '281t', tot: '172t', dateAdded: '2026-01-01' },
  '31WE-002': { inv: ['94512140291-7', '94512140292-5', '94512140293-3', '94512140294-1'], len: '74.4m', own: '136t', brk: '281t', tot: '172t', dateAdded: '2026-01-01' },
  '31WE-003': { inv: ['94512140295-8', '94512140296-6', '94512140297-4', '94512140298-2'], len: '74.4m', own: '136t', brk: '281t', tot: '172t', dateAdded: '2026-01-01' },
  '31WE-004': { inv: ['94512140299-0', '94512140300-6', '94512140301-4', '94512140302-2'], len: '74.4m', own: '136t', brk: '281t', tot: '172t', dateAdded: '2026-01-01' },
  '31WE-005': { inv: ['94512140303-0', '94512140304-8', '94512140305-5', '94512140306-3'], len: '74.4m', own: '136t', brk: '281t', tot: '172t', dateAdded: '2026-01-01' },
  '31WE-020': { inv: ['94512140643-9', '94512140644-7', '94512140645-4', '94512140646-2'], len: '74.4m', own: '136t', brk: '281t', tot: '172t', dateAdded: '2026-01-01' },
  '31WE-021': { inv: ['94512140647-0', '94512140648-8', '94512140649-6', '94512140650-4'], len: '74.4m', own: '136t', brk: '281t', tot: '172t', dateAdded: '2026-01-01' },
  '31WE-022': { inv: ['94512140651-2', '94512140652-0', '94512140653-8', '94512140654-6'], len: '74.4m', own: '136t', brk: '281t', tot: '172t', dateAdded: '2026-01-01' },
  '31WE-023': { inv: ['94512140655-3', '94512140656-1', '94512140657-9', '94512140658-7'], len: '74.4m', own: '136t', brk: '281t', tot: '172t', dateAdded: '2026-01-01' },
  '31WE-024': { inv: ['94512140659-5', '94512140660-3', '94512140661-1', '94512140662-9'], len: '74.4m', own: '136t', brk: '281t', tot: '172t', dateAdded: '2026-01-01' },
  '36WEa-011': { inv: ['94512140508-4', '94512140509-2', '94512140510-0'], len: '58.4m', own: '108t', brk: '217t', tot: '135t', dateAdded: '2026-01-01' },
  '36WEa-012': { inv: ['94512140511-8', '94512140512-6', '94512140513-4'], len: '58.4m', own: '108t', brk: '217t', tot: '135t', dateAdded: '2026-01-01' },
  '36WEa-013': { inv: ['94512140514-2', '94512140515-9', '94512140516-7'], len: '58.4m', own: '108t', brk: '217t', tot: '135t', dateAdded: '2026-01-01' },
  '36WEa-014': { inv: ['94512140517-5', '94512140518-3', '94512140519-1'], len: '58.4m', own: '108t', brk: '217t', tot: '135t', dateAdded: '2026-01-01' },
  '36WEa-015': { inv: ['94512140520-9', '94512140521-7', '94512140512-5'], len: '58.4m', own: '108t', brk: '217t', tot: '135t', dateAdded: '2026-01-01' },
  '36WEa-016': { inv: ['94512140523-3', '94512140524-1', '94512140525-8'], len: '58.4m', own: '108t', brk: '217t', tot: '135t', dateAdded: '2026-01-01' },
  '36WEh-012': { inv: ['90512440001-1', '90512440003-7', '90512440002-9'], len: '59.3m', own: '121.5t', brk: '228t', tot: '143t', dateAdded: '2026-01-01' },
  '36WEh-013': { inv: ['90512440004-5', '90512440006-0', '90512440005-2'], len: '59.3m', own: '121.5t', brk: '228t', tot: '143t', dateAdded: '2026-01-01' },
  '36WEh-014': { inv: ['90512440007-8', '90512440009-4', '90512440008-6'], len: '59.3m', own: '121.5t', brk: '228t', tot: '143t', dateAdded: '2026-01-01' },
  '36WEh-015': { inv: ['90512440010-2', '90512440012-8', '90512440011-0'], len: '59.3m', own: '121.5t', brk: '228t', tot: '143t', dateAdded: '2026-01-01' },
  '36WEh-016': { inv: ['90512440013-6', '90512440015-1', '90512440014-4'], len: '59.3m', own: '121.5t', brk: '228t', tot: '143t', dateAdded: '2026-01-01' },
  '36WEh-017': { inv: ['90512440016-9', '90512440018-5', '90512440017-7'], len: '59.3m', own: '121.5t', brk: '228t', tot: '143t', dateAdded: '2026-01-01' },
  '45WE-019': { inv: ['94512140829-4', '94512140830-2', '94512140831-0', '94512140832-8', '94512140833-6'], len: '90.4m', own: '169t', brk: '335t', tot: '207t', dateAdded: '2026-01-01' },
  '45WE-020': { inv: ['94512140834-4', '94512140835-1', '94512140836-9', '94512140837-7', '94512140838-5'], len: '90.4m', own: '169t', brk: '335t', tot: '207t', dateAdded: '2026-01-01' },
  '45WE-021': { inv: ['94512140839-3', '94512140840-1', '94512140841-9', '94512140842-7', '94512140843-5'], len: '90.4m', own: '169t', brk: '335t', tot: '207t', dateAdded: '2026-01-01' },
  '45WE-022': { inv: ['94512140844-3', '94512140845-0', '94512140846-8', '94512140847-6', '94512140848-4'], len: '90.4m', own: '169t', brk: '335t', tot: '207t', dateAdded: '2026-01-01' },
  '45WE-023': { inv: ['94512140849-2', '94512140850-0', '94512140851-8', '94512140852-6', '94512140853-4'], len: '90.4m', own: '169t', brk: '335t', tot: '207t', dateAdded: '2026-01-01' },
  '45WE-024': { inv: ['94512140854-2', '94512140855-9', '94512140856-7', '94512140857-5', '94512140858-3'], len: '90.4m', own: '169t', brk: '335t', tot: '207t', dateAdded: '2026-01-01' },
  '45WE-025': { inv: ['94512140859-1', '94512140860-9', '94512140861-7', '94512140862-5', '94512140863-3'], len: '90.4m', own: '169t', brk: '335t', tot: '207t', dateAdded: '2026-01-01' },
  '45WE-026': { inv: ['94512140864-1', '94512140865-8', '94512140866-6', '94512140867-4', '94512140868-2'], len: '90.4m', own: '169t', brk: '335t', tot: '207t', dateAdded: '2026-01-01' },
  '45WE-027': { inv: ['94512140869-0', '94512140870-8', '94512140871-6', '94512140872-4', '94512140873-2'], len: '90.4m', own: '169t', brk: '335t', tot: '207t', dateAdded: '2026-01-01' },
  '45WE-028': { inv: ['94512140874-0', '94512140875-7', '94512140876-5', '94512140877-3', '94512140878-1'], len: '90.4m', own: '169t', brk: '335t', tot: '207t', dateAdded: '2026-01-01' },
  '45WE-029': { inv: ['94512140879-9', '94512140880-7', '94512140881-5', '94512140882-3', '94512140883-1'], len: '90.4m', own: '169t', brk: '335t', tot: '207t', dateAdded: '2026-01-01' },
  'SA132-002': { inv: ['95512820023-0', '95512820024-8'], len: '41.7m', own: '77t', brk: '147t', tot: '98t', dateAdded: '2026-01-01' },
  'SA106-011': { inv: ['95512810048-6'], len: '24.5m', own: '51t', brk: '82t', tot: '59t', dateAdded: '2026-01-01' },
  'EN57-1703': { inv: ['94512122481-6', '94512122482-4', '94512122483-2'], len: '63.97m', own: '126t', brk: '130t', tot: '138t', dateAdded: '2026-01-01' },
  'EN57 AKD-1937': { inv: ['94512122661-3', '94512122662-1', '94512122663-9'], len: '65.17m', own: '127.5t', brk: '174t', tot: '154.5t', dateAdded: '2026-01-01' },
  'EN57 AKM-1718': { inv: ['94512120117-8', '94512120118-6', '94512120119-4'], len: '64.77m', own: '126t', brk: '165t', tot: '140t', dateAdded: '2026-01-01' },
  'EN57 AL-1501': { inv: ['94512122301-6', '94512122302-4', '94512122303-2'], len: '64.62m', own: '132t', brk: '161t', tot: '147t', dateAdded: '2026-01-01' },
  'EN57 AL-1542': { inv: ['94512122370-1', '94512122371-9', '94512122379-7'], len: '64.62m', own: '130.6t', brk: '161t', tot: '147t', dateAdded: '2026-01-01' },
  'EN57 AL-1938': { inv: ['94512130333-9', '94512130334-7', '94512130335-4'], len: '63.97m', own: '127t', brk: '161t', tot: '145t', dateAdded: '2026-01-01' },
  ...newVehicles48WEc,
};

// ===== HELPER FUNCTIONS =====
function getTodayDate() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  return `${day}.${month}.${year}`;
}

// Zwraca masę własną pojazdu: z bazy, a jeśli w bazie nie ma pola – z wartości domyślnych
function resolveWlasna(id, data) {
  if (data && data.wlasna !== undefined && data.wlasna !== null) return data.wlasna;
  return masaWlasnaDefaults[id] || '';
}

// Sprawdza, czy wartość masy jest faktycznie podana (np. "76t", a nie puste pole)
function hasValue(v) {
  return v !== undefined && v !== null && String(v).trim() !== '' && !isNaN(parseFloat(v));
}

// ===== MAIN APP =====
export default function App() {
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [vehicles, setVehicles] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(getTodayDate());
  const [lastAddedText, setLastAddedText] = useState('');
  const [lastAddedInput, setLastAddedInput] = useState('');

  const [newVehicle, setNewVehicle] = useState({
    id: '',
    inv: '',
    len: '',
    wlasna: '',
    own: '',
    brk: '',
    tot: ''
  });

  useEffect(() => {
    const start = async () => {
      await initializeVehicles();
      await loadSettings();
    };
    start();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'info'));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        if (data.lastUpdated) setLastUpdated(data.lastUpdated);
        if (data.lastAddedText) {
          setLastAddedText(data.lastAddedText);
          setLastAddedInput(data.lastAddedText);
        }
      }
    } catch (error) {
      console.error('Błąd przy ładowaniu ustawień:', error);
    }
  };

  // Jednorazowe dopisanie do bazy pojazdów 48WEc-062 do 48WEc-071
  // (dodaje tylko te, których jeszcze nie ma; drugi raz już się nie uruchomi)
  const runMigration48WEc = async (vehiclesData) => {
    try {
      const settingsRef = doc(db, 'settings', 'info');
      const settingsDoc = await getDoc(settingsRef);
      const settings = settingsDoc.exists() ? settingsDoc.data() : {};
      if (settings[MIGRATION_48WEC_062_071]) return vehiclesData;

      const updated = { ...vehiclesData };
      let addedAny = false;
      for (const [id, data] of Object.entries(newVehicles48WEc)) {
        if (updated[id]) continue;
        const today = getTodayDate();
        await addDoc(collection(db, 'vehicles'), {
          id,
          inv: data.inv,
          len: data.len,
          wlasna: '',
          own: data.own,
          brk: data.brk,
          tot: data.tot,
          dateAdded: today
        });
        updated[id] = { ...data, wlasna: '', dateAdded: today };
        addedAny = true;
      }

      const today = getTodayDate();
      const newSettings = { [MIGRATION_48WEC_062_071]: true };
      if (addedAny) {
        newSettings.lastUpdated = today;
        newSettings.lastAddedText = '48WEc-062 do 48WEc-071';
        setLastUpdated(today);
        setLastAddedText(newSettings.lastAddedText);
        setLastAddedInput(newSettings.lastAddedText);
      }
      await setDoc(settingsRef, newSettings, { merge: true });
      return updated;
    } catch (error) {
      console.error('Błąd przy dodawaniu pojazdów 48WEc-062 do 071:', error);
      return vehiclesData;
    }
  };

  const initializeVehicles = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'vehicles'));

      if (querySnapshot.empty) {
        await addAllVehicles();
        await setDoc(doc(db, 'settings', 'info'), { [MIGRATION_48WEC_062_071]: true }, { merge: true });
      } else {
        const vehiclesData = {};
        querySnapshot.forEach((docSnapshot) => {
          const d = docSnapshot.data();
          vehiclesData[d.id] = {
            inv: d.inv,
            len: d.len,
            wlasna: resolveWlasna(d.id, d),
            own: d.own,
            brk: d.brk,
            tot: d.tot,
            dateAdded: d.dateAdded || '2026-01-01'
          };
        });
        const withNew = await runMigration48WEc(vehiclesData);
        setVehicles(withNew);
      }
    } catch (error) {
      console.error('Błąd przy ładowaniu:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAllVehicles = async () => {
    try {
      const withWlasna = {};
      for (const [id, data] of Object.entries(defaultVehicles)) {
        const wlasna = masaWlasnaDefaults[id] || '';
        await addDoc(collection(db, 'vehicles'), {
          id,
          inv: data.inv,
          len: data.len,
          wlasna,
          own: data.own,
          brk: data.brk,
          tot: data.tot,
          dateAdded: data.dateAdded || '2026-01-01'
        });
        withWlasna[id] = { ...data, wlasna };
      }
      setVehicles(withWlasna);
    } catch (error) {
      console.error('Błąd przy dodawaniu pojazdów:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPassword === 'KD2026') {
      setIsAdmin(true);
      setAdminPassword('');
    } else {
      alert('Błędne hasło!');
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!newVehicle.id || !newVehicle.inv || !newVehicle.len) {
      alert('Wypełnij wymagane pola!');
      return;
    }

    try {
      const invArray = newVehicle.inv.split(',').map(n => n.trim());
      const today = getTodayDate();

      await addDoc(collection(db, 'vehicles'), {
        id: newVehicle.id,
        inv: invArray,
        len: newVehicle.len,
        wlasna: newVehicle.wlasna,
        own: newVehicle.own,
        brk: newVehicle.brk,
        tot: newVehicle.tot,
        dateAdded: today
      });

      await setDoc(doc(db, 'settings', 'info'), {
        lastUpdated: today,
        lastAddedText: lastAddedText
      }, { merge: true });

      const updatedVehicles = {
        ...vehicles,
        [newVehicle.id]: {
          inv: invArray,
          len: newVehicle.len,
          wlasna: newVehicle.wlasna,
          own: newVehicle.own,
          brk: newVehicle.brk,
          tot: newVehicle.tot,
          dateAdded: today
        }
      };

      setVehicles(updatedVehicles);
      setLastUpdated(today);
      setNewVehicle({ id: '', inv: '', len: '', wlasna: '', own: '', brk: '', tot: '' });
      alert('Pojazd dodany! Data aktualizacji zmieniona automatycznie.');
    } catch (error) {
      alert('Błąd: ' + error.message);
    }
  };

  const handleSaveLastAdded = async (e) => {
    e.preventDefault();
    const today = getTodayDate();
    try {
      await setDoc(doc(db, 'settings', 'info'), {
        lastAddedText: lastAddedInput,
        lastUpdated: today
      }, { merge: true });
      setLastAddedText(lastAddedInput);
      setLastUpdated(today);
      alert('Zapisano informację o ostatnio dodanych pojazdach!');
    } catch (error) {
      alert('Błąd: ' + error.message);
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (window.confirm(`Usunąć pojazd ${vehicleId}?`)) {
      try {
        const querySnapshot = await getDocs(collection(db, 'vehicles'));
        querySnapshot.forEach(async (docSnapshot) => {
          if (docSnapshot.data().id === vehicleId) {
            await deleteDoc(doc(db, 'vehicles', docSnapshot.id));
          }
        });

        const newVehicles = { ...vehicles };
        delete newVehicles[vehicleId];
        setVehicles(newVehicles);
      } catch (error) {
        alert('Błąd: ' + error.message);
      }
    }
  };

  // Masa ładunku = masa ogólna – masa własna
  // (jeżeli masa własna nie jest podana na pojeździe, liczymy od masy służbowej)
  const calc = (v) => {
    const d = vehicles[v];
    const base = hasValue(d.wlasna) ? d.wlasna : d.own;
    return (parseFloat(d.tot) - parseFloat(base)).toFixed(1) + 't';
  };

  const sel = vehicles[selectedVehicle];
  const selHasWlasna = sel ? hasValue(sel.wlasna) : false;
  const selHasSluzbowa = sel ? hasValue(sel.own) : false;
  const selHasBoth = selHasWlasna && selHasSluzbowa;
  const selOnlySluzbowa = !selHasWlasna && selHasSluzbowa;

  if (loading) {
    return <div className="min-h-screen bg-green-800 flex items-center justify-center"><p className="text-white">Ładowanie pojazdów...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-900 p-3 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-4 sm:p-6 border-4 border-yellow-400">
          {!isAdmin ? (
            <>
              <h1 className="text-2xl sm:text-3xl font-bold text-green-800 mb-2 sm:mb-3 text-center">Przeglądarka Pojazdów Kolejowych</h1>
              <div className="text-center mb-4 sm:mb-6">
                <p className="text-xs sm:text-sm text-green-700 font-medium">Ostatnia aktualizacja: {lastUpdated}</p>
                <p className="text-xs sm:text-sm text-green-600 mt-1">
                  {lastAddedText ? `Ostatnio dodane: ${lastAddedText}` : 'Brak ostatnio dodanych'}
                </p>
              </div>

              <button onClick={() => setIsAdmin('login')} className="w-full mb-4 bg-yellow-400 hover:bg-yellow-500 text-green-900 font-bold py-2 rounded-lg transition-colors text-sm">Panel Administratora</button>

              <div className="mb-4 sm:mb-6">
                <label className="block text-green-800 text-base sm:text-lg font-semibold mb-2">Wybierz pojazd:</label>
                <div className="relative">
                  <select value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)} className="w-full bg-green-50 text-green-900 border-2 border-green-600 rounded-lg px-3 py-2 sm:px-4 sm:py-3 pr-10 appearance-none cursor-pointer hover:bg-green-100 transition-all focus:outline-none focus:ring-2 focus:ring-yellow-400 text-base sm:text-lg font-medium">
                    <option value="">Wybierz pojazd</option>
                    {Object.keys(vehicles).sort().map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-green-700 pointer-events-none" size={20} />
                </div>
              </div>

              {sel && (
                <div className="space-y-4">
                  <div className="bg-green-50 rounded-xl p-4 border-2 border-green-600">
                    <h2 className="text-xl font-bold text-green-800 mb-3">Numery inwentarzowe:</h2>
                    <div className="space-y-2">
                      {sel.inv.map((n, i) => {
                        const parts = n.split('-');
                        const beforeDash = parts[0];
                        const afterDash = parts[1];
                        const lastFour = beforeDash.slice(-4);
                        const rest = beforeDash.slice(0, -4);
                        return (
                          <div key={i} className="bg-yellow-100 rounded-lg px-3 py-2 border-2 border-yellow-400 flex items-center justify-between">
                            <span className="text-xs text-green-700 font-semibold">Kabina {i === 0 ? '1' : i === sel.inv.length - 1 ? '2' : '-'}</span>
                            <span className="font-mono text-sm"><span className="text-green-900">{rest}</span><span className="text-xl font-bold text-red-600">{lastFour}</span><span className="text-green-900">-</span><span className="text-xl font-bold text-red-600">{afterDash}</span></span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {selHasBoth && (
                    <div className="bg-red-100 border-2 border-red-600 rounded-lg px-3 py-2 text-center">
                      <p className="text-red-700 font-extrabold text-sm sm:text-base">
                        Na dokumencie R-7 (erce) wpisujemy masę własną!
                      </p>
                      <p className="text-red-700 text-xs mt-1">
                        W przypadku, kiedy występuje zarówno masa własna, jak i masa służbowa, zawsze wpisujemy masę własną.
                      </p>
                    </div>
                  )}
                  {selOnlySluzbowa && (
                    <div className="bg-red-100 border-2 border-red-600 rounded-lg px-3 py-2 text-center">
                      <p className="text-red-700 font-extrabold text-sm sm:text-base">
                        Na dokumencie R-7 (erce) wpisujemy masę służbową!
                      </p>
                      <p className="text-red-700 text-xs mt-1">
                        Ze względu na brak masy własnej w polu z masą własną należy wpisać masę służbową!
                      </p>
                    </div>
                  )}
                  <div className="bg-green-50 rounded-xl p-4 border-2 border-green-600">
                    <h2 className="text-xl font-bold text-green-800 mb-3">Parametry pojazdu:</h2>
                    <table className="w-full text-green-900 text-sm">
                      <thead>
                        <tr className="bg-yellow-400 border-b-2 border-green-600">
                          <th className="text-left py-2 px-2 text-green-900 font-bold">Parametr</th>
                          <th className="text-right py-2 px-2 text-green-900 font-bold">Wartość</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-green-300">
                          <td className="py-2 px-2">Długość pojazdu</td>
                          <td className="text-right py-2 px-2 font-bold">{sel.len}</td>
                        </tr>
                        <tr className="border-b border-green-300">
                          <td className="py-2 px-2">
                            Masa ogólna
                            <span className="block text-xs italic text-green-700">(nie jest wpisywana na dokumencie)</span>
                          </td>
                          <td className="text-right py-2 px-2 font-bold">{hasValue(sel.tot) ? sel.tot : '–'}</td>
                        </tr>
                        <tr className="border-b border-green-300">
                          <td className="py-2 px-2">
                            Masa ładunku
                            <span className="block text-xs italic text-green-700">(różnica między masą ogólną (brutto) a masą własną lub służbową)</span>
                          </td>
                          <td className="text-right py-2 px-2 font-bold">{calc(selectedVehicle)}</td>
                        </tr>
                        <tr className={`border-b border-green-300 ${selHasBoth ? 'bg-red-50' : ''}`}>
                          <td className={`py-2 px-2 ${selHasBoth ? 'font-bold text-red-700' : ''}`}>Masa własna pojazdu</td>
                          <td className={`text-right py-2 px-2 font-bold ${selHasBoth ? 'text-red-700' : ''}`}>{selHasWlasna ? sel.wlasna : '–'}</td>
                        </tr>
                        {selHasSluzbowa && (
                          <tr className={`border-b border-green-300 ${selOnlySluzbowa ? 'bg-red-50' : ''}`}>
                            <td className={`py-2 px-2 ${selOnlySluzbowa ? 'font-bold text-red-700' : ''}`}>Masa służbowa pojazdu</td>
                            <td className={`text-right py-2 px-2 font-bold ${selOnlySluzbowa ? 'text-red-700' : ''}`}>{sel.own}</td>
                          </tr>
                        )}
                        <tr>
                          <td className="py-2 px-2">Masa hamująca</td>
                          <td className="text-right py-2 px-2 font-bold">{sel.brk}</td>
                        </tr>
                      </tbody>
                    </table>

                  </div>
                </div>
              )}
              {!sel && (
                <div className="text-center text-green-700 text-base py-8 font-medium">Wybierz pojazd z listy, aby wyświetlić szczegóły</div>
              )}
            </>
          ) : isAdmin === 'login' ? (
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-green-800 mb-6 text-center">Panel Administratora</h2>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <input type="password" placeholder="Wpisz hasło" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full px-4 py-2 border-2 border-green-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                <button type="submit" className="w-full bg-yellow-400 hover:bg-yellow-500 text-green-900 font-bold py-2 rounded-lg transition-colors">Zaloguj</button>
                <button type="button" onClick={() => setIsAdmin(false)} className="w-full bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 rounded-lg transition-colors">Anuluj</button>
              </form>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-green-800">Panel Administratora</h2>
                <button onClick={() => setIsAdmin(false)} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold transition-colors text-sm"><LogOut size={18} /> Wyloguj</button>
              </div>

              <div className="space-y-6">
                <div className="bg-green-50 rounded-xl p-4 border-2 border-green-600">
                  <h3 className="text-xl font-bold text-green-800 mb-4">Dodaj nowy pojazd</h3>
                  <form onSubmit={handleAddVehicle} className="space-y-3">
                    <input type="text" placeholder="ID pojazdu (np. 48WEc-062)" value={newVehicle.id} onChange={(e) => setNewVehicle({...newVehicle, id: e.target.value})} className="w-full px-3 py-2 border-2 border-green-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm" />
                    <input type="text" placeholder="Numery inv (oddzielone przecinkami)" value={newVehicle.inv} onChange={(e) => setNewVehicle({...newVehicle, inv: e.target.value})} className="w-full px-3 py-2 border-2 border-green-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm" />
                    <input type="text" placeholder="Długość (np. 90.53m)" value={newVehicle.len} onChange={(e) => setNewVehicle({...newVehicle, len: e.target.value})} className="w-full px-3 py-2 border-2 border-green-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm" />
                    <input type="text" placeholder="Masa własna (np. 76t) – zostaw puste, jeśli nie ma na pojeździe" value={newVehicle.wlasna} onChange={(e) => setNewVehicle({...newVehicle, wlasna: e.target.value})} className="w-full px-3 py-2 border-2 border-green-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm" />
                    <input type="text" placeholder="Masa służbowa (np. 169t)" value={newVehicle.own} onChange={(e) => setNewVehicle({...newVehicle, own: e.target.value})} className="w-full px-3 py-2 border-2 border-green-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm" />
                    <input type="text" placeholder="Masa hamująca (np. 358t)" value={newVehicle.brk} onChange={(e) => setNewVehicle({...newVehicle, brk: e.target.value})} className="w-full px-3 py-2 border-2 border-green-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm" />
                    <input type="text" placeholder="Masa ogólna (np. 201t)" value={newVehicle.tot} onChange={(e) => setNewVehicle({...newVehicle, tot: e.target.value})} className="w-full px-3 py-2 border-2 border-green-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm" />
                    <button type="submit" className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-green-900 font-bold py-2 rounded-lg transition-colors"><Plus size={18} /> Dodaj pojazd</button>
                  </form>
                </div>

                <div className="bg-green-50 rounded-xl p-4 border-2 border-green-600">
                  <h3 className="text-xl font-bold text-green-800 mb-4">Ostatnio dodane pojazdy (widoczne na stronie głównej)</h3>
                  <form onSubmit={handleSaveLastAdded} className="space-y-3">
                    <textarea placeholder="np. 48WEc-062 do 48WEc-063" value={lastAddedInput} onChange={(e) => setLastAddedInput(e.target.value)} rows={2} className="w-full px-3 py-2 border-2 border-green-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm" />
                    <button type="submit" className="w-full bg-yellow-400 hover:bg-yellow-500 text-green-900 font-bold py-2 rounded-lg transition-colors">Zapisz</button>
                  </form>
                </div>

                <div className="bg-green-50 rounded-xl p-4 border-2 border-green-600">
                  <h3 className="text-xl font-bold text-green-800 mb-4">Lista pojazdów ({Object.keys(vehicles).length})</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {Object.keys(vehicles).sort().map(vehicleId => (
                      <div key={vehicleId} className="flex justify-between items-center bg-yellow-100 px-3 py-2 rounded-lg border border-yellow-400">
                        <span className="font-bold text-green-900">{vehicleId}</span>
                        <button onClick={() => handleDeleteVehicle(vehicleId)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors flex items-center gap-1 text-sm font-bold"><Trash2 size={16} /> Usuń</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
