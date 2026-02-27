const mongoose = require("mongoose");

//Each chunk references a specific drive account and a Google Drive file ID
const chunkSchema = new mongoose.Schema({
  chunkIndex: { type: Number, required: true },    //0-based index
  driveAccountEmail: { type: String, required: true },
  googleFileId: { type: String, required: true },  //The Drive file ID for this chunk
  size: { type: Number, required: true },          //Bytes in this chunk
  byteStart: { type: Number, required: true },     //Original file byte offset start
  byteEnd: { type: Number, required: true },       //Original file byte offset end
});

const fileMetadataSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true },          //Original file name
    mimeType: { type: String, default: "application/octet-stream" },
    totalSize: { type: Number, required: true },     //Total bytes
    isChunked: { type: Boolean, default: false },    //Was the file split?

    //For non-chunked files — single Drive reference
    singleDriveAccountEmail: { type: String },
    singleGoogleFileId: { type: String },

    //For chunked files
    chunks: [chunkSchema],

    //For UI display — folder path
    path: { type: String, default: "/" },

    //Soft delete
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

//Index for fast file search per user
fileMetadataSchema.index({ owner: 1, name: "text" });

module.exports = mongoose.model("FileMetadata", fileMetadataSchema);
