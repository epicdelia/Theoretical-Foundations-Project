import { NavigationWrapper, PageTransition } from "@/components/navigation";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavigationWrapper />
      {/* Desktop: Add left margin for side navigation */}
      <div className="lg:pl-64">
        {/* Mobile: Add bottom padding for bottom navigation */}
        <div className="pb-20 lg:pb-0">
          <PageTransition>{children}</PageTransition>
        </div>
      </div>
    </>
  );
}
