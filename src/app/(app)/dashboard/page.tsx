export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ joined?: string }>;
}) {
  const { joined } = await searchParams;

  return (
    <div className="page">
      {joined && (
        <div className="success-banner">
          You&apos;ve successfully joined {joined} Household!
        </div>
      )}
      <h1>Dashboard</h1>
    </div>
  );
}
