/**
 * Google Sheets & Drive API Integration Service
 */

export interface GoogleSpreadsheetFile {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

/**
 * List spreadsheet files from the user's Google Drive
 */
export async function listGoogleSpreadsheets(accessToken: string): Promise<GoogleSpreadsheetFile[]> {
  const url = `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet' and trashed = false&orderBy=modifiedTime desc&fields=files(id, name, modifiedTime, webViewLink)`;
  
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || 'Gagal mengambil daftar Google Sheets dari Drive.');
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Create a new Google Spreadsheet with default WMS sheets (tabs)
 */
export async function createWmsSpreadsheet(accessToken: string, title: string): Promise<GoogleSpreadsheetFile> {
  const url = 'https://sheets.googleapis.com/v4/spreadsheets';
  
  const body = {
    properties: {
      title: title || 'WMS Gudang - Real-Time Data Sync',
    },
    sheets: [
      { properties: { title: 'Master Materials' } },
      { properties: { title: 'Master Vendors' } },
      { properties: { title: 'Master Gedung' } },
      { properties: { title: 'Master Users' } },
      { properties: { title: 'Incoming Receiving' } },
      { properties: { title: 'Outbound Delivery' } },
      { properties: { title: 'Stock Opname' } },
      { properties: { title: 'Monitoring Reject' } },
      { properties: { title: 'Put Away' } },
      { properties: { title: 'Mutasi Internal' } },
      { properties: { title: 'Kartu Stock' } }
    ],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || 'Gagal membuat Google Spreadsheet baru.');
  }

  const data = await res.json();
  return {
    id: data.spreadsheetId,
    name: data.properties.title,
    webViewLink: data.spreadsheetUrl,
  };
}

/**
 * Add a new sheet tab to an existing Spreadsheet
 */
export async function addSheetToSpreadsheet(accessToken: string, spreadsheetId: string, sheetTitle: string): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
  const body = {
    requests: [
      {
        addSheet: {
          properties: {
            title: sheetTitle,
          },
        },
      },
    ],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Gagal membuat tab "${sheetTitle}" di Google Spreadsheet.`);
  }
}

/**
 * Sync (write) data to a specific sheet (tab) in Google Spreadsheet
 */
export async function updateSheetValues(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  headers: string[],
  rows: any[][]
): Promise<void> {
  // We clear the sheet values first or just overwrite the entire range
  // Range can be just the sheet name (it will start at A1)
  const range = `${sheetName}!A1:Z1000`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;

  const values = [headers, ...rows];

  const body = {
    range,
    majorDimension: 'ROWS',
    values,
  };

  // First, clear the existing data in the sheet to prevent leftover values
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`;
  await fetch(clearUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }).catch(e => console.warn('Gagal membersihkan data sheet:', e));

  // Now, update values
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Gagal menulis data ke sheet "${sheetName}".`);
  }
}

/**
 * Fetch values from a specific sheet in Google Spreadsheet
 */
export async function getSheetValues(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string
): Promise<any[][]> {
  const range = `${sheetName}!A1:Z1000`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Gagal membaca data dari sheet "${sheetName}".`);
  }

  const data = await res.json();
  return data.values || [];
}

/**
 * Update sheet values and automatically create the sheet tab if it doesn't exist
 */
export async function updateSheetValuesWithAutoCreate(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  headers: string[],
  rows: any[][]
): Promise<void> {
  try {
    await updateSheetValues(accessToken, spreadsheetId, sheetName, headers, rows);
  } catch (err: any) {
    // If the error message indicates the sheet/range doesn't exist
    if (err.message && (
      err.message.includes('not found') || 
      err.message.includes('range') || 
      err.message.includes('400') || 
      err.message.includes('Requested entity was not found')
    )) {
      try {
        await addSheetToSpreadsheet(accessToken, spreadsheetId, sheetName);
        // Wait a small moment and retry updating values
        await updateSheetValues(accessToken, spreadsheetId, sheetName, headers, rows);
        return;
      } catch (createErr: any) {
        console.error(`Gagal membuat tab otomatis untuk "${sheetName}":`, createErr);
        throw new Error(`Gagal menulis data karena tab "${sheetName}" tidak ditemukan dan gagal dibuat secara otomatis.`);
      }
    }
    throw err;
  }
}
