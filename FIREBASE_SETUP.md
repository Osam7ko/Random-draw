# Firebase Setup Instructions

## The Problem

The app is showing "Missing or insufficient permissions" error because Firebase Firestore security rules are blocking unauthenticated users from writing to the database.

## Solution: Update Firestore Security Rules

1. Go to your Firebase Console: https://console.firebase.google.com/
2. Select your project: `rafflenumbers-7193f`
3. Navigate to **Firestore Database** in the left sidebar
4. Click on the **Rules** tab
5. Replace the existing rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to raffleNumbers collection for everyone
    match /raffleNumbers/{document} {
      allow read, write: if true;
    }

    // Restrict other collections to authenticated users only
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

6. Click **Publish** to save the rules

## Why This Works

- The first rule allows anyone (authenticated or not) to read and write to the `raffleNumbers` collection
- This is necessary because visitors need to generate and store their raffle numbers
- The second rule ensures other collections remain protected and require authentication
- Admin users will still need to authenticate to access the admin panel

## Security Considerations

- This setup is appropriate for a raffle system where public participation is required
- The raffle numbers are not sensitive data
- Admin functions remain protected by authentication
- Consider adding rate limiting if needed to prevent abuse

## Alternative Approach (More Secure)

If you prefer a more secure approach, you could:

1. Create a Cloud Function that handles number generation
2. Keep stricter security rules
3. Call the function from the client side

But for a simple raffle system, the above rules are sufficient and easier to implement.
