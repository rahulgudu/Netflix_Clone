# Step-by-Step Guide: Setting Up Google OAuth for NextAuth

This guide walks you through creating a project on the Google Cloud Console, configuring the OAuth consent screen, and generating the `GOOGLE_ID` and `GOOGLE_SECRET` credentials for your Next.js Netflix Clone.

---

## Step 1: Go to Google Cloud Console
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Log in with your Google Account.

---

## Step 2: Create a New Project
1. In the top navigation bar, click the project dropdown (next to the "Google Cloud" logo).
2. Click **New Project** (top right of the modal window).
3. Enter a Project Name (e.g., `Netflix Clone`).
4. Leave Organization/Location as default or `No organization`.
5. Click **Create** and wait a few seconds for Google to set up the project. Once created, make sure the project is selected in the project selector dropdown.

---

## Step 3: Configure the OAuth Consent Screen
Before creating credentials, you must define the user consent screen that your users will see.

1. In the left-hand sidebar menu, navigate to **APIs & Services** > **OAuth consent screen**.
2. Select **External** (this allows any Gmail user to sign in).
3. Click **Create**.
4. Fill in the **App Information**:
   - **App name**: `Netflix Clone`
   - **User support email**: Select your email from the dropdown.
   - **Developer contact information**: Enter your email address.
5. Click **Save and Continue** (skip Scopes and Test Users by clicking **Save and Continue** on those pages as well).
6. On the Summary page, click **Back to Dashboard**.

> [!NOTE]
> Since the app is in **Testing** mode, only users added in the "Test users" list will be able to log in. Under **Publishing status**, you can click **Publish App** to make it available to any Google user without restriction.

---

## Step 4: Create OAuth 2.0 Credentials
1. In the left-hand sidebar, click **Credentials**.
2. Click **+ Create Credentials** at the top of the screen and select **OAuth client ID**.
3. Under **Application type**, select **Web application**.
4. Set the **Name** to `NextAuth Web Client` (or any description).

---

## Step 5: Configure Authorized Origins & Redirect URIs
This is the most critical step to prevent redirect mismatch errors.

### 1. Authorized JavaScript Origins
These are the domain names where your app is hosted:
- Click **+ Add URI** and add:
  `http://localhost:3000` *(for local development)*
- *(If you deploy online, add your production URL here, e.g., `https://my-netflix-clone.vercel.app`)*

### 2. Authorized Redirect URIs
These are the endpoints NextAuth uses to receive auth callback tokens from Google:
- Click **+ Add URI** under **Authorized redirect URIs** and add:
  `http://localhost:3000/api/auth/callback/google`
- *(If you deploy online, add your production callback URL here, e.g., `https://my-netflix-clone.vercel.app/api/auth/callback/google`)*

> [!IMPORTANT]
> The path `/api/auth/callback/google` is hardcoded in NextAuth. Double check for typos, trailing slashes, or missing characters.

5. Click **Create**.

---

## Step 6: Copy Credentials to `.env`
A modal will pop up displaying your credentials:
1. Copy the **Client ID** and set it to:
   ```env
   GOOGLE_ID=your_client_id_here
   ```
2. Copy the **Client Secret** and set it to:
   ```env
   GOOGLE_SECRET=your_client_secret_here
   ```
3. Restart your Next.js development server for the new `.env` variables to take effect!
