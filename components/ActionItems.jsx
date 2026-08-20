'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckSquare } from 'lucide-react';

export default function ActionItems({ items = [] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-primary" />
          Action Items
          <Badge variant="secondary" className="ml-1">{items.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No action items identified.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">Task</th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide w-44">Owner</th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide w-44">Deadline</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr
                    key={i}
                    className="border-t align-top hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 leading-relaxed">{it.task}</td>
                    <td className="px-4 py-3">
                      {it.owner && it.owner !== 'Not specified' ? (
                        <span className="font-medium">{it.owner}</span>
                      ) : (
                        <span className="text-muted-foreground italic">Not specified</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {it.deadline && it.deadline !== 'Not specified' ? (
                        <span className="font-medium">{it.deadline}</span>
                      ) : (
                        <span className="text-muted-foreground italic">Not specified</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
