# Google Sheets Setup Instructions

## 1. Create a Google Cloud Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API:
   - Go to "APIs & Services" > "Enable APIs and Services"
   - Search for "Google Sheets API" and enable it
   - Search for "Google Drive API" and enable it

4. Create Service Account:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Name it "coinconvert-service"
   - Click "Create and Continue"
   - Skip optional steps and click "Done"

5. Create Service Account Key:
   - Click on the service account you just created
   - Go to "Keys" tab
   - Click "Add Key" > "Create New Key"
   - Select "JSON" format
   - Download the JSON file
   - Save it as `service-account.json` in your backend folder

## 2. Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com/)
2. Create a new blank spreadsheet
3. Name it "CoinConvert Database"
4. Copy the Spreadsheet ID from the URL:
   - URL looks like: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit`
   - Copy the `SPREADSHEET_ID_HERE` part

## 3. Share Sheet with Service Account

1. Open your Google Sheet
2. Click "Share" button
3. Add the service account email (found in service-account.json as "client_email")
   - It looks like: `coinconvert-service@your-project.iam.gserviceaccount.com`
4. Give it "Editor" permissions
5. Click "Send"

## 4. Update .env File

Edit `backend/.env`:

```env
GOOGLE_SHEETS_CREDENTIALS_FILE=service-account.json
GOOGLE_SHEETS_SPREADSHEET_ID=YOUR_SPREADSHEET_ID_HERE
```

## 5. Restart Backend

The worksheets will be created automatically on first run:
- "Transactions" - stores all transaction data
- "Users" - stores user accounts

Done! Your app now uses Google Sheets as the database.
