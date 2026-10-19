import React from 'react';
import { PromptLayout } from '../components';
import { START_COPY, checkCanRecord, type ProblemCopy, type StartProblem } from '../lib/recordingIssues';

/**
 * A recording problem (lib/recordingIssues): image, problem, reason, how to solve, one button.
 * Laid out like the permission screens, with a close × top right.
 * On Reports, a problem night shows the same content inside the night page (NightScreen).
 */
export function ProblemScreen({
  copy,
  cta,
  onCta,
  onClose,
  closeLabel,
  children,
}: {
  copy: ProblemCopy;
  cta: string;
  onCta: () => void;
  onClose?: () => void;
  closeLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <PromptLayout
      art={copy.art}
      title={copy.title}
      body={copy.reason}
      fix={copy.fix}
      cta={cta}
      onCta={onCta}
      onClose={onClose}
      closeLabel={closeLabel}
    >
      {children}
    </PromptLayout>
  );
}

/** At bedtime: recording can't start. Try again checks again and starts if it can; × goes back to Home. */
export function StartProblemScreen({ problem, onRecord, onClose }: { problem: StartProblem; onRecord: () => void; onClose: () => void }) {
  return <ProblemScreen copy={START_COPY[problem]} cta="Try again" onCta={() => !checkCanRecord(true) && onRecord()} onClose={onClose} />;
}
