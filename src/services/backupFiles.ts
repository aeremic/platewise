import { format } from 'date-fns';
import Constants from 'expo-constants';
import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { readAllData, replaceAllData } from '@/data/backupRepo';
import {
  createBackup,
  parseBackup,
  summarizeBackup,
  type BackupFile,
  type BackupSummary,
} from '@/domain/backup';

import journal from '../../drizzle/meta/_journal.json';

/** Migrations this app version has; stored in backups to detect files from newer apps. */
export const SCHEMA_VERSION = journal.entries.length;

/** Snapshot of the data from right before the last import, so it can be undone. */
const undoFile = () => new File(Paths.document, 'platewise-before-import.json');

async function currentBackup(): Promise<BackupFile> {
  return createBackup(await readAllData(), {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    platform: Platform.OS,
    appVersion: Constants.expoConfig?.version ?? null,
  });
}

function writeText(file: File, text: string) {
  if (file.exists) file.delete();
  file.create();
  file.write(text);
}

const backupFileName = () => `platewise-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;

/** Writes a backup file and opens the share sheet (iOS: Save to Files, AirDrop…; Android: Drive, email…). */
export async function shareBackup(): Promise<BackupSummary> {
  const backup = await currentBackup();
  const file = new File(Paths.cache, backupFileName());
  writeText(file, JSON.stringify(backup, null, 2));

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing isn’t available on this device.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle: 'Save Platewise backup',
  });
  return summarizeBackup(backup);
}

export type SaveResult = { status: 'canceled' } | { status: 'saved'; folder: string; fileName: string };

/**
 * Android: lets the user choose a folder on the phone (Downloads, Documents, SD card…) and saves
 * the backup file straight into it. Android's share sheet has no "save to device" target.
 */
export async function saveBackupToFolder(): Promise<SaveResult> {
  let folder: Directory;
  try {
    folder = await Directory.pickDirectoryAsync();
  } catch (error) {
    if (error instanceof Error && /cancel/i.test(error.message)) return { status: 'canceled' };
    throw error;
  }
  const backup = await currentBackup();
  const fileName = backupFileName();
  const file = folder.createFile(fileName, 'application/json');
  file.write(JSON.stringify(backup, null, 2));
  // Android folder names come from the storage provider, e.g. "primary:Documents".
  const folderName = decodeURIComponent(folder.name).split(/[:/]/).pop() || folder.name;
  return { status: 'saved', folder: folderName, fileName };
}

export type PickedBackup =
  | { status: 'canceled' }
  | { status: 'invalid'; error: string }
  | { status: 'ready'; backup: BackupFile; summary: BackupSummary; fileName: string };

/** Lets the user pick a backup file and validates it. Nothing is changed yet. */
export async function pickBackup(): Promise<PickedBackup> {
  const result = await DocumentPicker.getDocumentAsync({
    // Cloud providers often label .json files as plain text or generic binary.
    type: ['application/json', 'text/plain', 'application/octet-stream', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return { status: 'canceled' };

  const asset = result.assets[0];
  let text: string;
  try {
    text = await new File(asset.uri).text();
  } catch {
    return { status: 'invalid', error: 'Couldn’t read that file.' };
  }
  const parsed = parseBackup(text, SCHEMA_VERSION);
  return parsed.ok
    ? { status: 'ready', backup: parsed.backup, summary: parsed.summary, fileName: asset.name }
    : { status: 'invalid', error: parsed.error };
}

/** Replaces all data with the backup, after saving the current data so it can be undone. */
export async function importBackup(backup: BackupFile): Promise<void> {
  writeText(undoFile(), JSON.stringify(await currentBackup()));
  await replaceAllData(backup.data);
}

export function undoAvailableSince(): string | null {
  const file = undoFile();
  if (!file.exists) return null;
  try {
    const parsed = parseBackup(file.textSync(), SCHEMA_VERSION);
    return parsed.ok ? parsed.backup.exportedAt : null;
  } catch {
    return null;
  }
}

/** Restores the data from right before the last import. */
export async function undoLastImport(): Promise<void> {
  const file = undoFile();
  const parsed = parseBackup(await file.text(), SCHEMA_VERSION);
  if (!parsed.ok) throw new Error(parsed.error);
  await replaceAllData(parsed.backup.data);
  file.delete();
}
