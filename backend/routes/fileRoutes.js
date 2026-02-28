const express = require("express");
const router = express.Router();
const multer = require("multer");
const { Readable } = require("stream");
const { protect } = require("../middleware/authMiddleware");
const FileMetadata = require("../models/FileMetadata");
const { getDriveClient, getDriveQuota } = require("../utils/googleDrive");

/*Use memory storage — files are handled as buffers for Drive upload
User → RAM → Split → Upload to Drive → Done*/
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 * 1024 },     //5GB max
});

//Helper: convert Buffer to Readable stream
function bufferToStream(buffer) {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
}

//Helper: upload a buffer slice to a specific Drive account
async function uploadChunkToDrive(driveClient, buffer, fileName, mimeType) {
  const response = await driveClient.files.create({
    requestBody: {
      name: fileName,
      mimeType,
    },
    media: {
      mimeType,
      body: bufferToStream(buffer),
    },
    fields: "id, name, size",
  });
  return response.data;
}

//Helper: format bytes to human readable
function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/*POST /api/files/upload
Handles smart file upload with automatic chunking across drives*/
router.post("/upload", protect, upload.single("file"), async (req, res) => {
  try {
    const user = req.user;
    const file = req.file;
    const path = req.body.path || "/";

    if (!file) {
      return res.status(400).json({ success: false, message: "No file provided." });
    }

    if (!user.driveAccounts || user.driveAccounts.length === 0) {
      return res.status(400).json({ success: false, message: "No Google Drive accounts connected." });
    }

    //Step 1: Get quotas for all connected drives
    const quotas = await Promise.all(
      user.driveAccounts.map((account) => getDriveQuota(account, user))
    );

    //Step 2: Sort drives by free space (descending — highest first)
    const drivesWithQuota = user.driveAccounts
      .map((account, idx) => ({ account, quota: quotas[idx] }))
      .filter((d) => !d.quota.error && d.quota.free > 0)
      .sort((a, b) => b.quota.free - a.quota.free);

    if (drivesWithQuota.length === 0) {
      return res.status(400).json({ success: false, message: "No available storage space in connected drives." });
    }

    const fileBuffer = file.buffer;
    const fileSize = fileBuffer.length;
    const mimeType = file.mimetype || "application/octet-stream";

    //Step 3: Check if the file fits in the highest-free-space drive
    const topDrive = drivesWithQuota[0];

    if (topDrive.quota.free >= fileSize) {
      //No chunking needed — upload directly to top drive
      const driveClient = await getDriveClient(topDrive.account, user);
      const uploaded = await uploadChunkToDrive(driveClient, fileBuffer, file.originalname, mimeType);

      const metadata = await FileMetadata.create({
        owner: user._id,
        name: file.originalname,
        mimeType,
        totalSize: fileSize,
        isChunked: false,
        singleDriveAccountEmail: topDrive.account.email,
        singleGoogleFileId: uploaded.id,
        path,
      });

      return res.status(201).json({
        success: true,
        message: `File uploaded to ${topDrive.account.email}`,
        file: metadata,
      });
    }

    //Chunking required — split across drives
    const chunks = [];
    let byteOffset = 0;
    let chunkIndex = 0;
    let driveIndex = 0;

    while (byteOffset < fileSize && driveIndex < drivesWithQuota.length) {
      const { account, quota } = drivesWithQuota[driveIndex];

      //Calculate how much of the remaining file this drive can hold
      const remaining = fileSize - byteOffset;
      const chunkSize = Math.min(quota.free, remaining);

      if (chunkSize <= 0) {
        driveIndex++;
        continue;
      }

      //Slice the buffer for this chunk
      const chunkBuffer = fileBuffer.subarray(byteOffset, byteOffset + chunkSize);
      const chunkFileName = `${file.originalname}.chunk${chunkIndex}`;

      const driveClient = await getDriveClient(account, user);
      const uploaded = await uploadChunkToDrive(driveClient, chunkBuffer, chunkFileName, "application/octet-stream");

      chunks.push({
        chunkIndex,
        driveAccountEmail: account.email,
        googleFileId: uploaded.id,
        size: chunkSize,
        byteStart: byteOffset,
        byteEnd: byteOffset + chunkSize - 1,
      });

      byteOffset += chunkSize;
      chunkIndex++;
      driveIndex++;
    }

    //Check if we managed to upload the whole file
    if (byteOffset < fileSize) {
      //Not enough space across all drives — clean up uploaded chunks
      for (const chunk of chunks) {
        try {
          const driveAccount = user.driveAccounts.find((a) => a.email === chunk.driveAccountEmail);
          if (driveAccount) {
            const driveClient = await getDriveClient(driveAccount, user);
            await driveClient.files.delete({ fileId: chunk.googleFileId });
          }
        } catch (_) {}
      }
      return res.status(400).json({
        success: false,
        message: `Not enough total storage. File needs ${formatBytes(fileSize)} but only ${formatBytes(byteOffset)} is available.`,
      });
    }

    //Save chunked file metadata
    const metadata = await FileMetadata.create({
      owner: user._id,
      name: file.originalname,
      mimeType,
      totalSize: fileSize,
      isChunked: true,
      chunks,
      path,
    });

    res.status(201).json({
      success: true,
      message: `File split into ${chunks.length} chunk(s) and uploaded across drives.`,
      file: metadata,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ success: false, message: "Server error during upload." });
  }
});

/*GET /api/files
List all files for the current user (supports search query)*/
router.get("/", protect, async (req, res) => {
  try {
    const { search, path } = req.query;

    const query = { owner: req.user._id, deleted: false };

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (path) {
      query.path = path;
    }

    const files = await FileMetadata.find(query).sort({ createdAt: -1 });

    res.json({ success: true, files, count: files.length });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch files." });
  }
});

/*GET /api/files/:fileId/download
Download a file — merges chunks if chunked, direct download otherwise*/
router.get("/:fileId/download", protect, async (req, res) => {
  try {
    const user = req.user;
    const fileMeta = await FileMetadata.findOne({
      _id: req.params.fileId,
      owner: user._id,
      deleted: false,
    });

    if (!fileMeta) {
      return res.status(404).json({ success: false, message: "File not found." });
    }

    res.setHeader("Content-Disposition", `attachment; filename="${fileMeta.name}"`);
    res.setHeader("Content-Type", fileMeta.mimeType);
    res.setHeader("Content-Length", fileMeta.totalSize);

    if (!fileMeta.isChunked) {
      //Simple single-drive download — pipe directly
      const driveAccount = user.driveAccounts.find(
        (acc) => acc.email === fileMeta.singleDriveAccountEmail
      );

      if (!driveAccount) {
        return res.status(404).json({ success: false, message: "Drive account not found." });
      }

      const driveClient = await getDriveClient(driveAccount, user);
      const driveRes = await driveClient.files.get(
        { fileId: fileMeta.singleGoogleFileId, alt: "media" },
        { responseType: "stream" }
      );

      driveRes.data.pipe(res);
    } else {
      //Chunked download — fetch chunks in order and stream sequentially
      const sortedChunks = [...fileMeta.chunks].sort((a, b) => a.chunkIndex - b.chunkIndex);

      for (const chunk of sortedChunks) {
        const driveAccount = user.driveAccounts.find(
          (acc) => acc.email === chunk.driveAccountEmail
        );

        if (!driveAccount) {
          return res.status(500).json({ success: false, message: `Drive account for chunk ${chunk.chunkIndex} not found.` });
        }

        const driveClient = await getDriveClient(driveAccount, user);
        const driveRes = await driveClient.files.get(
          { fileId: chunk.googleFileId, alt: "media" },
          { responseType: "stream" }
        );

        //Pipe each chunk's data sequentially using a promise
        await new Promise((resolve, reject) => {
          driveRes.data.on("end", resolve);
          driveRes.data.on("error", reject);
          driveRes.data.pipe(res, { end: false });  //Don't end response until all chunks are done
        });
      }

      res.end();    //Finalize after all chunks streamed
    }
  } catch (err) {
    console.error("Download error:", err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Server error during download." });
    }
  }
});

/*DELETE /api/files/:fileId
Soft delete a file (and remove from Drive)*/
router.delete("/:fileId", protect, async (req, res) => {
  try {
    const user = req.user;
    const fileMeta = await FileMetadata.findOne({
      _id: req.params.fileId,
      owner: user._id,
    });

    if (!fileMeta) {
      return res.status(404).json({ success: false, message: "File not found." });
    }

    //Delete from Google Drive
    if (!fileMeta.isChunked) {
      const driveAccount = user.driveAccounts.find(
        (acc) => acc.email === fileMeta.singleDriveAccountEmail
      );
      if (driveAccount) {
        try {
          const driveClient = await getDriveClient(driveAccount, user);
          await driveClient.files.delete({ fileId: fileMeta.singleGoogleFileId });
        } catch (_) {}
      }
    } else {
      for (const chunk of fileMeta.chunks) {
        const driveAccount = user.driveAccounts.find(
          (acc) => acc.email === chunk.driveAccountEmail
        );
        if (driveAccount) {
          try {
            const driveClient = await getDriveClient(driveAccount, user);
            await driveClient.files.delete({ fileId: chunk.googleFileId });
          } catch (_) {}
        }
      }
    }

    await FileMetadata.deleteOne({ _id: fileMeta._id });

    res.json({ success: true, message: "File deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete file." });
  }
});

module.exports = router;
