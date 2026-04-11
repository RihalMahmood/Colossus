package com.example.syncly;

import android.os.AsyncTask;
import android.os.Bundle;
import android.util.Log;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class CheckStorageActivity extends AppCompatActivity {
    private static final String TAG = "CheckStorageActivity";
    private ProgressBar pbCombinedStorage;
    private TextView tvStorageBreakdown;
    private TextView tvStorageSummary;
    private String userId;
    private DriveManager driveManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_check_storage);

        //Set up toolbar
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        pbCombinedStorage  = findViewById(R.id.pb_combined_storage);
        tvStorageBreakdown = findViewById(R.id.tv_storage_breakdown);
        tvStorageSummary   = findViewById(R.id.tv_storage_summary);

        userId = getIntent().getStringExtra("userId");
        if (userId == null) {
            Log.e(TAG, "userId is null");
            Toast.makeText(this, "Error: User ID not found", Toast.LENGTH_LONG).show();
            finish();
            return;
        }

        driveManager = DriveManager.getInstance(userId, getFilesDir().getAbsolutePath(), this);
        new CheckStorageTask().execute();
    }

    private class CheckStorageTask extends AsyncTask<Void, Void, Boolean> {
        //email -> free space in bytes
        private final Map<String, Long> emailFreeSpace = new LinkedHashMap<>();
        private long combinedTotal = 0L;
        private long combinedFree  = 0L;

        @Override
        protected Boolean doInBackground(Void... voids) {
            try {
                List<DriveManager.Bucket> buckets = driveManager.getSortedBuckets();

                for (DriveManager.Bucket bucket : buckets) {
                    String email      = bucket.getDrive().getAccountEmail();
                    long freeSpace    = bucket.getFreeSpace();
                    long totalSpace   = bucket.getTotalSpace();

                    if (freeSpace < 0 || totalSpace < 0) {
                        Log.w(TAG, "Skipping " + email
                                + ": invalid space data (free=" + freeSpace
                                + ", total=" + totalSpace + ")");
                        continue;
                    }

                    emailFreeSpace.put(email, freeSpace);
                    combinedTotal += totalSpace;
                    combinedFree  += freeSpace;
                }

                return !emailFreeSpace.isEmpty();
            } catch (Exception e) {
                Log.e(TAG, "Failed to check storage: " + e.getMessage(), e);
                return false;
            }
        }

        @Override
        protected void onPostExecute(Boolean success) {
            if (!success) {
                Toast.makeText(CheckStorageActivity.this,
                        "No storage buckets available.", Toast.LENGTH_LONG).show();
                tvStorageBreakdown.setText("No drives connected.");
                pbCombinedStorage.setProgress(0);
                if (tvStorageSummary != null) tvStorageSummary.setText("0 GB / 0 GB used");
                return;
            }

            //Progress bar
            if (combinedTotal > 0) {
                long used    = combinedTotal - combinedFree;
                int progress = (int) ((used * 100L) / combinedTotal);
                pbCombinedStorage.setProgress(progress);

                if (tvStorageSummary != null) {
                    double totalGB = combinedTotal / (1024.0 * 1024 * 1024);
                    double usedGB  = used          / (1024.0 * 1024 * 1024);
                    tvStorageSummary.setText(
                            String.format("%.2f GB / %.2f GB used", usedGB, totalGB));
                }
            } else {
                pbCombinedStorage.setProgress(0);
                if (tvStorageSummary != null) tvStorageSummary.setText("0 GB / 0 GB used");
            }

            //Per-account breakdown — show email instead of "Google Drive #N"
            StringBuilder breakdown = new StringBuilder("Available Drive Space:\n\n");
            for (Map.Entry<String, Long> entry : emailFreeSpace.entrySet()) {
                double freeGB = entry.getValue() / (1024.0 * 1024 * 1024);
                breakdown.append(String.format("%s\n  %.2f GB free\n\n",
                        entry.getKey(), freeGB));
            }
            tvStorageBreakdown.setText(breakdown.toString().trim());
        }
    }
}
