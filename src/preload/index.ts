/** Schmale, typisierte Brücke zum Hauptprozess (contextIsolation an, kein Node in der Oberfläche). */
import { contextBridge, ipcRenderer } from 'electron';
import type { Api } from '../shared/api';

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
};

contextBridge.exposeInMainWorld('api', api);
