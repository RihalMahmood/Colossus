package com.example.syncly;

import android.content.Context;
import android.util.Log;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class GoogleDrive extends Service {
    private static final String TAG = "GoogleDrive";
    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
    private final Context context;
    private Drive driveService;
    private String accountEmail;
    private String driveAccountId;
    private String userId;  //Colossus user _id — needed for token lookup

    public GoogleDrive(Context context) {
        this.context = context;
    }

    public void setAccountEmail(String accountEmail) { this.accountEmail = accountEmail; }
    public String getAccountEmail()                  { return accountEmail; }
    public void setDriveAccountId(String id)         { this.driveAccountId = id; }
    public String getDriveAccountId()                { return driveAccountId; }
    public void setUserId(String userId)             { this.userId = userId; }
    public String getUserId()                        { return userId; }
    public Drive getDriveService()                   { return driveService; }

    /*
    Authenticate using stored tokens from MongoDB via GoogleDriveHelper.
    No longer needs Android account manager — works for any account whose
    tokens are stored in driveAccounts[].
    */
    public void authenticateWithStoredTokens(int bucketNumber, AuthCallback callback) {
        new Thread(() -> {
            try {
                Drive service = GoogleDriveHelper.getDriveService(
                        context, userId, accountEmail);
                if (service != null) {
                    driveService = service;
                    Log.d(TAG, "Authenticated via stored tokens: " + accountEmail);
                    callback.onAuthComplete(driveService);
                } else {
                    callback.onAuthFailed("Could not build Drive service for " + accountEmail);
                }
            } catch (Exception e) {
                Log.e(TAG, "Auth failed for " + accountEmail + ": " + e.getMessage(), e);
                callback.onAuthFailed(e.getMessage());
            }
        }).start();
    }

    @Override
    public void authenticate(int bucketNumber, String userId, AuthCallback callback) {
        this.userId = userId;
        authenticateWithStoredTokens(bucketNumber, callback);
    }

    @Override
    public void checkStorage(StorageCallback callback) {
        if (driveService == null) {
            callback.onCheckFailed("Drive service not initialized.");
            return;
        }
        new Thread(() -> {
            try {
                com.google.api.services.drive.model.About about = driveService.about().get()
                        .setFields("storageQuota").execute();
                long limit = about.getStorageQuota().getLimit() != null
                        ? about.getStorageQuota().getLimit() : Long.MAX_VALUE;
                long usage = about.getStorageQuota().getUsage() != null
                        ? about.getStorageQuota().getUsage() : 0;
                callback.onStorageChecked(new long[]{limit, usage});
            } catch (IOException e) {
                Log.e(TAG, "Error checking storage: " + e.getMessage());
                callback.onCheckFailed(e.getMessage());
            }
        }).start();
    }

    @Override
    public void listFiles(Integer maxResults, String query, ListFilesCallback callback) {
        if (driveService == null) {
            callback.onListFailed("Drive service not initialized.");
            return;
        }
        new Thread(() -> {
            try {
                Drive.Files.List request = driveService.files().list()
                        .setFields("files(id, name, size)")
                        .setSpaces("drive");
                if (query != null && !query.isEmpty()) request.setQ(query);
                if (maxResults != null) request.setPageSize(maxResults);

                List<com.google.api.services.drive.model.File> files =
                        request.execute().getFiles();
                List<Map<String, Object>> fileList = new ArrayList<>();
                for (com.google.api.services.drive.model.File file : files) {
                    Map<String, Object> info = new HashMap<>();
                    info.put("name", file.getName());
                    info.put("size", file.getSize() != null
                            ? file.getSize().toString() : "Unknown");
                    info.put("provider", "GoogleDrive");
                    info.put("id", file.getId());
                    fileList.add(info);
                }
                callback.onFilesListed(fileList);
            } catch (IOException e) {
                Log.e(TAG, "Error listing files: " + e.getMessage());
                callback.onListFailed(e.getMessage());
            }
        }).start();
    }

    public void shutdown() {
        driveService = null;
        Log.d(TAG, "GoogleDrive shutdown: " + accountEmail);
    }
}
