/** IPC für Microsoft (M5b): Konto, Zugang, Outlook. */
import { ipcMain } from 'electron';
import type { MsZugang } from '../shared/api';
import type { MailAuftrag } from '../shared/microsoft/mail';
import { abmelden, anmelden, kontakteSuchen, kontoInfo, mailSenden, zugangLesen, zugangSetzen } from './microsoft';

const text = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function microsoftEinrichten(): void {
  ipcMain.handle('ms:konto', () => kontoInfo());
  ipcMain.handle('ms:zugang', () => zugangLesen());
  ipcMain.handle('ms:zugangSetzen', async (_e, z: MsZugang) => {
    try {
      await zugangSetzen(z);
      return { ok: true };
    } catch (e) {
      return { ok: false, fehler: text(e) };
    }
  });
  ipcMain.handle('ms:anmelden', async () => {
    try {
      return { konto: await anmelden() };
    } catch (e) {
      return { fehler: text(e) };
    }
  });
  ipcMain.handle('ms:abmelden', () => abmelden());
  ipcMain.handle('mail:senden', (_e, m: MailAuftrag) => mailSenden(m));
  ipcMain.handle('mail:kontakte', (_e, q: string) => kontakteSuchen(q));
}
