package com.example.syncly;

import android.content.Intent;
import android.os.AsyncTask;
import android.os.Bundle;
import android.util.Log;
import android.widget.Button;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class AddBucketActivity extends AppCompatActivity {
    private static final String TAG = "AddBucketActivity";
    private static final int REQUEST_GOOGLE_DRIVE_ACCOUNT = 1;

    private Button btnGoogleDrive;
    private String userId;
    private DriveManager driveManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_add_bucket);

        //Set up toolbar
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        btnGoogleDrive = findViewById(R.id.btn_drive);

        userId = getIntent().getStringExtra("userId");
        Log.d(TAG, "User ID: " + userId);

        String tokenDir = getFilesDir().getAbsolutePath();
        driveManager = DriveManager.getInstance(userId, tokenDir, this);

        new LoadDrivesTask().execute();

        btnGoogleDrive.setOnClickListener(v -> {
            Intent intent = new Intent(AddBucketActivity.this, GoogleDriveAccountActivity.class);
            intent.putExtra("userId", userId);
            startActivityForResult(intent, REQUEST_GOOGLE_DRIVE_ACCOUNT);
        });
    }

    private class LoadDrivesTask extends AsyncTask<Void, Void, List<Map<String, String>>> {
        @Override
        protected List<Map<String, String>> doInBackground(Void... voids) {
            try {
                List<DriveManager.Bucket> buckets = driveManager.getSortedBuckets();
                List<Map<String, String>> bucketInfo = new ArrayList<>();
                for (DriveManager.Bucket bucket : buckets) {
                    long freeSpace = bucket.getFreeSpace();
                    Map<String, String> info = new HashMap<>();
                    info.put("index", String.valueOf(bucket.getIndex()));
                    info.put("email", bucket.getDrive().getAccountEmail());
                    info.put("freeSpace", formatSize(freeSpace));
                    bucketInfo.add(info);
                }
                return bucketInfo;
            } catch (Exception e) {
                Log.e(TAG, "Error loading drives: " + e.getMessage(), e);
                return null;
            }
        }

        @Override
        protected void onPostExecute(List<Map<String, String>> bucketInfo) {
            if (bucketInfo != null) {
                for (Map<String, String> info : bucketInfo) {
                    Log.d(TAG, "Bucket " + info.get("index")
                            + " (" + info.get("email") + ")"
                            + " free: " + info.get("freeSpace"));
                }
            } else {
                Toast.makeText(AddBucketActivity.this,
                        "Failed to load drives", Toast.LENGTH_SHORT).show();
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == REQUEST_GOOGLE_DRIVE_ACCOUNT && resultCode == RESULT_OK && data != null) {
            String accountEmail = data.getStringExtra("googleAccountEmail");
            Log.d(TAG, "Google Drive connected via backend: " + accountEmail);

            /*The Colossus backend has already:
             - Exchanged the auth code for tokens
             - Stored them inside driveAccounts[] on the user document
             We just need to reload DriveManager so it picks up the new entry from the database.
            */
            driveManager.reloadDrives();
            new LoadDrivesTask().execute();

            Toast.makeText(this,
                    "Google Drive connected: " + accountEmail, Toast.LENGTH_SHORT).show();
        }
    }

    private String formatSize(long bytes) {
        if (bytes < 0) return "Unknown";
        if (bytes < 1024) return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        String pre = "KMGTPE".charAt(exp - 1) + "";
        return String.format("%.1f %sB", bytes / Math.pow(1024, exp), pre);
    }
}
