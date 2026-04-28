# 🚀 Fix: "Supabase configuration missing" on Netlify

Your Netlify deployment is crashing because it doesn't know your Supabase credentials. Unlike your local computer which reads from `.env`, Netlify needs these variables added securely in its dashboard.

## Step 1: Get your Credentials
Open your local file: `d:\Billmanagement\frontend\.env`
You will need the values for:
1.  `REACT_APP_SUPABASE_URL`
2.  `REACT_APP_SUPABASE_ANON_KEY`

## Step 2: Add to Netlify
1.  Log in to [Netlify](https://app.netlify.com/).
2.  Select your site (**ts-billing** or similar).
3.  Go to **Site configuration** > **Environment variables**.
4.  Click **Add a variable** > **Add a single variable**.
5.  Add the URL:
    *   **Key**: `REACT_APP_SUPABASE_URL`
    *   **Value**: (Paste the URL starting with https://...)
6.  Add the Key:
    *   **Key**: `REACT_APP_SUPABASE_ANON_KEY`
    *   **Value**: (Paste the long key string starting with eyJ...)

## Step 3: Trigger a Redeploy (Crucial!)
Updating variables **does not** update the live site immediately. You must rebuild it.
1.  Go to the **Deploys** tab in Netlify.
2.  Click the **Trigger deploy** dropdown button (usually on the latest build).
3.  Select **Clear cache and deploy site**.

Once the build finishes, your site will work!
