# Data Migration Guide

This guide will help you backup your existing attendance data and link it to your email account after deploying the new authentication system.

## Overview

The new system requires email authentication to access your data. Before deploying, you need to:
1. Export your existing data
2. Deploy the new version
3. Sign in with your email
4. Import your data back

## Step-by-Step Migration Process

### Step 1: Backup Your Data (BEFORE Deployment)

1. **Open your current app** (the one without email authentication)
2. Go to **Settings** page
3. Click on the **"Backup"** tab
4. Click the **"Download Backup"** button
5. Save the JSON file to a safe location (e.g., Desktop, Downloads folder)
   - The file will be named like: `attendance-backup-2026-01-20.json`

**Important:** This file contains ALL your data:
- All subjects
- All classes and schedules
- All attendance records
- Holidays
- Settings

### Step 2: Deploy the New Version

Now you can safely deploy the new version with email authentication:

```bash
# Deploy to production
npx convex deploy

# Or if using a specific environment
npm run build
```

### Step 3: Sign In with Your Email

1. Open your app (it should redirect you to the login page)
2. Enter your email address
3. Check your email for the 6-digit code (may take 1-2 minutes)
4. Enter the code to sign in

### Step 4: Import Your Data

1. After signing in, go to **Settings** page
2. Click on the **"Backup"** tab
3. Click the **"Upload Backup"** button
4. Select the JSON file you saved in Step 1
5. Wait for the import to complete
6. You should see a success message

### Step 5: Verify Your Data

After importing:
1. Go to **Dashboard** to see your attendance overview
2. Go to **Subjects** to verify all subjects are there
3. Go to **Schedule** to check your class schedule
4. Check a few attendance records to make sure everything is correct

## Backup Features

The Backup & Restore page in Settings provides:

### Export Data
- Downloads all your data as a JSON file
- Includes everything: subjects, classes, attendance, holidays, settings
- File is named with the current date for easy tracking

### Import Data
- Restores data from a backup file
- Automatically remaps all IDs to work with your new account
- Adds to existing data (doesn't replace)

### Delete All Data (Danger Zone)
- Permanently deletes all your attendance data
- Use this if you want a fresh start
- **Important:** This cannot be undone! Always export first!

## Troubleshooting

### Issue: Import fails with "Invalid backup file format"
**Solution:** Make sure you're uploading the correct JSON file from the export. The file should contain `subjects`, `classes`, and `attendance` arrays.

### Issue: Email code not arriving
**Solution:**
- Wait 1-2 minutes for the email to arrive
- Check your spam/junk folder
- Try requesting a new code (wait for the cooldown timer)
- Make sure you entered the correct email address

### Issue: "Too many OTP requests" error
**Solution:** The system has rate limiting for security:
- Max 3 code requests per 5 minutes
- Wait for the cooldown period and try again

### Issue: Data looks incomplete after import
**Solution:**
- Check if all subjects are imported (Settings > Backup)
- Try exporting the data again from the old version and re-importing
- Contact support if data is missing

## Rate Limiting (Security Feature)

For security, the authentication system has rate limits:
- **OTP Requests:** Max 3 requests per 5 minutes per email
- **Verification Attempts:** Max 10 attempts per 15 minutes per email

These limits reset automatically after the time window.

## Email Validation

The system validates emails and checks for common typos:
- Detects typos like "gmial.com" → suggests "gmail.com"
- Checks for invalid formats
- Validates domain structure

## Important Notes

1. **Always backup before deploying!** The export file is your safety net.
2. The import process **adds** data to your account, it doesn't replace existing data
3. Keep your backup files safe - they contain all your attendance history
4. You can import the same backup multiple times, but this will create duplicates
5. The system automatically links imported data to your email account
6. After successful import, you can delete the backup file or keep it for records

## Need Help?

If you encounter any issues during migration:
1. Check the browser console for error messages (F12 → Console tab)
2. Try exporting and re-importing the data
3. Make sure you're signed in with the correct email
4. Verify the backup file is not corrupted (should be valid JSON)

## Data Privacy

- Your attendance data is stored securely in Convex database
- Email authentication ensures only you can access your data
- Rate limiting prevents unauthorized access attempts
- Backup files are stored locally on your computer
