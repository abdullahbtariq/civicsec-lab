import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { uploadDataset } from "./api";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

const RETENTION_OPTIONS = [
  {
    value: "delete_after_processing",
    label: "Delete after processing (recommended)",
    description: "The original CSV is securely deleted as soon as analysis is complete.",
  },
  {
    value: "retain_for_demo",
    label: "Retain for demo",
    description: "File is kept on the server. Use only for non-personal demo data.",
  },
  {
    value: "manual_delete",
    label: "Manual delete",
    description: "File is retained until explicitly deleted. Use with caution.",
  },
];

export function UploadDatasetPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [retentionPolicy, setRetentionPolicy] = useState("delete_after_processing");
  const [clientError, setClientError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  function validateAndSetFile(f: File | null) {
    setClientError(null);
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) {
      setClientError("Only .csv files are accepted.");
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setClientError("File exceeds the 10 MB limit.");
      return;
    }
    setFile(f);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    validateAndSetFile(e.target.files?.[0] ?? null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    validateAndSetFile(e.dataTransfer.files[0] ?? null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setClientError("Please select a CSV file.");
      return;
    }
    setClientError(null);
    setIsUploading(true);
    try {
      const result = await uploadDataset(file, retentionPolicy);
      navigate(`/modules/privacy-doctor/datasets/${result.dataset_id}`);
    } catch (err) {
      setClientError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  const dropZoneClass = `relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition-colors cursor-pointer ${
    isDragging
      ? "border-blue-500 bg-blue-950/20"
      : "border-neutral-700 bg-neutral-900/40 hover:border-neutral-500"
  }`;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <nav className="mb-1 text-xs text-neutral-500">
          <Link to="/modules/privacy-doctor" className="hover:text-neutral-300">
            DataPrivacy Doctor
          </Link>{" "}
          / Upload Dataset
        </nav>
        <h1 className="text-xl font-semibold text-neutral-100">Upload Dataset</h1>
        <p className="mt-0.5 text-sm text-neutral-400">
          Upload a CSV file for automated privacy analysis.
        </p>
      </div>

      {/* Privacy notice */}
      <div className="rounded-lg border border-amber-800 bg-amber-950/20 px-4 py-3 text-xs text-amber-300 space-y-1">
        <p className="font-semibold">Privacy notice</p>
        <p>
          Only upload CSV files containing data your organisation is legally authorised to process.
          Do not upload files containing personal data unless you have a valid lawful basis. Choose{" "}
          <strong>Delete after processing</strong> unless you have a specific reason to retain the
          file on the server.
        </p>
      </div>

      {/* Format guide */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4 space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
          CSV Format Guide
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-neutral-400">
            <thead className="border-b border-neutral-800 text-neutral-500">
              <tr>
                <th className="py-1.5 text-left pr-6">Requirement</th>
                <th className="py-1.5 text-left">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {[
                ["Format", "Plain CSV (.csv), UTF-8 encoded"],
                ["Header row", "Required — first row must be column names"],
                ["Max file size", "10 MB"],
                ["Max rows", "50,000 recommended"],
                ["Delimiter", "Comma (,)"],
                ["Quote character", 'Double-quote (") for values containing commas'],
              ].map(([req, detail]) => (
                <tr key={req}>
                  <td className="py-1.5 pr-6 font-medium text-neutral-300">{req}</td>
                  <td className="py-1.5">{detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload form */}
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
        {/* Drop zone */}
        <div
          className={dropZoneClass}
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileInput}
          />
          {file ? (
            <div className="space-y-1">
              <p className="text-sm font-medium text-neutral-100">{file.name}</p>
              <p className="text-xs text-neutral-500">
                {file.size < 1024 * 1024
                  ? `${(file.size / 1024).toFixed(1)} KB`
                  : `${(file.size / (1024 * 1024)).toFixed(2)} MB`}
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-xs text-rose-400 hover:text-rose-300"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="mx-auto h-10 w-10 text-neutral-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
              </div>
              <p className="text-sm text-neutral-300">
                Drop CSV here or <span className="text-blue-400">browse</span>
              </p>
              <p className="text-xs text-neutral-600">Max 10 MB · .csv only</p>
            </div>
          )}
        </div>

        {/* Retention policy */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Retention Policy
          </label>
          <div className="space-y-2">
            {RETENTION_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  retentionPolicy === opt.value
                    ? "border-blue-700 bg-blue-950/30"
                    : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700"
                }`}
              >
                <input
                  type="radio"
                  name="retention_policy"
                  value={opt.value}
                  checked={retentionPolicy === opt.value}
                  onChange={() => setRetentionPolicy(opt.value)}
                  className="mt-0.5 accent-blue-500"
                />
                <div>
                  <p className="text-xs font-medium text-neutral-200">{opt.label}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">{opt.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {clientError && (
          <div className="rounded-lg border border-rose-800 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
            {clientError}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isUploading || !file}
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {isUploading ? "Scanning…" : "Upload & Scan"}
          </button>
          <Link
            to="/modules/privacy-doctor"
            className="rounded-md border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-700 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
