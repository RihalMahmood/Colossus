package com.example.syncly;

import android.content.Intent;
import android.os.AsyncTask;
import android.os.Bundle;
import android.util.Log;
import android.widget.Button;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;

import com.mongodb.client.MongoCollection;
import org.bson.Document;

import java.util.ArrayList;
import java.util.List;

public class HomeActivity extends AppCompatActivity {

    private Button viewFilesButton, checkStorageButton, addBucketButton, uploadFilesButton, exitButton;
    private String userId;
    private String username;
    private static final String TAG = "HomeActivity";
    private List<String> googleEmails = new ArrayList<>();
    private DriveManager driveManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_home);

        userId = getIntent().getStringExtra("userId");
        username = getIntent().getStringExtra("username");
        String tokenDir = getFilesDir().getAbsolutePath();
        driveManager = DriveManager.getInstance(userId, tokenDir, this);

        //Set up toolbar
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        viewFilesButton = findViewById(R.id.btn_view_files);
        checkStorageButton = findViewById(R.id.btn_check_storage);
        addBucketButton = findViewById(R.id.btn_add_bucket);
        uploadFilesButton = findViewById(R.id.btn_upload_files);
        exitButton = findViewById(R.id.btn_exit);

        viewFilesButton.setOnClickListener(v ->
                new FetchAuthenticatedBucketsTask("view").execute());

        checkStorageButton.setOnClickListener(v -> {
            Intent intent = new Intent(HomeActivity.this, CheckStorageActivity.class);
            intent.putExtra("userId", userId);
            startActivity(intent);
        });

        addBucketButton.setOnClickListener(v -> {
            Intent intent = new Intent(HomeActivity.this, AddBucketActivity.class);
            intent.putExtra("userId", userId);
            startActivity(intent);
        });

        uploadFilesButton.setOnClickListener(v ->
                new FetchAuthenticatedBucketsTask("upload").execute());

        exitButton.setOnClickListener(v -> {
            Toast.makeText(HomeActivity.this, "Logging Out", Toast.LENGTH_SHORT).show();
            Intent intent = new Intent(HomeActivity.this, LoginActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
            finish();
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        refreshBuckets();
    }

    private void refreshBuckets() {
        List<DriveManager.Bucket> buckets = driveManager.getSortedBuckets();
        List<String> emailsLocal = new ArrayList<>();
        for (DriveManager.Bucket bucket : buckets) {
            emailsLocal.add(bucket.getDrive().getAccountEmail());
        }
        Log.d(TAG, "Connected Google Drive accounts: " + emailsLocal);
    }

    private class FetchAuthenticatedBucketsTask extends AsyncTask<Void, Void, List<String>> {
        private final String action;

        FetchAuthenticatedBucketsTask(String action) {
            this.action = action;
        }

        @Override
        protected List<String> doInBackground(Void... params) {
            try {
                //Read driveAccounts[] from the Colossus user document
                MongoCollection<Document> usersCollection = Database.getInstance().getUsersCollection();
                Document userDoc = usersCollection
                        .find(new Document("_id", new org.bson.types.ObjectId(userId)))
                        .first();

                googleEmails.clear();
                if (userDoc != null) {
                    List<Document> driveAccounts = userDoc.getList("driveAccounts", Document.class);
                    if (driveAccounts != null) {
                        for (Document account : driveAccounts) {
                            String email = account.getString("email");
                            if (email != null) googleEmails.add(email);
                        }
                    }
                }
                Log.d(TAG, "Fetched drive accounts for " + action + ": " + googleEmails);
                return new ArrayList<>(googleEmails);
            } catch (Exception e) {
                Log.e(TAG, "Error fetching drive accounts for " + action + ": " + e.toString(), e);
                return new ArrayList<>();
            }
        }

        @Override
        protected void onPostExecute(List<String> emails) {
            if (emails.isEmpty()) {
                Toast.makeText(HomeActivity.this,
                        "No Google Drive accounts connected. Please add one first.",
                        Toast.LENGTH_LONG).show();
                return;
            }

            Intent intent;
            if ("view".equals(action)) {
                intent = new Intent(HomeActivity.this, ViewFilesActivity.class);
            } else {
                intent = new Intent(HomeActivity.this, UploadFilesActivity.class);
            }
            intent.putExtra("userId", userId);
            intent.putStringArrayListExtra("googleAccountEmails", new ArrayList<>(googleEmails));
            startActivity(intent);
        }
    }
}
