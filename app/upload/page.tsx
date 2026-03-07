import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import UploadForm from "@/components/UploadForm";
import { Lightbulb } from "lucide-react";

export default function UploadPage() {
  return (
    <div className="flex flex-col min-h-screen pb-24">
      <Header title="Upload" subtitle="Tambah record timesheet" showBack />

      <div className="px-4 py-5 flex-1 space-y-4">
        <section className="card p-5">
          <UploadForm />
        </section>

        <section className="card p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-4 h-4 text-[var(--primary)]" />
            </div>
            <div>
              <h4 className="text-[14px] font-semibold text-[var(--foreground)] mb-1.5">Tips Upload</h4>
              <ul className="text-[13px] text-[var(--muted)] space-y-1">
                <li>Pastikan foto jelas dan tidak blur</li>
                <li>Ambil foto dengan pencahayaan yang baik</li>
                <li>Pastikan semua data timesheet terlihat</li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
