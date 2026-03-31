import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../../context/ThemeContext";
import FolderTree from "./FolderTree";
import FileGrid from "./FileGrid";
import FilePreviewModal from "./FilePreviewModal";
import api from "../../utils/api";
import toast from "react-hot-toast";

/*DriveExplorer orchestrates the two-panel file browser:
  Left  — FolderTree (per-drive folder navigation)
  Right — FileGrid   (file listing + both upload modes)

Upload responsibility has been moved entirely into FileGrid
Cross-drive search:
  When a search query is active, ALL connected drives are queried in parallel
  via Promise.allSettled. Each result is tagged with _driveId and _driveEmail
  so that handleDownload / handlePreview / handleDelete know which drive to
  call — even when results come from different drives.

  Outside of search mode, actions always use selectedDrive._id as before*/
export default function DriveExplorer() {
  const { isDark } = useTheme();
  const [drives, setDrives] = useState([]);
  const [loadingDrives, setLoadingDrives] = useState(true);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [currentFolderId, setCurrentFolderId] = useState("root");
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: "root", name: "My Drive" }]);
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  //Fetch connected drives on mount
  useEffect(() => {
    const fetchDrives = async () => {
      try {
        const res = await api.get("/drives");
        const driveList = res.data.drives || [];
        setDrives(driveList);
        if (driveList.length > 0) setSelectedDrive(driveList[0]);
      } catch {
        toast.error("Failed to load drives.");
      } finally {
        setLoadingDrives(false);
      }
    };
    fetchDrives();
  }, []);

  //Fetch files when drive or folder changes
  const fetchFiles = useCallback(async (driveId, folderId, pageToken = null) => {
    if (!driveId) return;
    setLoadingFiles(true);
    try {
      const res = await api.get(`/drive-explorer/${driveId}/files`, {
        params: { folderId, pageSize: 100, ...(pageToken && { pageToken }) },
      });
      setFiles((prev) => (pageToken ? [...prev, ...res.data.items] : res.data.items));
      setNextPageToken(res.data.nextPageToken);
    } catch {
      toast.error("Failed to load files.");
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDrive) {
      setFiles([]);
      setSearch("");
      fetchFiles(selectedDrive._id, currentFolderId);
    }
  }, [selectedDrive, currentFolderId, fetchFiles]);

  //Navigate into a folder from the file grid
  const navigateToFolder = (folder) => {
    setCurrentFolderId(folder.id);
    setBreadcrumbs((prev) => {
      const exists = prev.find((b) => b.id === folder.id);
      if (exists) return prev.slice(0, prev.indexOf(exists) + 1);
      return [...prev, { id: folder.id, name: folder.name }];
    });
  };

  //Navigate via breadcrumb click
  const navigateBreadcrumb = (crumb, index) => {
    setCurrentFolderId(crumb.id);
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
  };

  //Navigate from folder tree (can switch drives)
  const navigateFromTree = (folderId, folderName, driveObj) => {
    if (driveObj._id !== selectedDrive?._id) {
      setSelectedDrive(driveObj);
    }
    if (folderId === "root") {
      setCurrentFolderId("root");
      setBreadcrumbs([{ id: "root", name: "My Drive" }]);
    } else {
      setCurrentFolderId(folderId);
      setBreadcrumbs([{ id: "root", name: "My Drive" }, { id: folderId, name: folderName }]);
    }
  };

  /*Cross-drive search - queries all connected drives in parallel.
  Why tag with _driveId / _driveEmail?
    Outside search mode, every file in the grid belongs to selectedDrive, so
    handleDownload/handlePreview/handleDelete just use selectedDrive._id.
    But in search mode, result[0] might be from drive A and result[1] from
    drive B. We tag each item at search time so the action handlers can always
    resolve the correct drive regardless of which drive is "selected".*/
  useEffect(() => {
    if (!search.trim() || drives.length === 0) return;

    const timer = setTimeout(async () => {
      setSearching(true);

      //Snapshot id and email as plain primitives right now, before any async work
      const driveSnapshots = drives.map((drive) => ({
        id: String(drive._id),
        email: String(drive.email),
      }));
      try {
        const results = await Promise.allSettled(
          driveSnapshots.map(({ id, email }) =>  // destructure primitives — no object reference
            api
              .get(`/drive-explorer/${id}/search`, { params: { q: search } })
              .then((response) =>
                (response.data.items || []).map((item) => ({
                  ...item,
                  _driveId: id,
                  _driveEmail: email,
                }))
              )
          )
        );

        //Collect fulfilled results & silently skip drives that errored
        const merged = results.flatMap((r) =>
          r.status === "fulfilled" ? r.value : []
        );

        //Sort by most recently modified across all drives
        merged.sort((a, b) => new Date(b.modifiedTime) - new Date(a.modifiedTime));

        setFiles(merged);
      } catch {
        toast.error("Search failed.");
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search, drives]);

  //When search is cleared, reload the current folder
  useEffect(() => {
    if (!search.trim() && selectedDrive) {
      fetchFiles(selectedDrive._id, currentFolderId);
    }
  }, [search, selectedDrive, currentFolderId, fetchFiles]);

  const handleCreateFolder = async (name) => {
    try {
      await api.post(`/drive-explorer/${selectedDrive._id}/folders`, {
        name,
        parentId: currentFolderId,
      });
      toast.success(`Folder "${name}" created`);
      fetchFiles(selectedDrive._id, currentFolderId);
    } catch {
      toast.error("Failed to create folder.");
    }
  };

  /*Action handlers: resolve driveId from the file's _driveId tag when in search
  mode, otherwise fall back to selectedDrive._id for normal folder browsing.
  Makes cross-drive search actions work correctly*/
  const resolveDriveId = (file) => file._driveId || selectedDrive?._id;

  const handleDelete = async (fileId, fileName, file = {}) => {
    if (!confirm(`Move "${fileName}" to trash?`)) return;
    const driveId = resolveDriveId(file);
    try {
      await api.delete(`/drive-explorer/${driveId}/files/${fileId}`);
      toast.success(`"${fileName}" moved to trash`);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch {
      toast.error("Failed to delete.");
    }
  };

  const handleDownload = (fileId, fileName, file = {}) => {
    const driveId = resolveDriveId(file);
    const token = localStorage.getItem("colossus_token");
    fetch(`/api/drive-explorer/${driveId}/files/${fileId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(`Downloading "${fileName}"`);
      })
      .catch(() => toast.error("Download failed."));
  };

  const handlePreview = (file) => {
    //Attach the resolved driveId onto the file object for FilePreviewModal
    setPreviewFile({ ...file, driveId: resolveDriveId(file) });
  };

  return (
    <div className={`flex h-[calc(100vh-120px)] rounded-2xl overflow-hidden border
      ${isDark ? "border-white/10" : "border-gray-200"}`}>

      {/*Left — Folder Tree*/}
      <div className={`w-60 shrink-0 border-r overflow-y-auto
        ${isDark ? "border-white/5 bg-black/10" : "border-gray-100 bg-white/20"}`}>
        <FolderTree
          drives={drives}
          loading={loadingDrives}
          selectedDrive={selectedDrive}
          currentFolderId={currentFolderId}
          onNavigate={navigateFromTree}
        />
      </div>

      {/*Right — File Grid (owns both upload modes internally)*/}
      <div className="flex-1 flex flex-col overflow-hidden">
        <FileGrid
          files={files}
          loading={loadingFiles || searching}
          breadcrumbs={breadcrumbs}
          search={search}
          selectedDrive={selectedDrive}
          currentFolderId={currentFolderId}
          nextPageToken={nextPageToken}
          onSearchChange={setSearch}
          onNavigateFolder={navigateToFolder}
          onBreadcrumbClick={navigateBreadcrumb}
          onPreview={handlePreview}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onCreateFolder={handleCreateFolder}
          onLoadMore={() => fetchFiles(selectedDrive._id, currentFolderId, nextPageToken)}
          onUploadComplete={() => fetchFiles(selectedDrive._id, currentFolderId)}
          driveId={selectedDrive?._id}
        />
      </div>

      {/*File Preview Modal*/}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}
