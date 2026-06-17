import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { ButtonLink } from "../../components/ui/Button";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Input } from "../../components/ui/Input";
import { LoadingState } from "../../components/ui/LoadingState";
import { Select } from "../../components/ui/Select";
import { SeverityBadge } from "../../components/ui/SeverityBadge";
import { useApiList } from "../../hooks/useApiData";
import { useAuth } from "../../hooks/useAuth";
import { canCreateOperationalRecords } from "../../lib/auth";
import { formatDateTime, formatLabel } from "../../lib/utils";
import type { Asset } from "../../types/api";

export function AssetsPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useApiList<Asset>("/api/assets/");
  const [search, setSearch] = useState("");
  const [criticality, setCriticality] = useState("");
  const [assetType, setAssetType] = useState("");

  const filteredAssets = useMemo(() => {
    const normalizedSearch = search.toLowerCase();
    return data.filter((asset) => {
      const text = `${asset.name} ${asset.asset_type} ${asset.criticality} ${asset.vendor} ${asset.product}`.toLowerCase();
      return (
        (!normalizedSearch || text.includes(normalizedSearch)) &&
        (!criticality || asset.criticality === criticality) &&
        (!assetType || asset.asset_type === assetType)
      );
    });
  }, [assetType, criticality, data, search]);

  if (isLoading) return <LoadingState label="Loading assets" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          action={
            canCreateOperationalRecords(user) ? (
              <ButtonLink to="/assets/new" variant="primary">
                <Plus aria-hidden="true" className="h-4 w-4" />
                New Asset
              </ButtonLink>
            ) : null
          }
          description="Systems, datasets, repositories, and services that future risk signals can attach to."
          title="Assets"
        />
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_13rem_13rem]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-ink-soft" />
              <Input
                className="pl-9"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search assets"
                value={search}
              />
            </label>
            <Select onChange={(event) => setAssetType(event.target.value)} value={assetType}>
              <option value="">All types</option>
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
            <Select onChange={(event) => setCriticality(event.target.value)} value={criticality}>
              <option value="">All criticality</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </Select>
          </div>

          {filteredAssets.length ? (
            <DataTable
              columns={[
                {
                  key: "name",
                  header: "Name",
                  cell: (asset) => (
                    <Link className="font-medium text-ink hover:text-orange-ink" to={`/assets/${asset.id}`}>
                      {asset.name}
                    </Link>
                  ),
                },
                { key: "type", header: "Type", cell: (asset) => formatLabel(asset.asset_type) },
                {
                  key: "criticality",
                  header: "Criticality",
                  cell: (asset) => <SeverityBadge severity={asset.criticality} />,
                },
                { key: "exposed", header: "Internet", cell: (asset) => (asset.internet_exposed ? "Exposed" : "No") },
                { key: "data", header: "Data", cell: (asset) => formatLabel(asset.data_sensitivity) },
                {
                  key: "vendor",
                  header: "Vendor/Product",
                  cell: (asset) => [asset.vendor, asset.product].filter(Boolean).join(" / ") || "Not set",
                },
                { key: "updated", header: "Updated", cell: (asset) => formatDateTime(asset.updated_at), className: "whitespace-nowrap" },
              ]}
              data={filteredAssets}
              getRowKey={(asset) => asset.id}
            />
          ) : (
            <EmptyState
              action={
                canCreateOperationalRecords(user) ? (
                  <ButtonLink to="/assets/new" variant="primary">
                    New Asset
                  </ButtonLink>
                ) : undefined
              }
              description="Assets represent systems, datasets, repositories, or services that CivicSec Lab can connect to future risk signals."
              title="No assets match this view"
            />
          )}

          {!canCreateOperationalRecords(user) ? (
            <p className="text-sm text-ink-soft">Viewer role is read-only for operational records.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
