const express = require("express");
const router = express.Router();
const https = require("https");
const { Readable } = require("stream");
const { protect } = require("../middleware/authMiddleware");
//Use the shared getDriveClient from googleDrive.js which has debounced save.
const { getDriveClient } = require("../utils/googleDrive");

//Helpers

/*Find a driveAccount subdocument by _id from req.user.driveAccounts
Throws a structured error if not found (caught by sendError)*/
function getOwnedDrive(user, driveId) {
  const drive = user.driveAccounts.id(driveId);
  if (!drive) throw { status: 404, message: "Drive not found or access denied" };
  return drive;
}

/*Google Workspace mime types → Office export mime types.
Used for both viewing and downloading Docs/Sheets/Slides*/
const EXPORT_MAP = {
  "application/vnd.google-apps.document":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.google-apps.spreadsheet":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.google-apps.presentation":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.google-apps.drawing": "image/png",
};

//Consistent error response — handles both our thrown objects and googleapis errors
function sendError(res, err) {
  console.error("[DriveExplorer]", err?.message || err);
  const status =
    typeof err?.status === "number" && err.status >= 100 && err.status <= 599
      ? err.status
      : typeof err?.code === "number" && err.code >= 100 && err.code <= 599
        ? err.code
        : 500;
  res.status(status).json({ success: false, message: err?.message || "Internal server error" });
}

//Routes

/*
GET /api/drive-explorer/:driveId/files

List files and folders inside a Google Drive folder.

Query params:
  folderId   — Google Drive folder ID to list (default: "root")
  pageToken  — pagination token from a previous response
  pageSize   — items per page (default: 100, max: 1000)

Response: { success, items, nextPageToken, driveEmail }

Each item: { id, name, mimeType, isFolder, isGoogleDoc, size,
              modifiedTime, createdTime, thumbnailLink, webViewLink, shared }
*/
router.get("/:driveId/files", protect, async (req, res) => {
  try {
    const { folderId = "root", pageToken, pageSize = 100 } = req.query;

    const driveSubdoc = getOwnedDrive(req.user, req.params.driveId);
    const driveClient = await getDriveClient(driveSubdoc, req.user);

    const resp = await driveClient.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields:
        "nextPageToken, files(id, name, mimeType, size, modifiedTime, createdTime, thumbnailLink, iconLink, webViewLink, shared)",
      orderBy: "folder, name",
      pageSize: Math.min(Number(pageSize) || 100, 1000),
      pageToken: pageToken || undefined,
    });

    const items = (resp.data.files || []).map((f) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      isFolder: f.mimeType === "application/vnd.google-apps.folder",
      isGoogleDoc: f.mimeType?.startsWith("application/vnd.google-apps."),
      size: f.size ? Number(f.size) : null,
      modifiedTime: f.modifiedTime,
      createdTime: f.createdTime,
      thumbnailLink: f.thumbnailLink || null,
      webViewLink: f.webViewLink || null,
      shared: f.shared || false,
    }));

    res.json({
      success: true,
      items,
      nextPageToken: resp.data.nextPageToken || null,
      driveEmail: driveSubdoc.email,
    });
  } catch (err) {
    sendError(res, err);
  }
});

/*
GET /api/drive-explorer/:driveId/files/:fileId/view

Stream a file from Google Drive for in-browser viewing.
Google Workspace files (Docs, Sheets, Slides) are auto-exported
to their Office equivalents before streaming.

Query params:
  inline — "true" (default) sets Content-Disposition: inline for browser preview
            "false" forces Content-Disposition: attachment (download)
*/
router.get("/:driveId/files/:fileId/view", protect, async (req, res) => {
  try {
    const disposition = req.query.inline === "false" ? "attachment" : "inline";

    const driveSubdoc = getOwnedDrive(req.user, req.params.driveId);
    const driveClient = await getDriveClient(driveSubdoc, req.user);

    //Fetch file metadata first
    const meta = await driveClient.files.get({
      fileId: req.params.fileId,
      fields: "id, name, mimeType, size",
    });
    const { name, mimeType, size } = meta.data;

    //Google Workspace files must be exported
    if (EXPORT_MAP[mimeType]) {
      const exportMime = EXPORT_MAP[mimeType];
      const exportRes = await driveClient.files.export(
        { fileId: req.params.fileId, mimeType: exportMime },
        { responseType: "stream" }
      );
      res.setHeader("Content-Type", exportMime);
      res.setHeader(
        "Content-Disposition",
        `${disposition}; filename="${encodeURIComponent(name)}"`
      );
      res.setHeader("Cache-Control", "private, max-age=300");
      return exportRes.data.pipe(res);
    }

    //Handle range requests for video/audio streaming
    const fileSize = size ? Number(size) : null;
    const rangeHeader = req.headers.range;

    if (rangeHeader && fileSize) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const fileRes = await driveClient.files.get(
        { fileId: req.params.fileId, alt: "media" },
        {
          responseType: "stream",
          headers: { Range: `bytes=${start}-${end}` },
        }
      );

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": mimeType,
        "Cache-Control": "private, max-age=300",
      });
      return fileRes.data.pipe(res);
    }

    //Regular binary file — stream directly
    const fileRes = await driveClient.files.get(
      { fileId: req.params.fileId, alt: "media" },
      { responseType: "stream" }
    );
    res.setHeader("Content-Type", mimeType || "application/octet-stream");
    if (fileSize) res.setHeader("Content-Length", fileSize);
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename="${encodeURIComponent(name)}"`
    );
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "private, max-age=300");
    fileRes.data.pipe(res);
  } catch (err) {
    sendError(res, err);
  }
});

/*
GET /api/drive-explorer/:driveId/files/:fileId/download

Force-download a file (always Content-Disposition: attachment).
Google Workspace files are exported to Office format.
*/
router.get("/:driveId/files/:fileId/download", protect, async (req, res) => {
  try {
    const driveSubdoc = getOwnedDrive(req.user, req.params.driveId);
    const driveClient = await getDriveClient(driveSubdoc, req.user);

    const meta = await driveClient.files.get({
      fileId: req.params.fileId,
      fields: "id, name, mimeType, size",
    });
    const { name, mimeType, size } = meta.data;

    if (EXPORT_MAP[mimeType]) {
      const exportMime = EXPORT_MAP[mimeType];
      const exportRes = await driveClient.files.export(
        { fileId: req.params.fileId, mimeType: exportMime },
        { responseType: "stream" }
      );
      res.setHeader("Content-Type", exportMime);
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(name)}"`);
      return exportRes.data.pipe(res);
    }

    const fileRes = await driveClient.files.get(
      { fileId: req.params.fileId, alt: "media" },
      { responseType: "stream" }
    );
    res.setHeader("Content-Type", mimeType || "application/octet-stream");
    if (size) res.setHeader("Content-Length", size);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(name)}"`);
    res.setHeader("Accept-Ranges", "bytes");
    fileRes.data.pipe(res);
  } catch (err) {
    sendError(res, err);
  }
});

/*
POST /api/drive-explorer/:driveId/folders

Create a new folder inside Google Drive.

Request body: { name: string, parentId?: string }
  parentId defaults to "root" if not provided.

Response: { success, folder: { id, name, mimeType, createdTime } }
*/
router.post("/:driveId/folders", protect, async (req, res) => {
  try {
    const { name, parentId = "root" } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: "Folder name is required" });
    }

    const driveSubdoc = getOwnedDrive(req.user, req.params.driveId);
    const driveClient = await getDriveClient(driveSubdoc, req.user);

    const resp = await driveClient.files.create({
      requestBody: {
        name: name.trim(),
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentId],
      },
      fields: "id, name, mimeType, createdTime",
    });

    res.status(201).json({ success: true, folder: resp.data });
  } catch (err) {
    sendError(res, err);
  }
});

/*
DELETE /api/drive-explorer/:driveId/files/:fileId

Move a file or folder to Google Drive trash (safe — not permanent delete).

Response: { success, message }
*/
router.delete("/:driveId/files/:fileId", protect, async (req, res) => {
  try {
    const driveSubdoc = getOwnedDrive(req.user, req.params.driveId);
    const driveClient = await getDriveClient(driveSubdoc, req.user);

    await driveClient.files.update({
      fileId: req.params.fileId,
      requestBody: { trashed: true },
    });

    res.json({ success: true, message: "Moved to trash successfully" });
  } catch (err) {
    sendError(res, err);
  }
});

/*
POST /api/drive-explorer/:driveId/upload

Upload a file into a specific Google Drive folder.
Requires multer memoryStorage middleware applied in server.js.

Request: multipart/form-data
  file      — the file to upload
  folderId  — parent folder ID (default: "root")

Response: { success, file: { id, name, mimeType, size, createdTime }, message }
*/
router.post("/:driveId/upload", protect, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file provided" });
    }

    const { folderId = "root" } = req.body;

    const driveSubdoc = getOwnedDrive(req.user, req.params.driveId);
    const driveClient = await getDriveClient(driveSubdoc, req.user);

    const fileStream = Readable.from(req.file.buffer);

    const resp = await driveClient.files.create({
      requestBody: {
        name: req.file.originalname,
        parents: [folderId],
      },
      media: {
        mimeType: req.file.mimetype,
        body: fileStream,
      },
      fields: "id, name, mimeType, size, createdTime, modifiedTime",
    });

    res.status(201).json({
      success: true,
      file: resp.data,
      message: `"${req.file.originalname}" uploaded successfully`,
    });
  } catch (err) {
    sendError(res, err);
  }
});

/*
GET /api/drive-explorer/:driveId/search

Search for files and folders across the entire drive by name.

Query params:
  q        — search string (required, min 1 char)
  pageSize — max results (default: 50, max: 200)

Response: { success, items }
*/
router.get("/:driveId/search", protect, async (req, res) => {
  try {
    const { q = "", pageSize = 50 } = req.query;

    if (!q.trim()) {
      return res.json({ success: true, items: [] });
    }

    const driveSubdoc = getOwnedDrive(req.user, req.params.driveId);
    const driveClient = await getDriveClient(driveSubdoc, req.user);

    //Escape single quotes to prevent query injection
    const safeQ = q.trim().replace(/\\/g, "\\\\").replace(/'/g, "\\'");

    const resp = await driveClient.files.list({
      q: `name contains '${safeQ}' and trashed = false`,
      fields:
        "files(id, name, mimeType, size, modifiedTime, thumbnailLink, webViewLink, parents)",
      orderBy: "modifiedTime desc",
      pageSize: Math.min(Number(pageSize) || 50, 200),
    });

    const items = (resp.data.files || []).map((f) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      isFolder: f.mimeType === "application/vnd.google-apps.folder",
      isGoogleDoc: f.mimeType?.startsWith("application/vnd.google-apps."),
      size: f.size ? Number(f.size) : null,
      modifiedTime: f.modifiedTime,
      thumbnailLink: f.thumbnailLink || null,
      webViewLink: f.webViewLink || null,
      parents: f.parents || [],
    }));

    res.json({ success: true, items });
  } catch (err) {
    sendError(res, err);
  }
});

/*
GET /api/drive-explorer/:driveId/files/:fileId/thumbnail

Proxy endpoint to fetch file thumbnails with authentication.
This solves CORS and authentication issues with direct Google Drive thumbnail URLs.

Response: Image file (PNG, JPEG) with appropriate Content-Type header
*/
router.get("/:driveId/files/:fileId/thumbnail", protect, async (req, res) => {
  try {
    const driveSubdoc = getOwnedDrive(req.user, req.params.driveId);
    const driveClient = await getDriveClient(driveSubdoc, req.user);

    //Get the file's thumbnailLink and metadata
    const meta = await driveClient.files.get({
      fileId: req.params.fileId,
      fields: "id, mimeType, name, thumbnailLink, webViewLink",
    });

    //For folders, return error
    if (meta.data.mimeType === "application/vnd.google-apps.folder") {
      return res.status(404).json({ success: false, message: "Folders do not have thumbnails" });
    }

    //If no thumbnail available, return 404
    if (!meta.data.thumbnailLink) {
      return res.status(404).json({ success: false, message: "Thumbnail not available for this file" });
    }

    //Proxy the thumbnail by fetching it with the authenticated client
    //Google Drive thumbnailLink already includes auth if accessed via the authenticated client
    try {
      const urlObj = new URL(meta.data.thumbnailLink);
      
      //Add access token to the request
      const token = driveClient._options.auth.credentials.access_token;
      
      const proxyReq = https.get(
        {
          hostname: urlObj.hostname,
          path: urlObj.pathname + urlObj.search,
          headers: {
            "Authorization": `Bearer ${token}`,
            "User-Agent": "Colossus/1.0",
          },
          timeout: 10000,
        },
        (imgRes) => {
          res.setHeader("Cache-Control", "public, max-age=86400");  //Cache for 24 hours
          res.setHeader("Content-Type", imgRes.headers["content-type"] || "image/jpeg");
          if (imgRes.headers["content-length"]) {
            res.setHeader("Content-Length", imgRes.headers["content-length"]);
          }
          
          imgRes.pipe(res);
        }
      );

      proxyReq.on("error", (err) => {
        console.error("[Thumbnail HTTPS]", err?.message);
        res.status(500).json({ success: false, message: "Failed to fetch thumbnail" });
      });

    } catch (httpsErr) {
      console.error("[Thumbnail Proxy]", httpsErr?.message);
      res.status(500).json({ success: false, message: "Thumbnail service error" });
    }
  } catch (err) {
    //If metadata fetch fails
    console.error("[Thumbnail Metadata]", err?.message || err);
    res.status(404).json({ success: false, message: "File not found" });
  }
});

module.exports = router;
