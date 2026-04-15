/**
 * Family First - Client Intake System
 * Google Apps Script Backend
 * 
 * This script provides a REST-like API for CRUD operations on client profiles,
 * storing data in Google Sheets.
 */

// ────────────────────────────────────────────────
// Configuration
// ────────────────────────────────────────────────
const API_KEY = PropertiesService.getScriptProperties().getProperty('API_KEY') || 'family-first-default-key';
const SHEET_NAME = 'Clients';
const HEADERS = [
  'id', 'createdAt', 'updatedAt', 'isActive', 'status',
  // Personal Info
  'personalInfo.firstName', 'personalInfo.lastName', 'personalInfo.middleName',
  'personalInfo.dateOfBirth', 'personalInfo.ssnLast4', 'personalInfo.phone',
  'personalInfo.altPhone', 'personalInfo.email', 'personalInfo.address',
  'personalInfo.city', 'personalInfo.state', 'personalInfo.zip',
  'personalInfo.mailingAddress', 'personalInfo.mailingCity', 'personalInfo.mailingState',
  'personalInfo.mailingZip', 'personalInfo.isMailingSameAsPhysical',
  'personalInfo.preferredContactMethod', 'personalInfo.howDidYouHearAboutUs',
  // Spouse Info
  'spouseInfo.fullName', 'spouseInfo.dateOfBirth', 'spouseInfo.phone',
  'spouseInfo.email', 'spouseInfo.currentAddress', 'spouseInfo.isAddressSameAsClient',
  'spouseInfo.dateOfMarriage', 'spouseInfo.dateOfSeparation',
  'spouseInfo.opposingCounselName', 'spouseInfo.opposingCounselContact',
  'spouseInfo.opposingCounselFirm',
  // Children (stored as JSON string)
  'children',
  // Case Info
  'caseInfo.caseType', 'caseInfo.caseNumber', 'caseInfo.countyFiled',
  'caseInfo.judgeAssigned', 'caseInfo.courtDivision', 'caseInfo.urgentMatters',
  'caseInfo.opposingCounselInfo', 'caseInfo.caseNotes', 'caseInfo.priorityMatters',
  'caseInfo.desiredOutcome', 'caseInfo.previousFilings', 'caseInfo.mediationHistory',
  // Financial Info
  'financialInfo.clientEmploymentStatus', 'financialInfo.clientEmployer',
  'financialInfo.clientMonthlyIncome', 'financialInfo.clientPayFrequency',
  'financialInfo.spouseEmploymentStatus', 'financialInfo.spouseEmployer',
  'financialInfo.spouseMonthlyIncome', 'financialInfo.spousePayFrequency',
  'financialInfo.assets', 'financialInfo.debts', 'financialInfo.bankAccounts',
  'financialInfo.realEstate', 'financialInfo.vehicles', 'financialInfo.retirementAccounts',
  'financialInfo.creditCardDebt', 'financialInfo.mortgageBalance', 'financialInfo.otherDebts',
  // Emergency Contact
  'emergencyContact.name', 'emergencyContact.relationship', 'emergencyContact.phone',
  'emergencyContact.email', 'emergencyContact.address',
  // Additional
  'referralSource', 'retainerAmount', 'retainerPaid', 'notes'
];

// ────────────────────────────────────────────────
// CORS Headers
// ────────────────────────────────────────────────
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    'Access-Control-Allow-Credentials': 'false',
    'Content-Type': 'application/json; charset=utf-8'
  };
}

// ────────────────────────────────────────────────
// Helper: Get or create sheet
// ────────────────────────────────────────────────
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Add headers
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.getRange(1, 1, 1, HEADERS.length).setBackground('#f3f4f6');
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

// ────────────────────────────────────────────────
// Helper: Flatten nested object to row data
// ────────────────────────────────────────────────
function flattenClientProfile(profile) {
  const row = {};
  
  // Top-level fields
  row['id'] = profile.id;
  row['createdAt'] = profile.createdAt;
  row['updatedAt'] = profile.updatedAt;
  row['isActive'] = profile.isActive;
  row['status'] = profile.status;
  
  // Personal Info
  if (profile.personalInfo) {
    for (const key in profile.personalInfo) {
      row['personalInfo.' + key] = profile.personalInfo[key];
    }
  }
  
  // Spouse Info
  if (profile.spouseInfo) {
    for (const key in profile.spouseInfo) {
      row['spouseInfo.' + key] = profile.spouseInfo[key];
    }
  }
  
  // Children - store as JSON string
  row['children'] = profile.children ? JSON.stringify(profile.children) : '[]';
  
  // Case Info
  if (profile.caseInfo) {
    for (const key in profile.caseInfo) {
      if (key === 'urgentMatters') {
        row['caseInfo.' + key] = profile.caseInfo[key] ? JSON.stringify(profile.caseInfo[key]) : '[]';
      } else {
        row['caseInfo.' + key] = profile.caseInfo[key];
      }
    }
  }
  
  // Financial Info
  if (profile.financialInfo) {
    for (const key in profile.financialInfo) {
      row['financialInfo.' + key] = profile.financialInfo[key];
    }
  }
  
  // Emergency Contact
  if (profile.emergencyContact) {
    for (const key in profile.emergencyContact) {
      row['emergencyContact.' + key] = profile.emergencyContact[key];
    }
  }
  
  // Additional
  row['referralSource'] = profile.referralSource || '';
  row['retainerAmount'] = profile.retainerAmount || '';
  row['retainerPaid'] = profile.retainerPaid || false;
  row['notes'] = profile.notes || '';
  
  return row;
}

// ────────────────────────────────────────────────
// Helper: Reconstruct client profile from row
// ────────────────────────────────────────────────
function rowToClientProfile(rowData) {
  const profile = {
    id: rowData['id'],
    createdAt: Number(rowData['createdAt']),
    updatedAt: Number(rowData['updatedAt']),
    isActive: rowData['isActive'] === true || rowData['isActive'] === 'true',
    status: rowData['status'] || 'active',
    personalInfo: {},
    spouseInfo: {},
    children: [],
    caseInfo: {},
    financialInfo: {},
    emergencyContact: {},
    referralSource: rowData['referralSource'] || '',
    retainerAmount: rowData['retainerAmount'] || '',
    retainerPaid: rowData['retainerPaid'] === true || rowData['retainerPaid'] === 'true',
    notes: rowData['notes'] || ''
  };
  
  // Reconstruct nested objects
  for (const key in rowData) {
    if (key.startsWith('personalInfo.')) {
      const field = key.replace('personalInfo.', '');
      profile.personalInfo[field] = rowData[key];
    } else if (key.startsWith('spouseInfo.')) {
      const field = key.replace('spouseInfo.', '');
      profile.spouseInfo[field] = rowData[key];
    } else if (key.startsWith('caseInfo.')) {
      const field = key.replace('caseInfo.', '');
      if (field === 'urgentMatters' && rowData[key]) {
        try {
          profile.caseInfo[field] = JSON.parse(rowData[key]);
        } catch (e) {
          profile.caseInfo[field] = [];
        }
      } else {
        profile.caseInfo[field] = rowData[key];
      }
    } else if (key.startsWith('financialInfo.')) {
      const field = key.replace('financialInfo.', '');
      profile.financialInfo[field] = rowData[key];
    } else if (key.startsWith('emergencyContact.')) {
      const field = key.replace('emergencyContact.', '');
      profile.emergencyContact[field] = rowData[key];
    }
  }
  
  // Parse children
  if (rowData['children']) {
    try {
      profile.children = JSON.parse(rowData['children']);
    } catch (e) {
      profile.children = [];
    }
  }
  
  return profile;
}

// ────────────────────────────────────────────────
// Helper: Validate API key
// ────────────────────────────────────────────────
function validateApiKey(request) {
  const apiKey = request.parameter.apiKey || 
                 (request.postData && request.postData.getName() === 'apiKey' ? request.postData.getValue() : null);
  
  // Check headers for API key (in OPTIONS and other methods)
  if (!apiKey) {
    const headers = request.parameters || {};
    // For POST/PUT with JSON body, API key can be in body
  }
  
  // If no API key set in properties, allow all (development mode)
  if (API_KEY === 'family-first-default-key') return true;
  
  return apiKey === API_KEY;
}

// ────────────────────────────────────────────────
// doGet - List clients or get single client
// ────────────────────────────────────────────────
function doGet(e) {
  try {
    if (!validateApiKey(e)) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid API key' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const action = e.parameter.action;
    const id = e.parameter.id;
    const query = e.parameter.query;
    
    if (action === 'list' || (!action && !id)) {
      return listClients(query);
    } else if (action === 'get' || id) {
      return getClient(id || e.parameter.id);
    } else if (action === 'search') {
      return searchClients(query || '');
    }
    
    return createResponse({ error: 'Invalid action. Use: list, get, or search' });
  } catch (error) {
    Logger.log('GET Error: ' + error.toString());
    return createResponse({ error: error.toString() });
  }
}

// ────────────────────────────────────────────────
// doPost - Create client
// ────────────────────────────────────────────────
function doPost(e) {
  try {
    if (!validateApiKey(e)) {
      return createResponse({ error: 'Invalid API key' });
    }
    
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'create') {
      return createClient(data.profile);
    } else if (action === 'update') {
      return updateClient(data.id, data.profile);
    } else if (action === 'delete') {
      return deleteClient(data.id);
    } else if (action === 'search') {
      return searchClients(data.query || '');
    }
    
    // Default: create
    return createClient(data);
  } catch (error) {
    Logger.log('POST Error: ' + error.toString());
    return createResponse({ error: error.toString() });
  }
}

// ────────────────────────────────────────────────
// doOptions - Handle CORS preflight
// ────────────────────────────────────────────────
function doOptions(e) {
  const output = ContentService.createTextOutput('');
  const headers = getCorsHeaders();
  
  for (const key in headers) {
    output = output.setMimeType(ContentService.MimeType.TEXT);
  }
  
  return output;
}

// ────────────────────────────────────────────────
// CRUD Operations
// ────────────────────────────────────────────────

function listClients(searchQuery) {
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const clients = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    
    // Skip soft-deleted
    if (row['status'] === 'deleted') continue;
    
    // Filter by search query if provided
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const searchable = [
        row['personalInfo.firstName'], row['personalInfo.lastName'],
        row['caseInfo.caseType'], row['caseInfo.caseNumber'],
        row['spouseInfo.fullName']
      ].join(' ').toLowerCase();
      
      if (!searchable.includes(searchLower)) continue;
    }
    
    const profile = rowToClientProfile(row);
    
    // Return summary only for list view
    clients.push({
      id: profile.id,
      fullName: (profile.personalInfo.firstName || '') + ' ' + (profile.personalInfo.lastName || ''),
      caseType: profile.caseInfo.caseType || 'unknown',
      status: profile.status,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      spouseName: profile.spouseInfo.fullName || '',
      childrenCount: profile.children ? profile.children.length : 0,
      caseNumber: profile.caseInfo.caseNumber || '',
      countyFiled: profile.caseInfo.countyFiled || ''
    });
  }
  
  // Sort by updatedAt descending
  clients.sort((a, b) => b.updatedAt - a.updatedAt);
  
  return createResponse({ success: true, data: clients, total: clients.length });
}

function getClient(id) {
  if (!id) {
    return createResponse({ error: 'Client ID required' });
  }
  
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    
    if (row['id'] === id) {
      const profile = rowToClientProfile(row);
      return createResponse({ success: true, data: profile });
    }
  }
  
  return createResponse({ error: 'Client not found' });
}

function createClient(profile) {
  const sheet = getOrCreateSheet();
  
  // Set metadata
  profile.id = profile.id || 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  profile.createdAt = profile.createdAt || Date.now();
  profile.updatedAt = Date.now();
  profile.isActive = profile.isActive !== undefined ? profile.isActive : true;
  profile.status = profile.status || 'active';
  
  const row = flattenClientProfile(profile);
  const rowData = HEADERS.map(h => row[h] || '');
  
  sheet.appendRow(rowData);
  
  return createResponse({ success: true, data: profile, message: 'Client created successfully' });
}

function updateClient(id, updates) {
  if (!id) {
    return createResponse({ error: 'Client ID required' });
  }
  
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      // Reconstruct existing profile
      const existingRow = {};
      for (let j = 0; j < headers.length; j++) {
        existingRow[headers[j]] = data[i][j];
      }
      const existingProfile = rowToClientProfile(existingRow);
      
      // Merge updates
      const updatedProfile = { ...existingProfile, ...updates };
      updatedProfile.updatedAt = Date.now();
      
      // Deep merge nested objects
      if (updates.personalInfo) {
        updatedProfile.personalInfo = { ...existingProfile.personalInfo, ...updates.personalInfo };
      }
      if (updates.spouseInfo) {
        updatedProfile.spouseInfo = { ...existingProfile.spouseInfo, ...updates.spouseInfo };
      }
      if (updates.caseInfo) {
        updatedProfile.caseInfo = { ...existingProfile.caseInfo, ...updates.caseInfo };
      }
      if (updates.financialInfo) {
        updatedProfile.financialInfo = { ...existingProfile.financialInfo, ...updates.financialInfo };
      }
      if (updates.emergencyContact) {
        updatedProfile.emergencyContact = { ...existingProfile.emergencyContact, ...updates.emergencyContact };
      }
      if (updates.children) {
        updatedProfile.children = updates.children;
      }
      
      // Write updated row
      const flattened = flattenClientProfile(updatedProfile);
      const rowData = HEADERS.map(h => flattened[h] || '');
      
      sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
      
      return createResponse({ success: true, data: updatedProfile, message: 'Client updated successfully' });
    }
  }
  
  return createResponse({ error: 'Client not found' });
}

function deleteClient(id) {
  if (!id) {
    return createResponse({ error: 'Client ID required' });
  }
  
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      // Soft delete: update status
      const statusColIndex = HEADERS.indexOf('status');
      sheet.getRange(i + 1, statusColIndex + 1).setValue('archived');
      
      const updatedAtColIndex = HEADERS.indexOf('updatedAt');
      sheet.getRange(i + 1, updatedAtColIndex + 1).setValue(Date.now());
      
      return createResponse({ success: true, message: 'Client archived successfully' });
    }
  }
  
  return createResponse({ error: 'Client not found' });
}

function searchClients(query) {
  return listClients(query);
}

// ────────────────────────────────────────────────
// Helper: Create JSON response
// ────────────────────────────────────────────────
function createResponse(data) {
  const headers = getCorsHeaders();
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
