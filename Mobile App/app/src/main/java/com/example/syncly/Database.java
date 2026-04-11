package com.example.syncly;

import android.util.Log;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.MongoCollection;
import org.bson.Document;

public class Database {
    private static Database instance;
    private MongoClient client;
    private MongoDatabase database;
    private MongoCollection<Document> usersCollection;
    private MongoCollection<Document> fileMetadataCollection;
    private boolean isInitialized = false;

    private Database() {}

    public static Database getInstance() {
        if (instance == null) {
            synchronized (Database.class) {
                if (instance == null) {
                    instance = new Database();
                }
            }
        }
        return instance;
    }

    public synchronized void initialize() {
        if (isInitialized) return;
        try {
            client = MongoClients.create("mongodb://10.0.2.2:27017/?connectTimeoutMS=30000&socketTimeoutMS=30000");
            //Connect to the same database Colossus web app uses
            database = client.getDatabase("colossus");

            //Colossus collections:
            //"users"         — user accounts with embedded driveAccounts[] array
            //"filemetadatas" — file records with chunk maps (matches Mongoose model name)
            usersCollection = database.getCollection("users");
            fileMetadataCollection = database.getCollection("filemetadatas");

            Document ping = new Document("ping", 1);
            Document result = database.runCommand(ping);
            Log.d("Database", "Connected to Colossus MongoDB successfully. Ping result: " + result.toJson());
            isInitialized = true;
        } catch (Exception e) {
            Log.e("Database", "Failed to connect to MongoDB: " + e.getMessage(), e);
            isInitialized = false;
            throw e;
        }
    }

    public boolean isInitialized() {
        return isInitialized;
    }

    public MongoCollection<Document> getUsersCollection() {
        if (!isInitialized) initialize();
        return usersCollection;
    }

    public MongoCollection<Document> getFileMetadataCollection() {
        if (!isInitialized) initialize();
        return fileMetadataCollection;
    }

    public void closeConnection() {
        if (client != null) {
            client.close();
            Log.d("Database", "MongoDB connection closed.");
            isInitialized = false;
        }
    }
}
