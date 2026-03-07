import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../../context/ThemeContext";
import FolderTree from "./FolderTree";
import FileGrid from "./FileGrid";
import FilePreviewModal from "./FilePreviewModal";
import api from "../../utils/api";
import toast from "react-hot-toast";

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
      setFiles((prev) => pageToken ? [...prev, ...res.data.items] : res.data.items);
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

  //Navigate into a folder from file grid
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

  //Navigate from folder tree
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

  //Debounced search
  useEffect(() => {
    if (!search.trim() || !selectedDrive) return;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(`/drive-explorer/${selectedDrive._id}/search`, {
          params: { q: search },
        });
        setFiles(res.data.items || []);
      } catch {
        toast.error("Search failed.");
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search, selectedDrive]);

  //When search cleared, reload current folder
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

  const handleDelete = async (fileId, fileName) => {
    if (!confirm(`Move "${fileName}" to trash?`)) return;
    try {
      await api.delete(`/drive-explorer/${selectedDrive._id}/files/${fileId}`);
      toast.success(`"${fileName}" moved to trash`);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch {
      toast.error("Failed to delete.");
    }
  };

  const handleDownload = (fileId, fileName) => {
    const token = localStorage.getItem("colossus_token");
    fetch(`/api/drive-explorer/${selectedDrive._id}/files/${fileId}/download`, {
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
    setPreviewFile({ ...file, driveId: selectedDrive._id });
  };

  return (
    <div className={`flex h-[calc(100vh-120px)] rounded-2xl overflow-hidden border ${isDark ? "border-white/10" : "border-gray-200"}`}>
      {/*Left — Folder Tree*/}
      <div className={`w-60 shrink-0 border-r overflow-y-auto ${isDark ? "border-white/5 bg-black/10" : "border-gray-100 bg-white/20"}`}>
        <FolderTree
          drives={drives}
          loading={loadingDrives}
          selectedDrive={selectedDrive}
          currentFolderId={currentFolderId}
          onNavigate={navigateFromTree}
        />
      </div>

      {/*Right — File Grid*/}
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
