import type { AuthorityRow, AuthorityLevel } from '@shared/types';
import { SegmentedControl } from './ui/SegmentedControl';

const AUTHORITY_OPTIONS: { label: string; value: AuthorityLevel }[] = [
  { label: 'Auto', value: 'auto' },
  { label: 'Approval', value: 'approval' },
  { label: 'Never', value: 'never' },
];

export function AuthorityTable({
  rows,
  onChange,
}: {
  rows: AuthorityRow[];
  onChange: (rows: AuthorityRow[]) => void;
}) {
  function updateRow(index: number, level: AuthorityLevel) {
    const updated = rows.map((r, i) => (i === index ? { ...r, level } : r));
    onChange(updated);
  }

  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-black/[0.06]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black/[0.06] bg-black/[0.02]">
            <th className="px-4 py-2.5 text-left text-xs font-medium text-ink-soft">Action</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-ink-soft">Authority</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={index}
              className="border-b border-black/[0.04] last:border-0 hover:bg-black/[0.015] transition-colors"
            >
              <td className="px-4 py-3 text-ink font-medium">{row.action}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end">
                  <SegmentedControl
                    options={AUTHORITY_OPTIONS}
                    value={row.level}
                    onChange={(v) => updateRow(index, v)}
                    groupId={`auth-${index}`}
                    size="sm"
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="py-6 text-center text-xs text-ink-faint">No actions defined yet.</p>
      )}
    </div>
  );
}
