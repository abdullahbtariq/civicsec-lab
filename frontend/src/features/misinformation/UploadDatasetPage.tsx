import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button, ButtonLink } from "../../components/ui/Button";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { uploadDataset } from "./api";

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const RETENTION_OPTIONS = [
  { value: "30_days", label: "30 days" },
  { value: "90_days", label: "90 days" },
  { value: "1_year", label: "1 year" },
];

export function UploadDatasetPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [retention, setRetention] = useState("90_days");
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function validateFile(f: File) {
    if (!f.name.toLowerCase().endsWith(".csv")) {
      return "Only CSV files are accepted.";
    }
    if (f.size > MAX_SIZE_BYTES) {
      return `File exceeds ${MAX_SIZE_MB} MB limit.`;
    }
    return null;
  }

  function handleFileSelect(f: File) {
    const err = validateFile(f);
    setValidationError(err);
    setFile(err ? null : f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const dataset = await uploadDataset(file, description, retention);
      navigate(`/modules/misinformation-observatory/datasets/${dataset.id}`);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <nav className="mb-1 text-xs text-ink-soft">
          <Link
            to="/modules/misinformation-observatory"
            className="transition-colors hover:text-ink"
          >
            Observatory
          </Link>{" "}
          / Upload Dataset
        </nav>
        <h1 className="font-display text-xl font-semibold text-ink">Upload Discourse Dataset</h1>
        <p className="mt-0.5 text-sm text-ink-soft">
          Upload a CSV of public posts. The pipeline runs immediately after upload.
        </p>
      </div>

      <div className="rounded-lg border border-civic-amber/30 bg-civic-amber/5 px-4 py-3 text-xs text-gold-ink">
        <span className="font-medium">Data responsibility. </span>
        Only upload data you are authorised to process. Do not upload data that could identify
        individuals without appropriate legal basis. All data is scoped to your organisation.
      </div>

      <Card>
        <CardHeader
          title="CSV Format"
          description="Required column: text. Optional: post_id, timestamp, author_id, platform, url, engagement_count, reply_to, shared_url."
        />
        <CardContent>
          <code className="block rounded bg-[#0d1117] p-3 font-mono text-xs text-ink-soft">
            post_id,timestamp,author_id,platform,text,url,engagement_count,reply_to,shared_url
          </code>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Upload" />
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            {/* Drag-and-drop zone */}
            <div
              className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                isDragging
                  ? "border-civic-teal bg-civic-teal/5"
                  : "border-paper-line hover:border-civic-teal/60"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const dropped = e.dataTransfer.files[0];
                if (dropped) handleFileSelect(dropped);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
              />
              {file ? (
                <div>
                  <p className="text-sm font-medium text-orange-ink">{file.name}</p>
                  <p className="mt-1 text-xs text-ink-soft">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-ink-soft">
                    Drag & drop a CSV file here, or{" "}
                    <span className="text-orange-ink underline">browse</span>
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">
                    CSV only · max {MAX_SIZE_MB} MB
                  </p>
                </div>
              )}
            </div>

            {validationError && (
              <p className="text-xs text-rose-ink">{validationError}</p>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-ink-soft">
                Description (optional)
              </label>
              <Textarea
                placeholder="Brief description of this dataset's source and context."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="min-h-0"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-ink-soft">
                Retention Policy
              </label>
              <Select value={retention} onChange={(e) => setRetention(e.target.value)}>
                {RETENTION_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </div>

            {uploadError && (
              <div className="rounded-lg border border-civic-rose/40 bg-civic-rose/10 px-4 py-3 text-sm text-rose-ink">
                {uploadError}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Button type="submit" variant="primary" disabled={!file || isUploading}>
                {isUploading ? "Uploading & analysing…" : "Upload & Analyse"}
              </Button>
              <ButtonLink to="/modules/misinformation-observatory/datasets" variant="secondary">
                Cancel
              </ButtonLink>
            </div>

            {isUploading && (
              <p className="text-xs text-ink-soft">
                Running NLP pipeline — this may take a few seconds…
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
