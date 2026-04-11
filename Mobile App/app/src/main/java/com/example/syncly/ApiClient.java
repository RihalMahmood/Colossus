package com.example.syncly;

import android.content.Context;
import android.util.Log;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/*
Central HTTP helper for all Colossus REST API calls.
Base URL points to your Colossus backend. Change BASE_URL to your
deployed URL when you move off localhost (e.g. "https://yourserver.com").
For the Android emulator, 10.0.2.2 maps to the host machine's localhost.
For a real device on the same WiFi, use your machine's local IP instead
(e.g. "http://192.168.1.x:5000").
*/
public class ApiClient {
    private static final String TAG = "ApiClient";
    public static final String BASE_URL = "https://hexangularly-undelineable-azaria.ngrok-free.dev";
    private static final String PREFS_NAME = "colossus_prefs";
    private static final String KEY_JWT = "jwt_token";
    private static final String KEY_USER_ID = "user_id";

    //Token storage

    public static void saveToken(Context context, String token) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit().putString(KEY_JWT, token).apply();
    }

    public static String getToken(Context context) {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .getString(KEY_JWT, null);
    }

    public static void saveUserId(Context context, String userId) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit().putString(KEY_USER_ID, userId).apply();
    }

    public static String getUserId(Context context) {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .getString(KEY_USER_ID, null);
    }

    public static void clearSession(Context context) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit().clear().apply();
    }

    //HTTP helpers

    /*POST with a JSON body. No auth header — used for login/register.
    Returns the parsed JSONObject response, or null on failure.*/
    public static JSONObject post(String path, JSONObject body) {
        return request("POST", path, body, null);
    }

    //POST with a JSON body and Bearer token auth.
    public static JSONObject postAuth(Context context, String path, JSONObject body) {
        return request("POST", path, body, getToken(context));
    }

    //GET with Bearer token auth.
    public static JSONObject getAuth(Context context, String path) {
        return request("GET", path, null, getToken(context));
    }

    //Core HTTP request method.
    private static JSONObject request(String method, String path,
                                      JSONObject body, String token) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(BASE_URL + path);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod(method);
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Accept", "application/json");
            conn.setConnectTimeout(15000);
            conn.setReadTimeout(15000);

            if (token != null) {
                conn.setRequestProperty("Authorization", "Bearer " + token);
            }

            if (body != null) {
                conn.setDoOutput(true);
                try (OutputStream os = conn.getOutputStream()) {
                    os.write(body.toString().getBytes("UTF-8"));
                    os.flush();
                }
            }

            int responseCode = conn.getResponseCode();
            boolean isSuccess = responseCode >= 200 && responseCode < 300;

            BufferedReader reader = new BufferedReader(new InputStreamReader(
                    isSuccess ? conn.getInputStream() : conn.getErrorStream()));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);
            reader.close();

            String responseStr = sb.toString();
            Log.d(TAG, method + " " + path + " → " + responseCode + ": " + responseStr);

            return new JSONObject(responseStr);

        } catch (Exception e) {
            Log.e(TAG, "Request failed: " + method + " " + path + " — " + e.getMessage(), e);
            return null;
        } finally {
            if (conn != null) conn.disconnect();
        }
    }
}
