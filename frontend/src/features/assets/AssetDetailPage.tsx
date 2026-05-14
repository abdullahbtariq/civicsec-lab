import { useParams } from "react-router-dom";

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
      <Card>
        <CardHeader description={asset.description || "No description provided."} title={asset.name} />
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Detail label="Type" value={formatLabel(asset.asset_type)} />
          <Detail label="Criticality" value={<SeverityBadge severity={asset.criticality} />} />
          <Detail label="Internet exposure" value={asset.internet_exposed ? "Exposed" : "Not exposed"} />
          <Detail label="Data sensitivity" value={formatLabel(asset.data_sensitivity)} />
          <Detail label="Owner" value={asset.owner_name || "Not set"} />
          <Detail label="Vendor/Product" value={[asset.vendor, asset.product].filter(Boolean).join(" / ") || "Not set"} />
          <Detail label="Version" value={asset.version || "Not set"} />
          <Detail label="Created by" value={asset.created_by_email || "Not set"} />
          <Detail label="Updated" value={formatDateTime(asset.updated_at)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Tags" />
        <CardContent className="flex flex-wrap gap-2">
          {asset.tags.length ? asset.tags.map((tag) => <Badge key={tag}>{tag}</Badge>) : <Badge>No tags</Badge>}
        </CardContent>
      </Card>

      <EmptyState
        description="Linked risk events will appear here as modules generate findings for this asset."
        title="Linked risk events"
      />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-civic-line bg-[#14181d] p-4">
      <p className="text-xs uppercase text-civic-muted">{label}</p>
      <div className="mt-2 text-sm font-medium text-white">{value}</div>
    </div>
  );
}
