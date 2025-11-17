# FIREBASE_API_KEY Configuration Guide

**Version**: v0.8.1-rc1
**Last Updated**: 2025-11-16

---

## What is FIREBASE_API_KEY?

**FIREBASE_API_KEY** (and related Firebase variables) enable **Firebase Storage** as a CDN backend for LibreChat, allowing cloud-based file storage and delivery.

### What Users Get

When configured, LibreChat users get:
- ✅ **Cloud file storage** - Files stored in Firebase Storage
- ✅ **Fast CDN delivery** - Global content delivery network
- ✅ **Reliable uploads** - Robust cloud infrastructure
- ✅ **Scalable storage** - Handles growing file needs
- ✅ **Avatar uploads** - User and agent avatar images
- ✅ **File attachments** - Document and image uploads

---

## Prerequisites

**Firebase Project Required**:
1. Google account
2. Firebase project created
3. Firebase Storage enabled

---

## Quick Setup

**1. Create Firebase Project**:
- Visit: https://console.firebase.google.com/
- Click **"Add project"**
- Enter project name
- Complete setup wizard

**2. Enable Firebase Storage**:
- In Firebase Console, go to **Build > Storage**
- Click **"Get started"**
- Choose security rules (start in test mode for development)
- Select storage location
- Click **"Done"**

**3. Get Firebase Configuration**:
- In Firebase Console, go to **Project settings** (gear icon)
- Scroll to **"Your apps"** section
- Click **Web** icon (`</>`)
- Register app (name: "LibreChat")
- Copy configuration values:
  ```javascript
  const firebaseConfig = {
    apiKey: "AIza...",
    authDomain: "your-app.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-app.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123..."
  };
  ```

**4. Configure LibreChat**:
```bash
# Add to .env
FIREBASE_API_KEY=AIza...
FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-app.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abc123...
```

**5. Set Storage Strategy**:
```bash
# In .env - Choose Firebase for file storage
# Single strategy (legacy)
# FILE_UPLOAD_STRATEGY=firebase

# Or granular strategy (recommended)
FILE_STRATEGY_AVATAR=firebase
FILE_STRATEGY_IMAGE=firebase
FILE_STRATEGY_DOCUMENT=firebase
```

**6. Restart LibreChat**:
```bash
docker-compose -f docker-compose.windows.yml restart api
```

---

## What Users Experience

**File Uploads**:
- Users upload avatars → Stored in Firebase
- Users attach images → Stored in Firebase
- Users upload documents → Stored in Firebase
- Fast, reliable cloud storage
- Accessible from anywhere

**Benefits over Local Storage**:
- ✅ Not limited by server disk space
- ✅ Survives container restarts
- ✅ Faster delivery via CDN
- ✅ Automatic backups
- ✅ Scalable infrastructure

---

## Pricing

**Free Tier (Spark Plan)**:
- 5 GB storage
- 1 GB/day downloads
- 20,000 downloads/day
- Sufficient for small teams

**Paid (Blaze Plan)**:
- Pay-as-you-go
- $0.026/GB storage/month
- $0.12/GB downloads
- Visit: https://firebase.google.com/pricing

---

## Configuration Reference

```bash
# Required Firebase variables
FIREBASE_API_KEY=AIza...
FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-app.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abc123...

# Storage strategy
FILE_STRATEGY_AVATAR=firebase
FILE_STRATEGY_IMAGE=firebase
FILE_STRATEGY_DOCUMENT=firebase
```

**Alternative storage options**:
- `local` - Server filesystem
- `s3` - AWS S3
- `azure` - Azure Blob Storage

---

## Security Configuration

**Firebase Storage Rules** (basic):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated uploads
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

**Production rules** (recommended):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Only allow specific file types
    match /avatars/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth.uid == userId
                   && request.resource.size < 2 * 1024 * 1024  // 2MB limit
                   && request.resource.contentType.matches('image/.*');
    }

    match /images/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth.uid == userId
                   && request.resource.size < 10 * 1024 * 1024;  // 10MB limit
    }
  }
}
```

---

## Troubleshooting

**Files not uploading**:
- Check all Firebase variables in .env
- Verify Firebase Storage is enabled
- Check storage rules allow writes
- View logs: `docker logs LibreChat | grep -i firebase`

**Permission denied**:
- Update Firebase Storage rules
- Ensure rules allow writes for authenticated users
- Check Firebase Console > Storage > Rules

**Invalid configuration**:
- Verify all 6 Firebase variables are set
- Check for typos in .env
- Ensure values match Firebase Console

---

## Related Documentation

- **S3 Storage**: See AWS S3 configuration docs
- **Azure Storage**: See Azure Blob Storage docs
- **Local Storage**: Default (no config needed)
- **Main Guide**: See [CLAUDE.md](../../../CLAUDE.md)

---

*For more info: https://firebase.google.com/docs/storage*
