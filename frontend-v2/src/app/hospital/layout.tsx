import TopNav from '@/components/TopNav';

export default function HospitalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="hospital-app min-h-screen flex flex-col">
      <TopNav role="HOSPITAL" />
      <main className="flex-1">{children}</main>
      <footer className="hospital-footer px-6 py-3 flex items-center justify-between">
        <span>▸ Hospital ER Coordination Engine — Real-time case intake.</span>
        <span>Toll-Free SOS: <span className="text-sos-300">108 / 112</span> · © 2026 EMEFast.</span>
      </footer>
    </div>
  );
}
