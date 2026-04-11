package com.example.syncly;

import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.util.Log;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;

import com.google.api.client.http.InputStreamContent;
import com.google.api.services.drive.Drive;

import org.bson.Document;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class UploadFilesActivity extends AppCompatActivity {
    private static final String TAG = "UploadFilesActivity";
    private static final int REQUEST_FILE_PICK = 1;

    private Button btnSelectFile, btnUpload;
    private TextView tvSelectedFile;
    private String userId;
    private DriveManager driveManager;
    private Uri selectedFileUri;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_upload_files);

        //Set up toolbar
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        btnSelectFile = findViewById(R.id.btn_select_file);
        btnUpload = findViewById(R.id.btn_upload);
        tvSelectedFile = findViewById(R.id.tv_selected_file);

        userId = getIntent().getStringExtra("userId");
        Log.d(TAG, "Retrieved userId from intent: " + userId);

        String tokenDir = getFilesDir().getAbsolutePath();
        driveManager = DriveManager.getInstance(userId, tokenDir, this);

        btnSelectFile.setOnClickListener(v -> {
            Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
            intent.setType("*/*");
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            startActivityForResult(Intent.createChooser(intent, "Select a file"), REQUEST_FILE_PICK);
        });

        btnUpload.setOnClickListener(v -> {
            if (selectedFileUri == null) {
                Toast.makeText(this, "Please select a file first!", Toast.LENGTH_SHORT).show();
                return;
            }
            new CalculateFreeSpaceTask().execute();
        });
    }

    //Calculate free space across all Google Drive buckets, then pick the best one
    private class CalculateFreeSpaceTask extends AsyncTask<Void, Void, DriveManager.Bucket> {
        @Override
        protected DriveManager.Bucket doInBackground(Void... voids) {
            try {
                List<DriveManager.Bucket> buckets = driveManager.getSortedBuckets();
                DriveManager.Bucket bestBucket = null;
                long maxFree = 0;

                for (DriveManager.Bucket bucket : buckets) {
                    long freeSpace = bucket.getFreeSpace();
                    if (freeSpace > maxFree) {
                        maxFree = freeSpace;
                        bestBucket = bucket;
                    }
                }
                return bestBucket;
            } catch (Exception e) {
                Log.e(TAG, "Failed to calculate free space: " + e.getMessage(), e);
                return null;
            }
        }

        @Override
        protected void onPostExecute(DriveManager.Bucket bestBucket) {
            if (bestBucket == null) {
                Toast.makeText(UploadFilesActivity.this,
                        "No Google Drive accounts connected or no free space available.",
                        Toast.LENGTH_LONG).show();
                return;
            }
            Toast.makeText(UploadFilesActivity.this,
                    "Uploading to " + bestBucket.getDrive().getAccountEmail() + "...",
                    Toast.LENGTH_SHORT).show();
            new UploadFileTask(bestBucket).execute(selectedFileUri);
        }
    }

    private class UploadFileTask extends AsyncTask<Uri, Void, Boolean> {
        private final DriveManager.Bucket targetBucket;

        UploadFileTask(DriveManager.Bucket targetBucket) {
            this.targetBucket = targetBucket;
        }

        @Override
        protected Boolean doInBackground(Uri... uris) {
            Uri uri = uris[0];
            try {
                File file = convertUriToFile(uri);
                long fileSize = file.length();
                String fileName = getFileName(uri);
                String mimeType = getContentResolver().getType(uri);
                if (mimeType == null) mimeType = "application/octet-stream";

                //Verify this bucket has enough space
                long freeSpace = targetBucket.getFreeSpace();
                if (freeSpace < fileSize) {
                    Log.e(TAG, "Not enough space. Need: " + fileSize + ", Have: " + freeSpace);
                    return false;
                }

                //Authenticate if needed
                authenticateIfNeeded(targetBucket.getDrive(), targetBucket.getIndex());

                //Upload to Google Drive
                Drive driveService = GoogleDriveHelper.getDriveService(
                        UploadFilesActivity.this,
                        userId,
                        targetBucket.getDrive().getAccountEmail());

                if (driveService == null) {
                    Log.e(TAG, "Drive service null for " + targetBucket.getDrive().getAccountEmail());
                    return false;
                }

                com.google.api.services.drive.model.File fileMetadata =
                        new com.google.api.services.drive.model.File();
                fileMetadata.setName(fileName);

                try (InputStream inputStream = getContentResolver().openInputStream(selectedFileUri)) {
                    InputStreamContent mediaContent = new InputStreamContent(mimeType, inputStream);
                    com.google.api.services.drive.model.File uploadedFile =
                            driveService.files().create(fileMetadata, mediaContent).execute();

                    //Save metadata to Colossus filemetadatas collection
                    Document metadata = new Document("owner", userId)
                            .append("name", fileName)
                            .append("mimeType", mimeType)
                            .append("totalSize", fileSize)
                            .append("isChunked", false)
                            .append("singleDriveAccountEmail", targetBucket.getDrive().getAccountEmail())
                            .append("singleGoogleFileId", uploadedFile.getId())
                            .append("path", "/")
                            .append("deleted", false);

                    Database.getInstance().getFileMetadataCollection().insertOne(metadata);
                    Log.d(TAG, "Uploaded file and saved metadata: " + fileName);
                }

                return true;
            } catch (Exception e) {
                Log.e(TAG, "Upload failed: " + e.getMessage(), e);
                return false;
            }
        }

        private void authenticateIfNeeded(GoogleDrive drive, int bucketNumber) throws InterruptedException {
            if (drive.getDriveService() == null) {
                drive.authenticate(bucketNumber, userId, new Service.AuthCallback() {
                    @Override
                    public void onAuthComplete(Object result) {
                        Log.d(TAG, "Google Drive authenticated: " + drive.getAccountEmail());
                    }
                    @Override
                    public void onAuthFailed(String error) {
                        Log.e(TAG, "Google Drive auth failed: " + error);
                    }
                });
                Thread.sleep(1000);
            }
        }

        private File convertUriToFile(Uri uri) throws Exception {
            File file = new File(getCacheDir(), getFileName(uri));
            try (InputStream inputStream = getContentResolver().openInputStream(uri);
                 FileOutputStream outputStream = new FileOutputStream(file)) {
                byte[] buffer = new byte[4096];
                int bytesRead;
                while ((bytesRead = inputStream.read(buffer)) != -1) {
                    outputStream.write(buffer, 0, bytesRead);
                }
            }
            return file;
        }

        private String getFileName(Uri uri) {
            String fileName = "uploaded_file";
            try (Cursor cursor = getContentResolver().query(uri, null, null, null, null)) {
                if (cursor != null && cursor.moveToFirst()) {
                    int nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                    if (nameIndex != -1) fileName = cursor.getString(nameIndex);
                }
            } catch (Exception e) {
                Log.e(TAG, "Failed to get file name: " + e.getMessage());
            }
            return fileName;
        }

        @Override
        protected void onPostExecute(Boolean success) {
            if (success) {
                Toast.makeText(UploadFilesActivity.this,
                        "Upload successful!", Toast.LENGTH_SHORT).show();
            } else {
                Toast.makeText(UploadFilesActivity.this,
                        "Upload failed. Check storage space.", Toast.LENGTH_SHORT).show();
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_FILE_PICK && resultCode == RESULT_OK && data != null) {
            selectedFileUri = data.getData();
            tvSelectedFile.setText("Selected: " + selectedFileUri.getLastPathSegment());
            Log.d(TAG, "File selected: " + selectedFileUri);
        }
    }
}
