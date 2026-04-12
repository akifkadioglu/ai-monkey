/**
 * gdrive.js - Google Drive backup/sync for AI Monkey
 *
 * Uses Chrome Identity API + Google Drive REST API to backup and restore
 * scripts to a single JSON file in the user's Google Drive appDataFolder.
 */

const DRIVE_FILE_NAME = 'ai-monkey-backup.json';
const SCOPES = ['https://www.googleapis.com/auth/drive.appdata'];

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/**
 * Get an OAuth2 token via Chrome Identity API.
 * @param {boolean} interactive - Whether to show the auth popup.
 * @returns {Promise<string>} The access token.
 */
async function getAuthToken(interactive = true) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive, scopes: SCOPES }, (token) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(token);
      }
    });
  });
}

/**
 * Remove the cached auth token (sign out).
 */
async function signOut() {
  try {
    const token = await getAuthToken(false);
    if (token) {
      // Revoke the token on Google's side
      await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`);
      return new Promise((resolve) => {
        chrome.identity.removeCachedAuthToken({ token }, resolve);
      });
    }
  } catch {
    // Already signed out or token invalid - that's fine
  }
}

/**
 * Check if the user is currently authenticated.
 * @returns {Promise<boolean>}
 */
async function isSignedIn() {
  try {
    const token = await getAuthToken(false);
    return !!token;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Drive file helpers
// ---------------------------------------------------------------------------

/**
 * Find the backup file in appDataFolder.
 * @param {string} token - OAuth access token.
 * @returns {Promise<string|null>} The file ID, or null if not found.
 */
async function findBackupFile(token) {
  const query = `name='${DRIVE_FILE_NAME}' and trashed=false`;
  const resp = await fetch(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${encodeURIComponent(query)}&fields=files(id,name,modifiedTime)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `Drive API error: ${resp.status}`);
  }

  const data = await resp.json();
  return data.files?.[0] || null;
}

/**
 * Read the contents of a Drive file.
 * @param {string} token - OAuth access token.
 * @param {string} fileId - Drive file ID.
 * @returns {Promise<Object>} The parsed JSON contents.
 */
async function readFile(token, fileId) {
  const resp = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!resp.ok) {
    throw new Error(`Failed to read backup: ${resp.status}`);
  }

  return resp.json();
}

/**
 * Create or update the backup file with new content.
 * @param {string} token - OAuth access token.
 * @param {string|null} fileId - Existing file ID to update, or null to create.
 * @param {Object} content - The data to write.
 * @returns {Promise<Object>} The Drive file metadata.
 */
async function writeFile(token, fileId, content) {
  const body = JSON.stringify(content, null, 2);
  const metadata = {
    name: DRIVE_FILE_NAME,
    mimeType: 'application/json'
  };

  if (fileId) {
    // Update existing file
    const resp = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body
      }
    );

    if (!resp.ok) throw new Error(`Failed to update backup: ${resp.status}`);
    return resp.json();
  } else {
    // Create new file in appDataFolder
    const form = new FormData();
    form.append(
      'metadata',
      new Blob([JSON.stringify({ ...metadata, parents: ['appDataFolder'] })], {
        type: 'application/json'
      })
    );
    form.append('file', new Blob([body], { type: 'application/json' }));

    const resp = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      }
    );

    if (!resp.ok) throw new Error(`Failed to create backup: ${resp.status}`);
    return resp.json();
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Backup all scripts to Google Drive.
 * @param {Object} scripts - The scripts object from storage.
 * @returns {Promise<{fileId: string, modifiedTime: string}>}
 */
async function backupToDrive(scripts) {
  const token = await getAuthToken(true);
  const existing = await findBackupFile(token);

  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    scripts: Object.values(scripts)
  };

  const result = await writeFile(token, existing?.id || null, payload);
  return { fileId: result.id, modifiedTime: result.modifiedTime };
}

/**
 * Restore scripts from Google Drive backup.
 * @returns {Promise<Object[]>} Array of script objects from the backup.
 */
async function restoreFromDrive() {
  const token = await getAuthToken(true);
  const existing = await findBackupFile(token);

  if (!existing) {
    throw new Error('No backup found on Google Drive');
  }

  const data = await readFile(token, existing.id);
  return data.scripts || [];
}

/**
 * Get info about the current backup on Drive.
 * @returns {Promise<{exists: boolean, modifiedTime?: string}>}
 */
async function getBackupInfo() {
  try {
    const token = await getAuthToken(false);
    if (!token) return { exists: false };

    const file = await findBackupFile(token);
    if (!file) return { exists: false };

    return { exists: true, modifiedTime: file.modifiedTime };
  } catch {
    return { exists: false };
  }
}

export {
  getAuthToken,
  signOut,
  isSignedIn,
  backupToDrive,
  restoreFromDrive,
  getBackupInfo
};
