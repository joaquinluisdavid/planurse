import { ShieldCheck } from 'lucide-react'

export function SafetyNotice() {
  return (
    <aside
      aria-label="Privacy and safety"
      className="text-muted-foreground flex gap-3 rounded-xl border bg-white/60 p-4 text-xs leading-relaxed"
    >
      <ShieldCheck
        aria-hidden="true"
        className="text-primary mt-0.5 size-5 shrink-0"
      />
      <p>
        <strong className="text-foreground">
          No patient-identifying information.
        </strong>{' '}
        Do not enter real names, medical record numbers, diagnoses, addresses,
        dates of birth, or other protected health information. Planurse does not
        replace hospital policy, clinical judgment, supervision, or approved
        clinical references. Personal notes are not official medical records.
      </p>
    </aside>
  )
}
