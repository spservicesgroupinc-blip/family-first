# Google Apps Script Backend - Deployment Guide

## Overview

This Google Apps Script provides a REST-like API for the Family First Client Intake System. It stores client data in Google Sheets and exposes CRUD endpoints via `doGet` and `doPost`.

## Setup Instructions (15 minutes)

### Step 1: Create Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com)
2. Click **+ Blank** to create a new spreadsheet
3. Name it: `Family First - Client Database`
4. Note the spreadsheet URL (you'll need it later)

### Step 2: Create Apps Script Project

1. In your Google Sheet, click **Extensions** → **Apps Script**
2. Delete the default `Code.gs` content
3. Copy the entire contents of `gas/Code.gs` from this project
4. Paste it into the Apps Script editor
5. Click **Project Settings** (gear icon) → Note the Script ID

### Step 3: Set API Key (Optional but Recommended)

1. In Apps Script, click **Project Settings** → **Script Properties**
2. Click **Add script property**
   - Property: `API_KEY`
   - Value: Generate a secure key (e.g., `ff_prod_` + random string)
   - Click **Save**
3. This API key will be used by the frontend to authenticate requests

### Step 4: Save and Deploy

1. Click the **Save** icon (or Ctrl+S)
2. Click **Deploy** → **New deployment**
3. Click the gear icon → Select **Web app**
4. Configure:
   - **Description**: `Family First Client API v1`
   - **Execute as**: `Me` (your Google account)
   - **Who has access**: `Anyone` (this is safe because we use API key auth)
5. Click **Deploy**
6. **Authorize** the script when prompted (Review permissions → Allow)
7. Copy the **Web App URL** - this is your `VITE_GAS_API_URL`

### Step 5: Test the Deployment

Open this URL in your browser (replace `<YOUR_URL>` and optionally `<YOUR_API_KEY>`):

```
<YOUR_URL>?action=list&apiKey=<YOUR_API_KEY>
```

You should see:
```json
{"success":true,"data":[],"total":0}
```

### Step 6: Configure Frontend Environment

Create or update `.env.local` in your project root:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GAS_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
VITE_GAS_API_KEY=your_gas_api_key_same_as_step_3
```

> **Note**: If you didn't set an API key in Step 3, leave `VITE_GAS_API_KEY` empty or omit it. The backend will run in development mode (no auth).

## API Reference

### List Clients
```
GET <VITE_GAS_API_URL>?action=list&apiKey=<KEY>
GET <VITE_GAS_API_URL>?action=list&query=smith&apiKey=<KEY>
```

### Get Single Client
```
GET <VITE_GAS_API_URL>?action=get&id=client_123&apiKey=<KEY>
```

### Search Clients
```
GET <VITE_GAS_API_URL>?action=search&query=divorce&apiKey=<KEY>
POST <VITE_GAS_API_URL>
Body: { "action": "search", "query": "divorce" }
```

### Create Client
```
POST <VITE_GAS_API_URL>
Body: { "action": "create", "profile": { ...ClientProfile } }
```

### Update Client
```
POST <VITE_GAS_API_URL>
Body: { "action": "update", "id": "client_123", "profile": { ...updates } }
```

### Archive Client (Soft Delete)
```
POST <VITE_GAS_API_URL>
Body: { "action": "delete", "id": "client_123" }
```

## Data Structure

Client data is stored in a Google Sheet with the following columns:

| Category | Fields |
|----------|--------|
| **Metadata** | id, createdAt, updatedAt, isActive, status |
| **Personal Info** | firstName, lastName, middleName, dateOfBirth, ssnLast4, phone, email, address, etc. |
| **Spouse Info** | fullName, dateOfBirth, phone, email, dateOfMarriage, dateOfSeparation, opposing counsel |
| **Children** | JSON array stored as string |
| **Case Info** | caseType, caseNumber, countyFiled, judgeAssigned, urgentMatters (JSON), etc. |
| **Financial** | employmentStatus, monthlyIncome, assets, debts, etc. |
| **Emergency Contact** | name, relationship, phone, email, address |

## Troubleshooting

### CORS Errors
- Ensure deployment is set to **Who has access: Anyone**
- The `Code.gs` includes CORS headers; verify they're present

### "Invalid API key" Error
- Verify `VITE_GAS_API_KEY` matches the script property `API_KEY`
- If no API key is set in script properties, all requests are allowed (dev mode)

### "Script completed with error"
- In Apps Script, go to **Executions** to view error logs
- Common issues: Sheet permissions, malformed JSON, missing required fields

### Data Not Appearing in Sheet
- Check that the sheet name matches `SHEET_NAME` in `Code.gs` (default: `Clients`)
- Verify the first row contains headers (auto-created on first write)

## Security Notes

- **PII Protection**: Only store last 4 digits of SSN (never full SSN)
- **API Key**: Use a strong API key in production
- **Access Control**: Consider restricting to your Google Workspace domain if applicable
- **Data Retention**: Implement a data retention policy per your jurisdiction's requirements
- **Backups**: Google Sheets has version history; consider automated backups

## Updating the Script

1. Make changes in `gas/Code.gs`
2. Copy to Apps Script editor
3. Click **Deploy** → **Manage deployments**
4. Click the pencil icon next to your deployment
5. Change **Version** to `New version`
6. Click **Deploy**

> **Important**: Always deploy as a **new version**, not a revision, to ensure changes take effect immediately.
