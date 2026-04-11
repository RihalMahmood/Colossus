package com.example.syncly;

import android.content.Intent;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Bundle;
import android.util.Log;
import android.widget.Button;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;

import org.json.JSONObject;

public class GoogleDriveAccountActivity extends AppCompatActivity {
    private static final String TAG = "GoogleDriveAccountActivity";
    private static final String DEEP_LINK_SCHEME = "colossus";
    private static final String DEEP_LINK_HOST   = "drive-callback";

    private Button btnChooseAccount;
    private boolean oauthStarted = false;
    private boolean handled = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_google_drive_account);
        //Set up toolbar
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        btnChooseAccount = findViewById(R.id.btn_choose_account);
        btnChooseAccount.setOnClickListener(v -> new FetchOAuthUrlTask().execute());
    }

    private class FetchOAuthUrlTask extends AsyncTask<Void, Void, String> {
        @Override
        protected String doInBackground(Void... voids) {
            //Pass source=mobile so the backend redirects to the deep link
            //instead of the web frontend URL after OAuth completes
            JSONObject response = ApiClient.getAuth(
                    GoogleDriveAccountActivity.this,
                    "/api/drives/connect?source=mobile");
            if (response == null) return null;
            if (!response.optBoolean("success", false)) {
                Log.e(TAG, "Backend error: " + response.optString("message"));
                return null;
            }
            return response.optString("url", null);
        }

        @Override
        protected void onPostExecute(String oauthUrl) {
            if (oauthUrl == null || oauthUrl.isEmpty()) {
                Toast.makeText(GoogleDriveAccountActivity.this,
                        "Failed to get OAuth URL. Is the backend running?",
                        Toast.LENGTH_LONG).show();
                return;
            }
            Log.d(TAG, "Opening OAuth URL in browser");
            oauthStarted = true;
            startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(oauthUrl)));
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (oauthStarted && !handled) handleDeepLink(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (!handled) handleDeepLink(intent);
    }

    private void handleDeepLink(Intent intent) {
        if (intent == null || intent.getData() == null) return;

        Uri uri = intent.getData();
        if (!DEEP_LINK_SCHEME.equals(uri.getScheme()) ||
                !DEEP_LINK_HOST.equals(uri.getHost())) return;

        handled = true;
        Log.d(TAG, "Deep link received: " + uri);

        String driveError     = uri.getQueryParameter("drive_error");
        String driveConnected = uri.getQueryParameter("drive_connected");
        String email          = uri.getQueryParameter("email");

        if (driveError != null) {
            String message;
            switch (driveError) {
                case "already_connected":
                    message = "This account is already connected: " + email; break;
                case "csrf_mismatch":
                    message = "Security check failed. Please try again."; break;
                case "access_denied":
                    message = "Access denied. Please grant Drive permissions."; break;
                default:
                    message = "Failed to connect Google Drive: " + driveError;
            }
            Toast.makeText(this, message, Toast.LENGTH_LONG).show();
            setResult(RESULT_CANCELED);
            finish();
            return;
        }

        if ("true".equals(driveConnected)) {
            Log.d(TAG, "Drive connected successfully: " + email);
            Intent result = new Intent();
            result.putExtra("googleAccountEmail", email);
            setResult(RESULT_OK, result);
            finish();
        }
    }
}
