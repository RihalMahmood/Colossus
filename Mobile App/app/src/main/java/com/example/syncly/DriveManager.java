package com.example.syncly;

import android.content.Context;
import android.util.Log;
import com.mongodb.client.MongoCollection;
import org.bson.Document;
import org.bson.types.ObjectId;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class DriveManager {
    private static final String TAG = "DriveManager";
    private static DriveManager instance;
    private final ObjectId userId;
    private final String tokenDir;
    private final Context context;
    private final List<Bucket> buckets = Collections.synchronizedList(new ArrayList<>());
    private final ExecutorService executorService = Executors.newSingleThreadExecutor();
    private final Database db = Database.getInstance();
    private CountDownLatch initialLoadLatch = new CountDownLatch(1);

    private DriveManager(String userId, String tokenDir, Context context) {
        this.userId = new ObjectId(userId);
        this.tokenDir = tokenDir;
        this.context = context;
        loadUserDrives();
    }

    public static synchronized DriveManager getInstance(String userId, String tokenDir,
                                                        Context context) {
        if (instance == null || !instance.userId.toString().equals(userId)) {
            instance = new DriveManager(userId, tokenDir, context);
        }
        return instance;
    }

    public void reloadDrives() {
        initialLoadLatch = new CountDownLatch(1);
        loadUserDrives();
    }

    private void loadUserDrives() {
        executorService.submit(() -> {
            try {
                MongoCollection<Document> usersCollection = db.getUsersCollection();
                Document userDoc = usersCollection
                        .find(new Document("_id", userId))
                        .first();

                if (userDoc == null) {
                    Log.e(TAG, "User not found: " + userId);
                    return;
                }

                List<Document> driveAccounts =
                        userDoc.getList("driveAccounts", Document.class);
                if (driveAccounts == null) driveAccounts = new ArrayList<>();

                Log.d(TAG, "Found " + driveAccounts.size()
                        + " driveAccounts for user " + userId);
                buckets.clear();

                int bucketNumber = 1;
                for (Document driveAccount : driveAccounts) {
                    String accountEmail = driveAccount.getString("email");
                    if (accountEmail == null || accountEmail.isEmpty()) continue;

                    GoogleDrive googleDrive = new GoogleDrive(context);
                    googleDrive.setAccountEmail(accountEmail);
                    googleDrive.setDriveAccountId(
                            driveAccount.getObjectId("_id").toHexString());
                    //Pass userId so GoogleDriveHelper can look up tokens from MongoDB
                    googleDrive.setUserId(userId.toHexString());

                    Log.d(TAG, "Loaded drive: " + accountEmail
                            + " (Bucket " + bucketNumber + ")");
                    buckets.add(new Bucket(googleDrive, bucketNumber, context,
                            userId.toHexString()));
                    bucketNumber++;
                }

                Log.d(TAG, "Finished loading " + buckets.size() + " drives.");
            } catch (Exception e) {
                Log.e(TAG, "Failed to load drives: " + e.getMessage(), e);
            } finally {
                initialLoadLatch.countDown();
            }
        });
    }

    public List<Bucket> getSortedBuckets() {
        try {
            initialLoadLatch.await();
        } catch (InterruptedException e) {
            Log.e(TAG, "Interrupted waiting for initial load", e);
        }
        synchronized (buckets) {
            List<Bucket> sorted = new ArrayList<>(buckets);
            Collections.sort(sorted, (a, b) -> Integer.compare(a.getIndex(), b.getIndex()));
            return sorted;
        }
    }

    //Bucket

    public static class Bucket {
        private final GoogleDrive drive;
        private final int index;
        private final Context context;
        private final String userId;
        private static final long DEFAULT_TOTAL = 15L * 1024 * 1024 * 1024; // 15 GB

        Bucket(GoogleDrive drive, int index, Context context, String userId) {
            this.drive   = drive;
            this.index   = index;
            this.context = context;
            this.userId  = userId;
        }

        public GoogleDrive getDrive() { return drive; }
        public int getIndex()         { return index; }

        public long getFreeSpace() {
            //Use stored tokens via GoogleDriveHelper — no Android account manager needed
            com.google.api.services.drive.Drive service =
                    GoogleDriveHelper.getDriveService(context, userId, drive.getAccountEmail());
            if (service == null) {
                Log.e(TAG, "getDriveService() returned null for " + drive.getAccountEmail());
                return -1;
            }
            try {
                com.google.api.services.drive.model.About about = service.about().get()
                        .setFields("storageQuota").execute();
                long limit = about.getStorageQuota().getLimit() != null
                        ? about.getStorageQuota().getLimit() : Long.MAX_VALUE;
                long usage = about.getStorageQuota().getUsage() != null
                        ? about.getStorageQuota().getUsage() : 0;
                return limit - usage;
            } catch (Exception e) {
                Log.e(TAG, "getFreeSpace failed for " + drive.getAccountEmail()
                        + ": " + e.getMessage());
                return -1;
            }
        }

        public long getTotalSpace() {
            com.google.api.services.drive.Drive service =
                    GoogleDriveHelper.getDriveService(context, userId, drive.getAccountEmail());
            if (service == null) return DEFAULT_TOTAL;
            try {
                com.google.api.services.drive.model.About about = service.about().get()
                        .setFields("storageQuota").execute();
                Long limit = about.getStorageQuota().getLimit();
                return (limit != null && limit > 0) ? limit : DEFAULT_TOTAL;
            } catch (Exception e) {
                Log.e(TAG, "getTotalSpace failed for " + drive.getAccountEmail()
                        + ": " + e.getMessage());
                return DEFAULT_TOTAL;
            }
        }
    }
}
