const express = require("express");
const router = express.Router();
const { randomBytes } = require("node:crypto");
const { protect } = require("../middleware/authMiddleware");
const {
  getAuthUrl,
  exchangeCodeForTokens,
  getGoogleUserInfo,
  getDriveQuota,
} = require("../utils/googleDrive");

/*Encode state as a JSON object containing both userId AND a random CSRF token,
then store the CSRF token server-side (on the user document) during /connect,
and verify it matches during /oauth/callback before accepting the code exchange.*/

/*
GET /api/drives/connect
Generates the Google OAuth URL to add a new Drive account.
Now encodes { userId, csrfToken } in state and persists csrfToken to user document.
*/
router.get("/connect", protect, async (req, res) => {
  try {
    //Generate a random CSRF token for this OAuth session
    const csrfToken = randomBytes(24).toString("hex");

    //Persist the token on the user so we can verify it on callback
    req.user.oauthCsrfToken = csrfToken;
    await req.user.save();

    //Encode both userId and csrfToken into the state param
    const state = Buffer.from(
      JSON.stringify({ userId: req.user._id.toString(), csrfToken })
    ).toString("base64");

    const url = getAuthUrl(state);
    res.json({ success: true, url });
  } catch (err) {
    console.error("Drive connect error:", err);
    res.status(500).json({ success: false, message: "Failed to generate OAuth URL." });
  }
});

/*
GET /api/drives/oauth/callback
Google redirects here after the user grants permission.
Now verifies the CSRF token before exchanging the code for tokens.
*/
router.get("/oauth/callback", async (req, res) => {
  const { code, state, error } = req.query;

  if (error || !code || !state) {
    return res.redirect(`${process.env.CLIENT_URL}/dashboard?drive_error=access_denied`);
  }

  try {
    //Decode and validate the state param
    let parsedState;
    try {
      parsedState = JSON.parse(Buffer.from(state, "base64").toString("utf8"));
    } catch {
      return res.redirect(`${process.env.CLIENT_URL}/dashboard?drive_error=invalid_state`);
    }

    const { userId, csrfToken } = parsedState;
    if (!userId || !csrfToken) {
      return res.redirect(`${process.env.CLIENT_URL}/dashboard?drive_error=invalid_state`);
    }

    //Find the platform user
    const User = require("../models/User");
    const user = await User.findById(userId);

    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL}/dashboard?drive_error=user_not_found`);
    }

    //Verify the CSRF token matches what we stored at /connect time
    if (!user.oauthCsrfToken || user.oauthCsrfToken !== csrfToken) {
      return res.redirect(`${process.env.CLIENT_URL}/dashboard?drive_error=csrf_mismatch`);
    }

    //Clear the used CSRF token immediately (one-time use)
    user.oauthCsrfToken = undefined;

    //Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    //Get Google user info for this account
    const googleUser = await getGoogleUserInfo(tokens);

    //Check if this Google account is already connected
    const alreadyConnected = user.driveAccounts.some(
      (acc) => acc.email === googleUser.email
    );

    if (alreadyConnected) {
      await user.save();
      return res.redirect(
        `${process.env.CLIENT_URL}/dashboard?drive_error=already_connected&email=${googleUser.email}`
      );
    }

    //Add the new drive account
    user.driveAccounts.push({
      email: googleUser.email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      displayName: googleUser.name,
      picture: googleUser.picture,
    });

    await user.save();

    res.redirect(
      `${process.env.CLIENT_URL}/dashboard?drive_connected=true&email=${googleUser.email}`
    );
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.redirect(`${process.env.CLIENT_URL}/dashboard?drive_error=server_error`);
  }
});

/*
GET /api/drives
Returns all connected drive accounts for the current user (with quota info)
*/
router.get("/", protect, async (req, res) => {
  try {
    const user = req.user;

    if (!user.driveAccounts || user.driveAccounts.length === 0) {
      return res.json({
        success: true,
        drives: [],
        totalStorage: { total: 0, used: 0, free: 0 },
      });
    }

    //Fetch quota for each drive in parallel
    const driveQuotas = await Promise.all(
      user.driveAccounts.map((account) => getDriveQuota(account, user))
    );

    //Build drive list with metadata
    const drives = user.driveAccounts.map((account, idx) => ({
      _id: account._id.toString(),
      email: account.email,
      displayName: account.displayName,
      picture: account.picture,
      addedAt: account.addedAt,
      quota: driveQuotas[idx],
    }));

    //Calculate combined totals
    const totalStorage = driveQuotas.reduce(
      (acc, q) => ({
        total: acc.total + q.total,
        used: acc.used + q.used,
        free: acc.free + q.free,
      }),
      { total: 0, used: 0, free: 0 }
    );

    res.json({ success: true, drives, totalStorage });
  } catch (err) {
    console.error("Get drives error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch drive accounts." });
  }
});

/*
DELETE /api/drives/:driveId
Disconnect a Google Drive account from the user's profile
*/
router.delete("/:driveId", protect, async (req, res) => {
  try {
    const user = req.user;
    const { driveId } = req.params;

    const accountIndex = user.driveAccounts.findIndex(
      (acc) => acc._id.toString() === driveId
    );

    if (accountIndex === -1) {
      return res.status(404).json({ success: false, message: "Drive account not found." });
    }

    const removedEmail = user.driveAccounts[accountIndex].email;
    user.driveAccounts.splice(accountIndex, 1);
    await user.save();

    res.json({ success: true, message: `Drive account ${removedEmail} disconnected.` });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to disconnect drive account." });
  }
});

module.exports = router;
