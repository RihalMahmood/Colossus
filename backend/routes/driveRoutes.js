const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getAuthUrl,
  exchangeCodeForTokens,
  getGoogleUserInfo,
  getDriveQuota,
} = require("../utils/googleDrive");

/*GET /api/drives/connect
Generates the Google OAuth URL to add a new Drive account.
The user will be redirected to Google to grant permissions*/
router.get("/connect", protect, (req, res) => {
  try {
    const url = getAuthUrl(req.user._id);
    res.json({ success: true, url });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to generate OAuth URL." });
  }
});

/*GET /api/drives/oauth/callback
Google redirects here after the user grants permission.
Exchanges code for tokens, fetches user info, saves to DB.
Then redirects to frontend with success/failure indication.*/
router.get("/oauth/callback", async (req, res) => {
  const { code, state: userId, error } = req.query;

  if (error || !code) {
    return res.redirect(`${process.env.CLIENT_URL}/dashboard?drive_error=access_denied`);
  }

  try {
    //Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    //Get Google user info for this account
    const googleUser = await getGoogleUserInfo(tokens);

    //Find the platform user from state param
    const User = require("../models/User");
    const user = await User.findById(userId);

    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL}/dashboard?drive_error=user_not_found`);
    }

    //Check if this Google account is already connected
    const alreadyConnected = user.driveAccounts.some(
      (acc) => acc.email === googleUser.email
    );

    if (alreadyConnected) {
      return res.redirect(`${process.env.CLIENT_URL}/dashboard?drive_error=already_connected&email=${googleUser.email}`);
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

    res.redirect(`${process.env.CLIENT_URL}/dashboard?drive_connected=true&email=${googleUser.email}`);
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.redirect(`${process.env.CLIENT_URL}/dashboard?drive_error=server_error`);
  }
});

/*GET /api/drives
Returns all connected drive accounts for the current user (with quota info)*/
router.get("/", protect, async (req, res) => {
  try {
    const user = req.user;

    if (!user.driveAccounts || user.driveAccounts.length === 0) {
      return res.json({ success: true, drives: [], totalStorage: { total: 0, used: 0, free: 0 } });
    }

    //Fetch quota for each drive in parallel
    const driveQuotas = await Promise.all(
      user.driveAccounts.map((account) => getDriveQuota(account, user))
    );

    //Build drive list with metadata
    const drives = user.driveAccounts.map((account, idx) => ({
      _id: account._id,
      email: account.email,
      displayName: account.displayName,
      picture: account.picture,
      addedAt: account.addedAt,
      quota: driveQuotas[idx],
    }));

    /*Calculate combined totals
    .reduce to sum up total, used, and free storage across all drives*/
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

/*DELETE /api/drives/:driveId
Disconnect a Google Drive account from the user's profile*/
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
