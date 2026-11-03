/** Schmale, typisierte Brücke zum Hauptprozess (contextIsolation an, kein Node in der Oberfläche). */
import { contextBridge, ipcRenderer } from 'electron';
import type { Api } from '../shared/api';

/** Ereignis aus dem Hauptprozess abonnieren; liefert die Abmeldung. */
function horchen<T>(kanal: string, fn: (d: T) => void): () => void {
  const h = (_e: Electron.IpcRendererEvent, d: T) => fn(d);
  ipcRenderer.on(kanal, h);
  return () => ipcRenderer.off(kanal, h);
}

const api: Api = {
  info: () => ipcRenderer.invoke('app:info'),
  laden: (name) => ipcRenderer.invoke('daten:laden', name),
  speichern: (name, daten) => ipcRenderer.invoke('daten:speichern', name, daten),
  einstellungenLaden: () => ipcRenderer.invoke('einstellungen:laden'),
  einstellungenSpeichern: (daten) => ipcRenderer.invoke('einstellungen:speichern', daten),
  darstellungSetzen: (d) => ipcRenderer.invoke('darstellung:setzen', d),
  pdfErstellen: (auftrag) => ipcRenderer.invoke('pdf:erstellen', auftrag),
  druckDaten: (schluessel) => ipcRenderer.invoke('druck:daten', schluessel),
  druckBereit: () => ipcRenderer.send('druck:bereit'),
  oeffnenExtern: (ziel) => ipcRenderer.invoke('extern:oeffnen', ziel),
  programmWaehlen: () => ipcRenderer.invoke('programm:waehlen'),
  loeschen: (name) => ipcRenderer.invoke('daten:loeschen', name),
  protokollLaden: () => ipcRenderer.invoke('protokoll:laden'),
  protokollSchreiben: (e) => ipcRenderer.invoke('protokoll:schreiben', e),
  textSpeichern: (dateiname, text) => ipcRenderer.invoke('text:speichern', dateiname, text),
  dateiSpeichern: (a) => ipcRenderer.invoke('datei:speichern', a),
  dateiInfo: (k) => ipcRenderer.invoke('datei:info', k),
  dateiEntsperren: (k, passwort) => ipcRenderer.invoke('datei:entsperren', k, passwort),
  dateiOeffnenDialog: () => ipcRenderer.invoke('datei:oeffnenDialog'),
  anApp: (b) => ipcRenderer.invoke('app:befehl', b),
  aufBefehl: (fn) => {
    const h = (_e: Electron.IpcRendererEvent, b: Parameters<typeof fn>[0]) => fn(b);
    ipcRenderer.on('app:befehl', h);
    ipcRenderer.send('app:bereit');
    return () => ipcRenderer.off('app:befehl', h);
  },
  updateStand: () => ipcRenderer.invoke('update:stand'),
  updatePruefen: () => ipcRenderer.invoke('update:pruefen'),
  updateNeustart: () => ipcRenderer.invoke('update:neustart'),
  aufUpdate: (fn) => {
    const h = (_e: Electron.IpcRendererEvent, s: Parameters<typeof fn>[0]) => fn(s);
    ipcRenderer.on('update:stand', h);
    return () => ipcRenderer.off('update:stand', h);
  },
  ablageStand: () => ipcRenderer.invoke('ablage:stand'),
  aufAblageStatus: (fn) => horchen('ablage:status', fn),
  ablageBeobachten: (namen) => ipcRenderer.invoke('ablage:beobachten', namen),
  aufFremdeAenderung: (fn) => horchen('ablage:fremd', fn),
  anwesenheit: (m) => ipcRenderer.invoke('ablage:anwesenheit', m),
  personen: () => ipcRenderer.invoke('ablage:personen'),
  aufPersonen: (fn) => horchen('ablage:personen', fn),
  ordnerWaehlen: () => ipcRenderer.invoke('ablage:ordnerWaehlen'),
  ordnerInfo: (ort) => ipcRenderer.invoke('ablage:info', ort),
  ablageOeffnen: () => ipcRenderer.invoke('ablage:oeffnen'),
  ablageWechseln: (ort) => ipcRenderer.invoke('ablage:wechseln', ort),
  msKonto: () => ipcRenderer.invoke('ms:konto'),
  msZugang: () => ipcRenderer.invoke('ms:zugang'),
  msZugangSetzen: (z) => ipcRenderer.invoke('ms:zugangSetzen', z),
  msAnmelden: () => ipcRenderer.invoke('ms:anmelden'),
  msAbmelden: () => ipcRenderer.invoke('ms:abmelden'),
  mailSenden: (m) => ipcRenderer.invoke('mail:senden', m),
  kontakteSuchen: (q) => ipcRenderer.invoke('mail:kontakte', q),
};

contextBridge.exposeInMainWorld('api', api);
