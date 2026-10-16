import TenantDetail from '@/components/console/TenantDetail';

export default function TenantPage({ params }: { params: { id: string } }) {
  return <TenantDetail id={params.id} />;
}
