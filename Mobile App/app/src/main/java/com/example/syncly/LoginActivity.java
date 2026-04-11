package com.example.syncly;

import android.content.Intent;
import android.os.AsyncTask;
import android.os.Bundle;
import android.text.method.HideReturnsTransformationMethod;
import android.text.method.PasswordTransformationMethod;
import android.util.Log;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;

import org.json.JSONObject;

public class LoginActivity extends AppCompatActivity {

    private EditText emailInput, passwordInput;
    private ImageView togglePasswordVisibility;
    private Button loginButton, registerButton;
    private boolean isPasswordVisible = false;
    private static final String TAG = "LoginActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        //Set up toolbar
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        emailInput = findViewById(R.id.email_input);
        passwordInput = findViewById(R.id.password_input);
        togglePasswordVisibility = findViewById(R.id.toggle_password_visibility);
        loginButton = findViewById(R.id.btn_login);
        registerButton = findViewById(R.id.btn_register);

        togglePasswordVisibility.setOnClickListener(v -> {
            if (isPasswordVisible) {
                passwordInput.setTransformationMethod(PasswordTransformationMethod.getInstance());
                togglePasswordVisibility.setImageResource(R.drawable.ic_visibility_off);
            } else {
                passwordInput.setTransformationMethod(HideReturnsTransformationMethod.getInstance());
                togglePasswordVisibility.setImageResource(R.drawable.ic_visibility);
            }
            isPasswordVisible = !isPasswordVisible;
            passwordInput.setSelection(passwordInput.getText().length());
        });

        loginButton.setOnClickListener(v -> {
            String email    = emailInput.getText().toString().trim();
            String password = passwordInput.getText().toString().trim();

            if (email.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Please enter your email and password",
                        Toast.LENGTH_SHORT).show();
                return;
            }

            new LoginTask().execute(email, password);
        });

        registerButton.setOnClickListener(v -> {
            startActivity(new Intent(LoginActivity.this, RegisterActivity.class));
        });
    }

    private class LoginTask extends AsyncTask<String, Void, JSONObject> {

        @Override
        protected JSONObject doInBackground(String... params) {
            try {
                // Matches Colossus POST /api/auth/login body: { email, password }
                JSONObject body = new JSONObject();
                body.put("email", params[0]);
                body.put("password", params[1]);
                return ApiClient.post("/api/auth/login", body);
            } catch (Exception e) {
                Log.e(TAG, "Login request failed: " + e.getMessage(), e);
                return null;
            }
        }

        @Override
        protected void onPostExecute(JSONObject response) {
            if (response == null) {
                Toast.makeText(LoginActivity.this,
                        "Cannot reach server. Check your connection.", Toast.LENGTH_LONG).show();
                return;
            }

            try {
                boolean success = response.optBoolean("success", false);
                if (success) {
                    // Save JWT and userId — same session system as the web app
                    String token    = response.optString("token");
                    JSONObject user = response.optJSONObject("user");
                    String userId   = user != null ? user.optString("_id") : null;
                    String name     = user != null ? user.optString("name") : "";

                    ApiClient.saveToken(LoginActivity.this, token);
                    if (userId != null) ApiClient.saveUserId(LoginActivity.this, userId);

                    Toast.makeText(LoginActivity.this,
                            "Welcome back, " + name + "!", Toast.LENGTH_SHORT).show();

                    Intent intent = new Intent(LoginActivity.this, HomeActivity.class);
                    intent.putExtra("userId", userId);
                    intent.putExtra("username", name);
                    intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(intent);
                    finish();
                } else {
                    String message = response.optString("message", "Login failed.");
                    Toast.makeText(LoginActivity.this, message, Toast.LENGTH_LONG).show();
                }
            } catch (Exception e) {
                Log.e(TAG, "Failed to parse login response: " + e.getMessage(), e);
                Toast.makeText(LoginActivity.this,
                        "Unexpected error. Please try again.", Toast.LENGTH_SHORT).show();
            }
        }
    }
}
