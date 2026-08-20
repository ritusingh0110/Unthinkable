'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Summary({ summary, key_topics = [], key_decisions = [], important_notes = [] }) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Meeting Summary</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{summary || 'No summary generated.'}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Key Topics</CardTitle></CardHeader>
          <CardContent>
            {key_topics.length ? (
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {key_topics.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">None identified.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Key Decisions</CardTitle></CardHeader>
          <CardContent>
            {key_decisions.length ? (
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {key_decisions.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">None identified.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {important_notes.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Important Notes</CardTitle></CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {important_notes.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
