# How to Share a Clerk Account (Disable 2FA / Verification Codes)

If you want to share a single Grain account with multiple people (e.g., for a demo) without them needing access to the email for verification codes:

## 1. Enable Password Authentication
By default, Clerk might only use "Email Verification Codes" (Magic Codes). You need to enable passwords so you can share a credential pair.

1. Go to your **[Clerk Dashboard](https://dashboard.clerk.com/)**.
2. Navigate to **User & Authentication** > **Email, Phone, Username**.
3. Ensure **Password** is checked/enabled.
4. Click the **settings icon (cog)** next to Password to customize complexity if needed.

## 2. Disable Device Verification (Crucial for Sharing)
Even with a password, Clerk often asks for an email code when detecting a "New Device". You must disable this for shared accounts.

1. Navigate to **User & Authentication** > **Sessions**.
2. Look for **Device Verification** (sometimes under "Security" or "Attacks" depending on Clerk version).
3. **Disable** "Email verification on new device" or set it to "monitor only".
   * This ensures users can log in with just `Email + Password` from any computer.

## 3. Set a Password for the Account
1. Log in to the app once with your email (using the code).
2. If your app has a "Profile" page, set a password there.
3. **OR (Easier):** go to **Clerk Dashboard** > **Users**.
   * Click on the user you want to share.
   * Scroll to "Security" or "Authentication".
   * Click **Set Password** and adhere to the complexity rules.

## 4. Share Credentials
Now you can simply share:
* **Email:** `demo@grain.com` (or your email)
* **Password:** `YourSharedPassword123!`

Users will be able to log in directly without hitting the 2FA / Verification Code wall.
