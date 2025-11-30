const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

admin.initializeApp();

// ------------------------------------------------------------------
//  BACKUP REQUEST TO GOOGLE SHEET
// ------------------------------------------------------------------

// Placeholder for your Spreadsheet ID
// Open your Google Sheet -> Copy the ID from the URL: docs.google.com/spreadsheets/d/[THIS-IS-THE-ID]/edit
const SPREADSHEET_ID = '10_sAOW3muawnKSmJm751wWzeKYOAI4QmAnHpbIdzYRk';

exports.backupRequestToSheet = functions.firestore
    .document('requests/{requestId}')
    .onCreate(async (snap, context) => {
        const data = snap.data();
        const requestId = context.params.requestId;

        console.log(`Backing up request ${requestId} to Google Sheets...`);

        try {
            // Check if service-account.json exists
            let serviceAccount;
            try {
                serviceAccount = require('./sip-n-sing-app-b13d982cd91e.json');
            } catch (e) {
                console.error('service-account.json not found. Cannot authenticate with Google Sheets.');
                return null;
            }

            // 1. Authenticate
            const serviceAccountAuth = new JWT({
                email: serviceAccount.client_email,
                key: serviceAccount.private_key,
                scopes: [
                    'https://www.googleapis.com/auth/spreadsheets',
                ],
            });

            // 2. Load the document
            const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
            await doc.loadInfo(); // loads document properties and worksheets

            // 3. Get the first sheet (or specify by title/index)
            const sheet = doc.sheetsByIndex[0];

            // 4. Prepare the row data
            // Assuming 'timestamp' is a Firestore Timestamp
            const date = data.timestamp ? data.timestamp.toDate().toLocaleString() : new Date().toLocaleString();

            const row = {
                Time: date,
                Name: data.singerName || data.name || 'Unknown', // Fallback for name field
                Handle: data.igHandle || data.instagramHandle || '',
                Song: data.song || data.songTitle || '',
                Artist: data.artist || ''
            };

            // 5. Append the row
            await sheet.addRow(row);
            console.log(`Successfully backed up request ${requestId}.`);

        } catch (error) {
            // Log error but do NOT throw, to prevent infinite retries or crashing
            console.error('Failed to backup request to Google Sheet:', error);
            return null;
        }
    });
