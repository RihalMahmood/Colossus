package com.example.syncly;

import android.content.Context;
import android.util.Log;

import com.google.api.client.auth.oauth2.BearerToken;
import com.google.api.client.auth.oauth2.ClientParametersAuthentication;
import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.GenericUrl;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;

import com.mongodb.client.MongoCollection;
import org.bson.Document;
import org.bson.types.ObjectId;

import java.util.List;

/*Builds an authenticated Google Drive service using the accessToken and
refreshToken stored directly in the Colossus MongoDB driveAccounts[] array.

This replaces the old GoogleAccountCredential approach which required each
Google account to be manually signed into the Android device/emulator,
and couldn't use tokens obtained via a separate OAuth flow (like the web app).*/
public class GoogleDriveHelper {
    private static final String TAG = "GoogleDriveHelper";
    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();

    private static final String TOKEN_SERVER_URL = "https://oauth2.googleapis.com/token";
    private static final String GOOGLE_CLIENT_ID     = "YOUR_GOOGLE_CLIENT_ID";
    private static final String GOOGLE_CLIENT_SECRET = "YOUR_GOOGLE_CLIENT_SECRET";

    /*Builds a Drive service for the given email by reading its tokens
    directly from the Colossus user's driveAccounts[] in MongoDB.

    @param context      Android context (used to get Database instance)
    @param userId       The Colossus user's _id as a hex string
    @param accountEmail The Google account email to find in driveAccounts[]*/
    public static Drive getDriveService(Context context, String userId, String accountEmail) {
        try {
            if (accountEmail == null || accountEmail.isEmpty()) {
                Log.e(TAG, "accountEmail is null or empty");
                return null;
            }

            //1. Read tokens from MongoDB
            MongoCollection<Document> usersCollection =
                    Database.getInstance().getUsersCollection();

            Document userDoc = usersCollection
                    .find(new Document("_id", new ObjectId(userId)))
                    .first();

            if (userDoc == null) {
                Log.e(TAG, "User not found: " + userId);
                return null;
            }

            List<Document> driveAccounts = userDoc.getList("driveAccounts", Document.class);
            if (driveAccounts == null || driveAccounts.isEmpty()) {
                Log.e(TAG, "No driveAccounts found for user: " + userId);
                return null;
            }

            //Find the driveAccount matching the requested email
            Document driveAccount = null;
            for (Document acc : driveAccounts) {
                if (accountEmail.equals(acc.getString("email"))) {
                    driveAccount = acc;
                    break;
                }
            }

            if (driveAccount == null) {
                Log.e(TAG, "No driveAccount found for email: " + accountEmail);
                return null;
            }

            String accessToken  = driveAccount.getString("accessToken");
            String refreshToken = driveAccount.getString("refreshToken");

            if (accessToken == null || accessToken.isEmpty()) {
                Log.e(TAG, "accessToken is null for: " + accountEmail);
                return null;
            }

            Log.d(TAG, "Building Drive service from stored tokens for: " + accountEmail);

            //2. Build credential from stored tokens
            HttpTransport transport = GoogleNetHttpTransport.newTrustedTransport();

            Credential credential = new Credential.Builder(
                    BearerToken.authorizationHeaderAccessMethod())
                    .setTransport(transport)
                    .setJsonFactory(JSON_FACTORY)
                    .setTokenServerUrl(new GenericUrl(TOKEN_SERVER_URL))
                    .setClientAuthentication(
                            new ClientParametersAuthentication(
                                    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET))
                    .build()
                    .setAccessToken(accessToken)
                    .setRefreshToken(refreshToken);

            //3. Build and return Drive service
            Drive drive = new Drive.Builder(transport, JSON_FACTORY, credential)
                    .setApplicationName("Colossus")
                    .build();

            Log.d(TAG, "Drive service built successfully for: " + accountEmail);
            return drive;

        } catch (Exception e) {
            Log.e(TAG, "Error building Drive service for " + accountEmail
                    + ": " + e.getMessage(), e);
            return null;
        }
    }
}
