'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, ListChecks, Lightbulb, StickyNote } from 'lucide-react';

export default function Summary({ summary, key_topics = [], key_decisions = [], important_notes = [] }) {
  return (
    <div className="grid gap-5">
      {/* Featured summary */}
      <Card className="relative overflow-hidden border-primary/20 shadow-sm">
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/[0.06] via-transparent to-transparent" />
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary grid place-items-center">
              <FileText className="h-4 w-4" />
            </div>
            <CardTitle className="text-base">Meeting Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground/90">
            {summary || 'No summary generated.'}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 grid place-items-center">
                <Lightbulb className="h-4 w-4" />
              </div>
              <CardTitle className="text-base">Key Topics</CardTitle>
              {key_topics.length > 0 && <Badge variant="secondary" className="ml-1">{key_topics.length}</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            {key_topics.length ? (
              <div className="flex flex-wrap gap-2">
                {key_topics.map((t, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-full border bg-muted/40 hover:bg-muted/60 transition-colors px-3 py-1 text-xs font-medium text-foreground/90"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">None identified.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 grid place-items-center">
                <ListChecks className="h-4 w-4" />
              </div>
              <CardTitle className="text-base">Key Decisions</CardTitle>
              {key_decisions.length > 0 && <Badge variant="secondary" className="ml-1">{key_decisions.length}</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            {key_decisions.length ? (
              <ul className="space-y-2.5 text-sm">
                {key_decisions.map((t, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="leading-relaxed">{t}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">None identified.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {important_notes.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 grid place-items-center">
                <StickyNote className="h-4 w-4" />
              </div>
              <CardTitle className="text-base">Important Notes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5 text-sm">
              {important_notes.map((t, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />
                  <span className="leading-relaxed">{t}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
