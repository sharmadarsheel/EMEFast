import TopNav from '@/components/TopNav';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-frame">
      <TopNav role="USER" />
      <main className="app-content">{children}</main>
      <footer className="apple-footer">
        <span>EMEFast AI · Ambulance medical coordination</span>
        <span>No dispatch · hospital recommendation & coordination</span>
      </footer>
    </div>
  );
}
