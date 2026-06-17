import { useRef, useState } from "react";
import { Link } from "react-router-dom";

import { Button, ButtonLink } from "../../components/ui/Button";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { uploadLoginLogs } from "./api";

const MAX_MB = 10;

export function UploadLogsPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ batch_id: string; events_created: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function selectFile(f: File | null) {
    setResult(null);
    setUploadError(null);
    setFileError(null);
    if (!f) {
      setFile(null);
      return;
    }
    if (!f.name.endsWith(".csv")) {
      setFileError("Only .csv files are accepted.");
      setFile(null);
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setFileError(`File exceeds the ${MAX_MB} MB size limit.`);
      setFile(null);
      return;
    }
    setFile(f);
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
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Breadcrumb + header */}
      <div>
        <nav className="mb-1 text-xs text-ink-soft">
          <Link to="/modules/loglens" className="transition-colors hover:text-ink">
            LogLens
          </Link>{" "}
          / Upload Logs
        </nav>
        <h1 className="font-display text-xl font-semibold text-ink">Upload Login Logs</h1>
        <p className="mt-0.5 text-sm text-ink-soft">
          Import login event data from a CSV file for analysis.
        </p>
      </div>

      {/* Responsible-use note */}
      <div className="rounded-lg border border-civic-amber/30 bg-civic-amber/5 px-4 py-3 text-xs text-gold-ink">
        <span className="font-medium">Privacy & Data Handling. </span>
        Only upload data your organisation is authorised to process. Uploaded files are deleted
        immediately after parsing — only the extracted event records are retained. Do not upload
        files containing passwords, personal identification numbers, or sensitive personal data
        beyond what is required for login event analysis.
      </div>

      {/* CSV format guide */}
      <Card>
        <CardHeader
          title="Required CSV Format"
          description="The file must include these columns (headers are case-sensitive)."
        />
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-paper-line text-ink-soft uppercase tracking-wide">
                <tr>
                  <th className="pb-2 pr-4 text-left">Column</th>
                  <th className="pb-2 pr-4 text-left">Required</th>
                  <th className="pb-2 text-left">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-line/60">
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
                    <td className="py-1.5 pr-4 font-mono text-ink">{col}</td>
                    <td className="py-1.5 pr-4 text-ink-soft">{req}</td>
                    <td className="py-1.5 text-ink-soft">{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-ink-soft">
            Maximum file size: {MAX_MB} MB · Maximum rows: 50,000
          </p>
        </CardContent>
      </Card>

      {/* Upload form */}
      <Card>
        <CardHeader title="Select File" />
        <CardContent className="space-y-4">
          <div
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              file
                ? "border-civic-teal/50 bg-civic-teal/5"
                : "border-paper-line bg-paper hover:border-civic-teal/40"
            }`}
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              selectFile(e.dataTransfer.files[0] ?? null);
            }}
            role="button"
            tabIndex={0}
          >
            <div className="text-3xl text-ink-soft">📂</div>
            {file ? (
              <div className="text-center">
                <p className="text-sm font-medium text-orange-ink">{file.name}</p>
                <p className="text-xs text-ink-soft">
                  {(file.size / 1024).toFixed(0)} KB · Click to change
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-ink-soft">
                  Click to select a .csv file, or{" "}
                  <span className="text-orange-ink underline">browse</span>
                </p>
                <p className="text-xs text-ink-soft">or drag and drop</p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => selectFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {fileError && (
            <p className="rounded-lg border border-civic-rose/30 bg-civic-rose/5 px-3 py-2 text-xs text-rose-ink">
              {fileError}
            </p>
          )}

          <Button
            variant="primary"
            disabled={!file || isUploading}
            onClick={() => void handleUpload()}
            className="w-full"
          >
            {isUploading ? "Uploading…" : "Upload and Import"}
          </Button>
        </CardContent>
      </Card>

      {/* Success */}
      {result && (
        <div className="rounded-lg border border-civic-teal/30 bg-civic-teal/5 px-4 py-3">
          <p className="text-sm font-semibold text-orange-ink">Upload successful</p>
          <p className="mt-1 text-xs text-orange-ink/80">
            {result.events_created} events imported · Batch ID:{" "}
            <span className="font-mono">{result.batch_id}</span>
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            Go to the{" "}
            <Link to="/modules/loglens" className="text-orange-ink underline hover:no-underline">
              LogLens overview
            </Link>{" "}
            and run detection to analyse the new events.
          </p>
        </div>
      )}

      {/* Upload error */}
      {uploadError && (
        <div className="rounded-lg border border-civic-rose/30 bg-civic-rose/5 px-4 py-3 text-sm text-rose-ink">
          {uploadError}
        </div>
      )}

      <div>
        <ButtonLink to="/modules/loglens" variant="secondary">
          ← Back to LogLens
        </ButtonLink>
      </div>
    </div>
  );
}
