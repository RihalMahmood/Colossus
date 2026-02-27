const { google } = require("googleapis");

//Create a configured OAuth2 client

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

/*Generate the Google OAuth consent URL for adding a Drive account
state = userId so we know who to attach the account to after redirect*/
function getAuthUrl(userId) {
  const oauth2Client = createOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",  //Force refresh_token to be returned every time
    scope: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
    state: userId.toString(),
  });
}

//Exchange auth code for tokens

async function exchangeCodeForTokens(code) {
  const oauth2Client = createOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/*Get an authenticated Drive client for a specific drive account
Automatically refreshes token if expired*/

async function getDriveClient(driveAccount, user) {
  const oauth2Client = createOAuthClient();

  oauth2Client.setCredentials({
    access_token: driveAccount.accessToken,
    refresh_token: driveAccount.refreshToken,
    expiry_date: driveAccount.tokenExpiry ? new Date(driveAccount.tokenExpiry).getTime() : null,
  });

  //Handle token refresh automatically, so user doesn't have to re-authenticate when token expires
  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      const account = user.driveAccounts.id(driveAccount._id);
      if (account) {
        account.accessToken = tokens.access_token;
        if (tokens.expiry_date) account.tokenExpiry = new Date(tokens.expiry_date);
        await user.save();
      }
    }
  });

  return google.drive({ version: "v3", auth: oauth2Client });
}

/*Get storage quota for a drive account
Returns { total, used, free } in bytes*/
async function getDriveQuota(driveAccount, user) {
  try {
    const drive = await getDriveClient(driveAccount, user);
    const res = await drive.about.get({ fields: "storageQuota" });
    const quota = res.data.storageQuota;
    const total = parseInt(quota.limit || 0);
    const used = parseInt(quota.usage || 0);
    return {
      total,
      used,
      free: total - used,
      email: driveAccount.email,
    };
  } catch (err) {
    console.error(`Failed to get quota for ${driveAccount.email}:`, err.message);
    return { total: 0, used: 0, free: 0, email: driveAccount.email, error: true };
  }
}

//Get user info from Google using tokens
async function getGoogleUserInfo(tokens) {
  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();
  return data;
}

module.exports = {
  createOAuthClient,
  getAuthUrl,
  exchangeCodeForTokens,
  getDriveClient,
  getDriveQuota,
  getGoogleUserInfo,
};
