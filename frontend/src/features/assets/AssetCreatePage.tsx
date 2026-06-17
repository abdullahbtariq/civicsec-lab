import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../lib/api";
import { canCreateOperationalRecords } from "../../lib/auth";
import { parseTags } from "../../lib/utils";
import type { Asset } from "../../types/api";

const initialForm = {
  name: "",
  asset_type: "web_app",
  description: "",
  owner_name: "",
  criticality: "medium",
  internet_exposed: false,
  data_sensitivity: "internal",
  vendor: "",
  product: "",
  version: "",
  tags: "",
};

export function AssetCreatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!canCreateOperationalRecords(user)) {
    return (
      <ErrorState message="Access denied. Viewer accounts can read records but cannot create assets." />
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const asset = await api.post<Asset>("/api/assets/", {
        ...form,
        tags: parseTags(form.tags),
      });
      navigate(`/assets/${asset.id}`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not create asset.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader
        description="Create a shared asset record that future modules can link risk signals to."
        title="New Asset"
      />
      <CardContent>
        <form className="grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
          {error ? <ErrorState message={error} /> : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-ink-soft">
              Name
              <Input
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
                value={form.name}
              />
            </label>
            <label className="grid gap-2 text-sm text-ink-soft">
              Type
              <Select
                onChange={(event) => setForm((current) => ({ ...current, asset_type: event.target.value }))}
                value={form.asset_type}
              >
                <option value="web_app">Web app</option>
                <option value="database">Database</option>
                <option value="repository">Repository</option>
                <option value="dataset">Dataset</option>
                <option value="cloud_service">Cloud service</option>
                <option value="staff_account_system">Staff account system</option>
                <option value="social_media_channel">Social media channel</option>
                <option value="internal_tool">Internal tool</option>
                <option value="other">Other</option>
              </Select>
            </label>
            <label className="grid gap-2 text-sm text-ink-soft">
              Owner name
              <Input
                onChange={(event) =>
                  setForm((current) => ({ ...current, owner_name: event.target.value }))
                }
                value={form.owner_name}
              />
            </label>
            <label className="grid gap-2 text-sm text-ink-soft">
              Criticality
              <Select
                onChange={(event) => setForm((current) => ({ ...current, criticality: event.target.value }))}
                value={form.criticality}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </Select>
            </label>
            <label className="grid gap-2 text-sm text-ink-soft">
              Data sensitivity
              <Select
                onChange={(event) =>
                  setForm((current) => ({ ...current, data_sensitivity: event.target.value }))
                }
                value={form.data_sensitivity}
              >
                <option value="public">Public</option>
                <option value="internal">Internal</option>
                <option value="confidential">Confidential</option>
                <option value="sensitive">Sensitive</option>
                <option value="highly_sensitive">Highly sensitive</option>
              </Select>
            </label>
            <label className="flex items-center gap-3 rounded-lg border border-paper-line bg-paper px-3 py-2 text-sm text-ink-soft">
              <input
                checked={form.internet_exposed}
                className="h-4 w-4 accent-civic-teal"
                onChange={(event) =>
                  setForm((current) => ({ ...current, internet_exposed: event.target.checked }))
                }
                type="checkbox"
              />
              Internet exposed
            </label>
            <label className="grid gap-2 text-sm text-ink-soft">
              Vendor
              <Input
                onChange={(event) => setForm((current) => ({ ...current, vendor: event.target.value }))}
                value={form.vendor}
              />
            </label>
            <label className="grid gap-2 text-sm text-ink-soft">
              Product
              <Input
                onChange={(event) => setForm((current) => ({ ...current, product: event.target.value }))}
                value={form.product}
              />
            </label>
            <label className="grid gap-2 text-sm text-ink-soft">
              Version
              <Input
                onChange={(event) => setForm((current) => ({ ...current, version: event.target.value }))}
                value={form.version}
              />
            </label>
            <label className="grid gap-2 text-sm text-ink-soft">
              Tags
              <Input
                onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
                placeholder="demo, public-facing"
                value={form.tags}
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm text-ink-soft">
            Description
            <Textarea
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              value={form.description}
            />
          </label>

          <div className="flex justify-end">
            <Button disabled={isSaving} type="submit" variant="primary">
              {isSaving ? "Creating" : "Create Asset"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
