'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, User, Calendar } from 'lucide-react';

export default function ActionItems({ items = [] }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary grid place-items-center">
            <CheckSquare className="h-4 w-4" />
          </div>
          <CardTitle className="text-base">Action Items</CardTitle>
          <Badge variant="secondary" className="ml-1">{items.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No action items identified.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground text-[11px] uppercase tracking-wider">Task</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-[11px] uppercase tracking-wider w-48">
                    <span className="inline-flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Owner</span>
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-[11px] uppercase tracking-wider w-48">
                    <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Deadline</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr
                    key={i}
                    className="border-t align-top hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3.5 leading-relaxed">{it.task}</td>
                    <td className="px-4 py-3.5">
                      {it.owner && it.owner !== 'Not specified' ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-[10px] font-semibold grid place-items-center">
                            {String(it.owner).trim().charAt(0).toUpperCase()}
                          </span>
                          <span className="font-medium">{it.owner}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">Not specified</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {it.deadline && it.deadline !== 'Not specified' ? (
                        <span className="inline-flex items-center rounded-md border bg-muted/40 px-2 py-0.5 text-xs font-medium">
                          {it.deadline}
                        </span>
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
