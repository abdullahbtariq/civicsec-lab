import { useRef, useState } from "react";
import { Link } from "react-router-dom";

import { uploadLoginLogs } from "./api";

const MAX_MB = 10;

export function UploadLogsPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ batch_id: string; events_created: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setResult(null);
    setUploadError(null);
    setFileError(null);

    if (!selected) {
      setFile(null);
      return;
    }
    if (!selected.name.endsWith(".csv")) {
      setFileError("Only .csv files are accepted.");
      setFile(null);
      return;
    }
    if (selected.size > MAX_MB * 1024 * 1024) {
      setFileError(`File exceeds the ${MAX_MB} MB size limit.`);
      setFile(null);
      return;
    }
    setFile(selected);
  }

  async function handleUpload() {
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);
    setResult(null);
    try {
      const data = await uploadLoginLogs(file);
      setResult(data);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setUploadError("Upload failed. Check the file format and try again.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Breadcrumb + header */}
      <div>
        <nav className="mb-1 text-xs text-neutral-500">
          <Link to="/modules/loglens" className="hover:text-neutral-300">
            LogLens
          </Link>{" "}
          / Upload Logs
        </nav>
        <h1 className="text-xl font-semibold text-neutral-100">Upload Login Logs</h1>
        <p className="mt-0.5 text-sm text-neutral-400">
          Import login event data from a CSV file for analysis.
        </p>
      </div>

      {/* Responsible-use note */}
      <div className="rounded-lg border border-amber-900/60 bg-amber-950/30 px-4 py-3 text-xs text-amber-300/80">
        <span className="font-medium text-amber-300">Privacy & Data Handling. </span>
        Only upload data your organisation is authorised to process. Uploaded files are deleted
        immediately after parsing — only the extracted event records are retained. Do not upload
        files containing passwords, personal identification numbers, or sensitive personal data
        beyond what is required for login event analysis.
      </div>

      {/* CSV format guide */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-neutral-300">Required CSV Format</h2>
        <p className="text-xs text-neutral-400">
          The file must include these columns (headers are case-sensitive):
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-neutral-800 text-neutral-500 uppercase tracking-wide">
              <tr>
                <th className="pb-2 text-left pr-4">Column</th>
                <th className="pb-2 text-left pr-4">Required</th>
                <th className="pb-2 text-left">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {[
                ["user_email", "Yes", "e.g. user@example.org"],
                ["timestamp", "Yes", "ISO 8601, e.g. 2025-01-15T09:32:00Z"],
                ["event_type", "Yes", "login, logout, password_reset…"],
                ["success", "Yes", "true or false"],
                ["ip_address", "No", "IPv4 or IPv6"],
                ["country", "No", "Country code or name"],
                ["city", "No", "City name"],
                ["device_id", "No", "Unique device identifier"],
                ["resource_accessed", "No", "Path or resource name"],
              ].map(([col, req, note]) => (
                <tr key={col}>
                  <td className="py-1.5 pr-4 font-mono text-neutral-200">{col}</td>
                  <td className="py-1.5 pr-4 text-neutral-400">{req}</td>
                  <td className="py-1.5 text-neutral-500">{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-neutral-600">
          Maximum file size: {MAX_MB} MB · Maximum rows: 50,000
        </p>
      </div>

      {/* Upload form */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 space-y-4">
        <h2 className="text-sm font-semibold text-neutral-300">Select File</h2>
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-neutral-700 bg-neutral-950/50 p-8 cursor-pointer hover:border-neutral-500 transition-colors"
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <div className="text-3xl text-neutral-600">📂</div>
          {file ? (
            <div className="text-center">
              <p className="text-sm font-medium text-neutral-200">{file.name}</p>
              <p className="text-xs text-neutral-500">
                {(file.size / 1024).toFixed(0)} KB · Click to change
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-neutral-400">Click to select a .csv file</p>
              <p className="text-xs text-neutral-600">or drag and drop</p>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {fileError && (
          <p className="rounded-md border border-rose-800 bg-rose-950/40 px-3 py-2 text-xs text-rose-300">
            {fileError}
          </p>
        )}

        <button
          disabled={!file || isUploading}
          onClick={() => void handleUpload()}
          className="w-full rounded-md bg-blue-700 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? "Uploading…" : "Upload and Import"}
        </button>
      </div>

      {/* Success */}
      {result && (
        <div className="rounded-lg border border-emerald-800 bg-emerald-950/40 px-4 py-3 space-y-1">
          <p className="text-sm font-semibold text-emerald-300">Upload successful</p>
          <p className="text-xs text-emerald-400">
            {result.events_created} events imported · Batch ID:{" "}
            <span className="font-mono">{result.batch_id}</span>
          </p>
          <p className="text-xs text-emerald-600">
            Go to the{" "}
            <Link to="/modules/loglens" className="underline hover:text-emerald-400">
              LogLens overview
            </Link>{" "}
            and run detection to analyse the new events.
          </p>
        </div>
      )}

      {/* Upload error */}
      {uploadError && (
        <div className="rounded-lg border border-rose-800 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
          {uploadError}
        </div>
      )}
    </div>
  );
}
