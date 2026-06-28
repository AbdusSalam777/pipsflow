import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { journalApi } from '@/services/trade.service';
import { PageLoader } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';

export default function JournalPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: entries, isLoading } = useQuery({
    queryKey: ['journal'],
    queryFn: () => journalApi.getAll().then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: () => journalApi.create({ title, content, date }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
      resetForm();
      toast.success('Entry created');
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => journalApi.update(editingId!, { title, content, date }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
      resetForm();
      toast.success('Entry updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => journalApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
      toast.success('Entry deleted');
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setTitle('');
    setContent('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const startEdit = (entry: { _id: string; title: string; content: string; date: string }) => {
    setEditingId(entry._id);
    setTitle(entry.title);
    setContent(entry.content);
    setDate(new Date(entry.date).toISOString().split('T')[0]);
    setShowForm(true);
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trading Journal</h1>
          <p className="text-muted-foreground">Document your thoughts and lessons</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-4 w-4" /> New Entry
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingId ? 'Edit Entry' : 'New Entry'}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => editingId ? updateMutation.mutate() : createMutation.mutate()}>
                {editingId ? 'Update' : 'Create'}
              </Button>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {entries?.map((entry) => (
          <Card key={entry._id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{entry.title}</h3>
                  <p className="text-xs text-muted-foreground">{formatDate(entry.date)}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(entry)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(entry._id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
              <p className="mt-3 text-sm whitespace-pre-wrap text-muted-foreground">{entry.content}</p>
            </CardContent>
          </Card>
        ))}
        {entries?.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No journal entries yet. Start writing!</p>
        )}
      </div>
    </div>
  );
}
