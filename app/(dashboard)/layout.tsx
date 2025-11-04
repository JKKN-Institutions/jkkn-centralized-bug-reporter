export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='min-h-screen'>
      <div className='mx-auto py-6'>{children}</div>
    </div>
  );
}
