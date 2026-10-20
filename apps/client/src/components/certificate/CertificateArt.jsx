import { date } from "@/lib/format";

const SERIF = { fontFamily: '"Playfair Display", Georgia, serif' };
const SCRIPT = { fontFamily: '"Great Vibes", cursive' };

/** Classic certificate: white paper, double indigo frame, serif type and a gold seal. */
export default function CertificateArt({ cert, platformName = "Vidya" }) {
  return (
    <div className="mx-auto w-full max-w-3xl rounded-xl bg-white p-3 text-[#2b2b2b] shadow-[0_24px_60px_-30px_rgba(0,0,0,.35)]">
      <div className="rounded-lg border-[3px] border-[#4338f5] p-1.5">
        <div className="grid justify-items-center gap-2 rounded border border-[#4338f5]/40 px-[clamp(1rem,5vw,3.5rem)] py-[clamp(1.5rem,4vw,2.75rem)] text-center">
          <span className="text-2xl font-bold text-[#4338f5]" style={SERIF}>{platformName}</span>
          <h1 className="text-[clamp(1.6rem,4.2vw,2.6rem)] font-bold leading-tight text-[#1f2937]" style={SERIF}>
            Certificate of Completion
          </h1>
          <span className="mt-2 text-sm italic text-[#6b7280]">This is to certify that</span>
          <span className="text-[clamp(2rem,6vw,3.25rem)] leading-tight text-[#1e1b4b]" style={SCRIPT}>{cert.userName}</span>
          <span className="text-sm text-[#6b7280]">has successfully completed the course</span>
          <span className="text-[clamp(1.1rem,2.6vw,1.5rem)] font-bold text-[#1f2937]" style={SERIF}>{cert.courseTitle}</span>
          <span className="text-sm text-[#6b7280]">on {date(cert.issuedAt, { day: "numeric", month: "long", year: "numeric" })} · {cert.hours} hours of content</span>

          <div className="mt-6 grid w-full grid-cols-[1fr_auto_1fr] items-end gap-4">
            <div className="grid justify-items-center gap-1">
              <span className="text-2xl leading-none" style={SCRIPT}>{cert.instructorName}</span>
              <span className="h-px w-36 bg-[#2b2b2b]/50" />
              <span className="text-xs font-semibold">{cert.instructorName}</span>
              <span className="text-[11px] text-[#6b7280]">Instructor</span>
            </div>
            <div className="relative grid size-20 place-items-center rounded-full bg-[#c9a227] text-white shadow-md ring-4 ring-[#e8d48a]">
              <span className="grid size-16 place-items-center rounded-full border border-dashed border-white/70 text-[10px] font-bold uppercase tracking-widest" style={SERIF}>
                {platformName}
              </span>
            </div>
            <div className="grid justify-items-center gap-1">
              <span className="text-2xl leading-none" style={SCRIPT}>{platformName}</span>
              <span className="h-px w-36 bg-[#2b2b2b]/50" />
              <span className="text-xs font-semibold">{platformName}</span>
              <span className="text-[11px] text-[#6b7280]">Platform</span>
            </div>
          </div>
          <span className="mt-4 font-mono text-[11px] text-[#6b7280]">Certificate ID {cert.code}</span>
        </div>
      </div>
    </div>
  );
}
