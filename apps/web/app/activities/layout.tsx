export default function ActivitiesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-full font-trirong" lang="th">
      {children}
    </div>
  );
}
