import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button, ButtonLink } from "../../components/ui/Button";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
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
      ? "border-civic-teal bg-civic-teal/5"
      : "border-paper-line bg-paper hover:border-civic-teal/40"
  }`;

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div>
        <nav className="mb-1 text-xs text-ink-soft">
          <Link to="/modules/privacy-doctor" className="transition-colors hover:text-ink">
            DataPrivacy Doctor
          </Link>{" "}
          / Upload Dataset
        </nav>
        <h1 className="font-display text-xl font-semibold text-ink">Upload Dataset</h1>
        <p className="mt-0.5 text-sm text-ink-soft">
          Upload a CSV file for automated privacy analysis.
        </p>
      </div>

      {/* Privacy notice */}
      <div className="rounded-lg border border-civic-amber/30 bg-civic-amber/5 px-4 py-3 text-xs text-gold-ink">
        <p className="font-semibold">Privacy notice</p>
        <p className="mt-1">
          Only upload CSV files containing data your organisation is legally authorised to process.
          Do not upload files containing personal data unless you have a valid lawful basis. Choose{" "}
          <strong>Delete after processing</strong> unless you have a specific reason to retain the
          file on the server.
        </p>
      </div>

      {/* Format guide */}
      <Card>
        <CardHeader title="CSV Format Guide" />
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-ink-soft">
              <thead className="border-b border-paper-line">
                <tr>
                  <th className="py-1.5 pr-6 text-left text-ink">Requirement</th>
                  <th className="py-1.5 text-left">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-line/60">
                {[
                  ["Format", "Plain CSV (.csv), UTF-8 encoded"],
                  ["Header row", "Required — first row must be column names"],
                  ["Max file size", "10 MB"],
                  ["Max rows", "50,000 recommended"],
                  ["Delimiter", "Comma (,)"],
                  ["Quote character", 'Double-quote (") for values containing commas'],
                ].map(([req, detail]) => (
                  <tr key={req}>
                    <td className="py-1.5 pr-6 font-medium text-ink">{req}</td>
                    <td className="py-1.5">{detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
            <div className="space-y-1 text-center">
              <p className="text-sm font-medium text-orange-ink">{file.name}</p>
              <p className="text-xs text-ink-soft">
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
                className="text-xs text-rose-ink transition-colors hover:text-rose-ink"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="space-y-2 text-center">
              <div className="mx-auto h-10 w-10 text-ink-soft">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
              </div>
              <p className="text-sm text-ink">
                Drop CSV here or{" "}
                <span className="text-orange-ink underline">browse</span>
              </p>
              <p className="text-xs text-ink-soft">Max 10 MB · .csv only</p>
            </div>
          )}
        </div>

        {/* Retention policy */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Retention Policy
          </label>
          <div className="space-y-2">
            {RETENTION_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  retentionPolicy === opt.value
                    ? "border-civic-teal/50 bg-civic-teal/5"
                    : "border-paper-line bg-paper hover:border-civic-teal/20"
                }`}
              >
                <input
                  type="radio"
                  name="retention_policy"
                  value={opt.value}
                  checked={retentionPolicy === opt.value}
                  onChange={() => setRetentionPolicy(opt.value)}
                  className="mt-0.5 accent-civic-teal"
                />
                <div>
                  <p className="text-xs font-medium text-ink">{opt.label}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">{opt.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {clientError && (
          <div className="rounded-lg border border-civic-rose/30 bg-civic-rose/5 px-4 py-3 text-sm text-rose-ink">
            {clientError}
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" variant="primary" disabled={isUploading || !file}>
            {isUploading ? "Scanning…" : "Upload & Scan"}
          </Button>
          <ButtonLink to="/modules/privacy-doctor" variant="secondary">
            Cancel
          </ButtonLink>
        </div>
      </form>
    </div>
  );
}
