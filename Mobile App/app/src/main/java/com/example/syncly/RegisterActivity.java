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

public class RegisterActivity extends AppCompatActivity {

    private EditText nameInput, emailInput, passwordInput;
    private Button registerButton;
    private ImageView togglePasswordVisibility;
    private boolean isPasswordVisible = false;
    private static final String TAG = "RegisterActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register);

        //Set up toolbar
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        nameInput = findViewById(R.id.name_input_register);
        emailInput = findViewById(R.id.email_input_register);
        passwordInput = findViewById(R.id.password_input);
        registerButton = findViewById(R.id.btn_register);
        togglePasswordVisibility = findViewById(R.id.toggle_password_visibility);

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

        registerButton.setOnClickListener(v -> {
            String name     = nameInput.getText().toString().trim();
            String email    = emailInput.getText().toString().trim();
            String password = passwordInput.getText().toString().trim();

            if (name.isEmpty() || email.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Please fill in all fields", Toast.LENGTH_SHORT).show();
                return;
            }
            if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
                Toast.makeText(this, "Please enter a valid email address", Toast.LENGTH_SHORT).show();
                return;
            }
            if (password.length() < 6) {
                Toast.makeText(this, "Password must be at least 6 characters", Toast.LENGTH_SHORT).show();
                return;
            }

            new RegisterTask().execute(name, email, password);
        });
    }

    private class RegisterTask extends AsyncTask<String, Void, JSONObject> {

        @Override
        protected JSONObject doInBackground(String... params) {
            try {
                // Matches Colossus POST /api/auth/register body: { name, email, password }
                JSONObject body = new JSONObject();
                body.put("name", params[0]);
                body.put("email", params[1]);
                body.put("password", params[2]);
                return ApiClient.post("/api/auth/register", body);
            } catch (Exception e) {
                Log.e(TAG, "Register request failed: " + e.getMessage(), e);
                return null;
            }
        }

        @Override
        protected void onPostExecute(JSONObject response) {
            if (response == null) {
                Toast.makeText(RegisterActivity.this,
                        "Cannot reach server. Check your connection.", Toast.LENGTH_LONG).show();
                return;
            }

            try {
                boolean success = response.optBoolean("success", false);
                if (success) {
                    // Save JWT token and userId from the Colossus response
                    String token  = response.optString("token");
                    JSONObject user = response.optJSONObject("user");
                    String userId = user != null ? user.optString("_id") : null;

                    ApiClient.saveToken(RegisterActivity.this, token);
                    if (userId != null) ApiClient.saveUserId(RegisterActivity.this, userId);

                    Toast.makeText(RegisterActivity.this,
                            "Account created successfully!", Toast.LENGTH_SHORT).show();

                    // Go straight to HomeActivity — user is already logged in
                    Intent intent = new Intent(RegisterActivity.this, HomeActivity.class);
                    intent.putExtra("userId", userId);
                    intent.putExtra("username", user != null ? user.optString("name") : "");
                    intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(intent);
                    finish();
                } else {
                    String message = response.optString("message", "Registration failed.");
                    Toast.makeText(RegisterActivity.this, message, Toast.LENGTH_LONG).show();
                }
            } catch (Exception e) {
                Log.e(TAG, "Failed to parse register response: " + e.getMessage(), e);
                Toast.makeText(RegisterActivity.this,
                        "Unexpected error. Please try again.", Toast.LENGTH_SHORT).show();
            }
        }
    }
}
