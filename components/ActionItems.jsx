'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ActionItems({ items = [] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          Action Items
          <Badge variant="secondary">{items.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No action items identified.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-3 font-medium text-muted-foreground">Task</th>
                  <th className="py-2 pr-3 font-medium text-muted-foreground w-40">Owner</th>
                  <th className="py-2 pr-3 font-medium text-muted-foreground w-40">Deadline</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i} className="border-b last:border-b-0 align-top">
                    <td className="py-2 pr-3">{it.task}</td>
                    <td className="py-2 pr-3">
                      {it.owner && it.owner !== 'Not specified' ? (
                        <span>{it.owner}</span>
                      ) : (
                        <span className="text-muted-foreground italic">Not specified</span>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      {it.deadline && it.deadline !== 'Not specified' ? (
                        <span>{it.deadline}</span>
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
