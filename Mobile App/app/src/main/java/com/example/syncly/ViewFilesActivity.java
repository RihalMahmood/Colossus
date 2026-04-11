package com.example.syncly;

import android.content.Intent;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Bundle;
import android.util.Log;
import android.widget.Button;

import androidx.appcompat.widget.Toolbar;
import androidx.recyclerview.widget.RecyclerView;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.appcompat.widget.SearchView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.model.File;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;

public class ViewFilesActivity extends AppCompatActivity {
    private static final String TAG = "ViewFilesActivity";
    private RecyclerView recyclerViewFiles;
    private Button btnRefresh;
    private String userId;
    private DriveManager driveManager;
    private SearchView searchView;
    private FileListAdapter adapter;
    private List<Map<String, String>> fileList = new ArrayList<>();

    private void filterFiles(String query) {
        List<Map<String, String>> filteredList = new ArrayList<>();
        for (Map<String, String> file : fileList) {
            String name = file.get("name");
            if (name != null && name.toLowerCase().contains(query.toLowerCase())) {
                filteredList.add(file);
            }
        }
        adapter = new FileListAdapter(ViewFilesActivity.this, filteredList, (url, name) -> {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            startActivity(intent);
        });
        recyclerViewFiles.setAdapter(adapter);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_view_files);

        recyclerViewFiles = findViewById(R.id.recycler_view_files);
        recyclerViewFiles.setLayoutManager(new LinearLayoutManager(this));

        //Set up toolbar
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        searchView = findViewById(R.id.search_view);
        adapter = new FileListAdapter(ViewFilesActivity.this, new ArrayList<>(), (url, name) -> {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            startActivity(intent);
        });
        recyclerViewFiles.setAdapter(adapter);

        btnRefresh = findViewById(R.id.btn_refresh);

        userId = getIntent().getStringExtra("userId");
        Log.d(TAG, "Retrieved userId from intent: " + userId);

        String tokenDir = getFilesDir().getAbsolutePath();
        driveManager = DriveManager.getInstance(userId, tokenDir, this);

        btnRefresh.setOnClickListener(v -> {
            Toast.makeText(this, "Refreshing file list...", Toast.LENGTH_SHORT).show();
            new ListFilesTask().execute();
        });

        new CheckDrivesTask().execute();

        searchView.setOnQueryTextListener(new SearchView.OnQueryTextListener() {
            @Override
            public boolean onQueryTextSubmit(String query) {
                return false;
            }

            @Override
            public boolean onQueryTextChange(String newText) {
                filterFiles(newText);
                return true;
            }
        });
    }

    private class CheckDrivesTask extends AsyncTask<Void, Void, Boolean> {
        @Override
        protected Boolean doInBackground(Void... voids) {
            long startTime = System.currentTimeMillis();
            List<DriveManager.Bucket> buckets = driveManager.getSortedBuckets();
            while (buckets.isEmpty() && (System.currentTimeMillis() - startTime < 15000)) {
                try {
                    Thread.sleep(500);
                    buckets = driveManager.getSortedBuckets();
                    Log.d(TAG, "Waiting for buckets... size: " + buckets.size());
                } catch (InterruptedException e) {
                    Log.e(TAG, "Interrupted while waiting for drives: " + e.getMessage());
                    return false;
                }
            }
            return !buckets.isEmpty();
        }

        @Override
        protected void onPostExecute(Boolean hasDrives) {
            if (hasDrives) {
                new ListFilesTask().execute();
            } else {
                Toast.makeText(ViewFilesActivity.this,
                        "No Google Drive accounts linked. Please add one from the home screen.",
                        Toast.LENGTH_LONG).show();
                finish();
            }
        }
    }

    private class ListFilesTask extends AsyncTask<Void, Void, List<Map<String, String>>> {
        @Override
        protected List<Map<String, String>> doInBackground(Void... voids) {
            List<Map<String, String>> result = new ArrayList<>();
            List<DriveManager.Bucket> buckets = driveManager.getSortedBuckets();
            Log.d(TAG, "Listing files from " + buckets.size() + " Google Drive bucket(s).");

            CountDownLatch latch = new CountDownLatch(buckets.size());

            for (DriveManager.Bucket bucket : buckets) {
                GoogleDrive googleDrive = bucket.getDrive();
                int bucketIndex = bucket.getIndex();

                googleDrive.authenticate(bucketIndex, userId, new Service.AuthCallback() {
                    @Override
                    public void onAuthComplete(Object r) {
                        Log.d(TAG, "Authenticated bucket " + bucketIndex
                                + ": " + googleDrive.getAccountEmail());
                        listGoogleDriveFiles(googleDrive.getAccountEmail(), result);
                        latch.countDown();
                    }
                    @Override
                    public void onAuthFailed(String error) {
                        Log.e(TAG, "Auth failed for bucket " + bucketIndex + ": " + error);
                        latch.countDown();
                    }
                });
            }

            try {
                latch.await();
                Log.d(TAG, "All authentications done. Files found: " + result.size());
            } catch (InterruptedException e) {
                Log.e(TAG, "Interrupted waiting for auth: " + e.getMessage());
            }

            return result;
        }

        private void listGoogleDriveFiles(String email, List<Map<String, String>> result) {
            Drive googleDriveService = GoogleDriveHelper.getDriveService(ViewFilesActivity.this, userId, email);
            if (googleDriveService == null) {
                Log.e(TAG, "Drive service null for " + email);
                return;
            }

            try {
                Drive.Files.List request = googleDriveService.files().list()
                        .setFields("nextPageToken, files(id, name, size)")
                        .setSpaces("drive")
                        .setPageSize(1000);

                int totalFiles = 0;
                do {
                    com.google.api.services.drive.model.FileList fileListResult = request.execute();
                    List<File> files = fileListResult.getFiles();
                    if (files != null) {
                        synchronized (result) {
                            for (File file : files) {
                                Map<String, String> fileInfo = new HashMap<>();
                                fileInfo.put("name", file.getName());
                                fileInfo.put("size", file.getSize() != null
                                        ? formatSize(file.getSize()) : "Unknown");
                                fileInfo.put("provider", "Google Drive (" + email + ")");
                                fileInfo.put("url", "https://drive.google.com/file/d/"
                                        + file.getId() + "/view");
                                result.add(fileInfo);
                            }
                        }
                        totalFiles += files.size();
                    }
                    request.setPageToken(fileListResult.getNextPageToken());
                } while (request.getPageToken() != null && !request.getPageToken().isEmpty());

                Log.d(TAG, "Listed " + totalFiles + " files from " + email);
            } catch (IOException e) {
                Log.e(TAG, "Failed to list files for " + email + ": " + e.getMessage());
            }
        }

        @Override
        protected void onPostExecute(List<Map<String, String>> resultList) {
            if (resultList.isEmpty()) {
                Toast.makeText(ViewFilesActivity.this,
                        "No files found.", Toast.LENGTH_LONG).show();
                return;
            }

            fileList = resultList;
            filterFiles(searchView.getQuery().toString());

            FileListAdapter newAdapter = new FileListAdapter(ViewFilesActivity.this, fileList,
                    (url, name) -> {
                        try {
                            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                            startActivity(intent);
                        } catch (Exception e) {
                            Toast.makeText(ViewFilesActivity.this,
                                    "Unable to open file: " + name, Toast.LENGTH_SHORT).show();
                        }
                    });
            recyclerViewFiles.setAdapter(newAdapter);
            Toast.makeText(ViewFilesActivity.this,
                    "Listed " + fileList.size() + " files.", Toast.LENGTH_SHORT).show();
        }
    }

    private String formatSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        String pre = "KMGTPE".charAt(exp - 1) + "";
        return String.format("%.1f %sB", bytes / Math.pow(1024, exp), pre);
    }
}
