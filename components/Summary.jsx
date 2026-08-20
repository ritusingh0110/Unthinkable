'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, ListChecks, Lightbulb, StickyNote } from 'lucide-react';

export default function Summary({ summary, key_topics = [], key_decisions = [], important_notes = [] }) {
  return (
    <div className="grid gap-4">
      <Card className="border-primary/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Meeting Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
            {summary || 'No summary generated.'}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Key Topics
              {key_topics.length > 0 && <Badge variant="secondary" className="ml-1">{key_topics.length}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {key_topics.length ? (
              <div className="flex flex-wrap gap-2">
                {key_topics.map((t, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground"
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-primary" />
              Key Decisions
              {key_decisions.length > 0 && <Badge variant="secondary" className="ml-1">{key_decisions.length}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {key_decisions.length ? (
              <ul className="space-y-2 text-sm">
                {key_decisions.map((t, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-primary" />
              Important Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {important_notes.map((t, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
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
