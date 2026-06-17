import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";

import { Badge } from "../../components/ui/Badge";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { SeverityBadge } from "../../components/ui/SeverityBadge";
import { useApiItem } from "../../hooks/useApiData";
import { formatDateTime, formatLabel } from "../../lib/utils";
import type { Asset } from "../../types/api";

export function AssetDetailPage() {
  const { id } = useParams();
  const { data: asset, isLoading, error } = useApiItem<Asset>(id ? `/api/assets/${id}/` : null);

  if (isLoading) return <LoadingState label="Loading asset" />;
  if (error) return <ErrorState message={error} />;
  if (!asset) return <EmptyState description="The requested asset could not be found." title="Asset not found" />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <nav className="mb-1 text-xs text-ink-soft">
          <Link to="/assets" className="transition-colors hover:text-ink">
            Assets
          </Link>{" "}
          / {asset.name}
        </nav>
        <h1 className="font-display text-xl font-semibold text-ink">{asset.name}</h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <SeverityBadge severity={asset.criticality} />
          <Badge variant="neutral">{formatLabel(asset.asset_type)}</Badge>
          {asset.internet_exposed && <Badge variant="rose">Internet Exposed</Badge>}
        </div>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader
          title="Details"
          description={asset.description || "No description provided."}
        />
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Detail label="Type"             value={formatLabel(asset.asset_type)} />
          <Detail label="Criticality"      value={<SeverityBadge severity={asset.criticality} />} />
          <Detail label="Internet exposure" value={asset.internet_exposed ? "Exposed" : "Not exposed"} />
          <Detail label="Data sensitivity" value={formatLabel(asset.data_sensitivity)} />
          <Detail label="Owner"            value={asset.owner_name || "Not set"} />
          <Detail label="Vendor / Product" value={[asset.vendor, asset.product].filter(Boolean).join(" / ") || "Not set"} />
          <Detail label="Version"          value={asset.version || "Not set"} />
          <Detail label="Created by"       value={asset.created_by_email || "Not set"} />
          <Detail label="Last updated"     value={formatDateTime(asset.updated_at)} />
        </CardContent>
      </Card>

      {/* Tags */}
      {asset.tags.length > 0 && (
        <Card>
          <CardHeader title="Tags" />
          <CardContent className="flex flex-wrap gap-2">
            {asset.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}
          </CardContent>
        </Card>
      )}

      {/* Linked risk events */}
      <Card>
        <CardHeader title="Linked Risk Events" />
        <CardContent>
          <EmptyState
            title="No linked risk events yet"
            description="Linked risk events will appear here as modules generate findings for this asset."
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-paper-line bg-paper-card p-4">
      <p className="text-xs uppercase text-ink-soft">{label}</p>
      <div className="mt-2 text-sm font-medium text-ink">{value}</div>
    </div>
  );
}
