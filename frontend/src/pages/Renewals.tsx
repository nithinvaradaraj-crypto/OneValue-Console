import { RefreshCw, TrendingUp } from 'lucide-react';
import { RenewalOracle } from '@/components/renewal/RenewalOracle';

export default function Renewals() {
  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto animate-fade-in">
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Renewals</h1>
          <p className="text-muted-foreground text-sm mt-1 flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-[rgba(var(--color-blue),0.1)] border border-[rgba(var(--color-blue),0.2)]">
              <RefreshCw className="w-3 h-3 text-[rgb(var(--color-blue))]" strokeWidth={2.5} />
              <span className="text-xs font-semibold text-[rgb(var(--color-blue))]">Renewals</span>
            </span>
            <span className="text-muted-foreground/50">&</span>
            <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-[rgba(var(--color-orange),0.1)] border border-[rgba(var(--color-orange),0.2)]">
              <TrendingUp className="w-3 h-3 text-[rgb(var(--color-orange))]" strokeWidth={2.5} />
              <span className="text-xs font-semibold text-[rgb(var(--color-orange))]">Risk</span>
            </span>
          </p>
        </div>
        <RenewalOracle />
      </div>
    </div>
  );
}
