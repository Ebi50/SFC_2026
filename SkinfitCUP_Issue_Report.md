# 🧭 Routes (GPX Viewer)

### Problem
Uploaded GPX route files are **not stored permanently**.  
They can be uploaded successfully, but disappear after a short period — they are no longer visible on the Routes page.

### Goal
Routes should be **persistently stored in Google Cloud Storage (GCS)** and automatically displayed on the **Routes page** of the app.

### Details
- **Bucket name:** `skinfit-app-data`
- **Folder path:** `Daten/Strecken`
- **Public bucket URL:**  
  [https://console.cloud.google.com/storage/browser/skinfit-app-data/Daten/Strecken?pageState=(%22StorageObjectListTable%22:(%22f%22:%22%255B%255D%22))&project=skinfit-app-474714](https://console.cloud.google.com/storage/browser/skinfit-app-data/Daten/Strecken?pageState=(%22StorageObjectListTable%22:(%22f%22:%22%255B%255D%22))&project=skinfit-app-474714)

### Expected Functionality
1. GPX files can be uploaded either:
   - directly through the app, or  
   - manually to the GCS bucket.
2. All routes stored in the bucket are automatically displayed on the “Routes” page.
3. Each route should show metadata:
   - name, upload date, size, and GPX map preview.

### Open Question
What additional information or configuration details are required to integrate this functionality properly?

---

# 👤 Participants

### Problem
Self-created participant entries still contain **empty address fields**.  
Address fields are **not required** and should be **removed** entirely.

### Expected Fix
- Remove all unused address fields from the participant form and Firestore schema.
- Keep only these participant fields:
  - `first_name`
  - `last_name`
  - `birth_year`
  - `rsv_member` (checkbox)
  - `email`
  - `phone`

---

# 📅 Event Creation

### Problem
When creating new events:
1. The event must first be **created and saved**.
2. Only then can participants be **added**.

If participants are added **before saving**, an **error message** appears — even though the event is actually saved.  
This suggests a **timing or sync issue**, where saving takes longer than the timeout triggering the error.

### Expected Fix
- Ensure that event creation and saving complete fully before participant addition is allowed.
- Implement a success callback or wait for the Firestore transaction to finish before enabling dependent actions.
- Prevent false error messages when the event is already stored successfully.

---

# ✅ Summary of Required Actions
1. Persist GPX routes in Google Cloud Storage (`skinfit-app-data/Daten/Strecken`) and automatically display them in the app’s Routes section.  
2. Remove unnecessary address fields from the participant data model.  
3. Fix event creation timing issue — ensure saving completes before participants can be added.

---
