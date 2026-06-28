import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, CheckCircle2, Target } from 'lucide-react';
import { toast } from 'sonner';
import { goalApi } from '@/services/trade.service';
import { GOAL_TYPES } from '@/types';
import { PageLoader } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function GoalsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [target, setTarget] = useState(0);
  const [unit, setUnit] = useState('');

  const { data: goals, isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalApi.getAll().then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: () => goalApi.create({ title, type, target, unit }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setShowForm(false);
      setTitle(''); setType(''); setTarget(0); setUnit('');
      toast.success('Goal created');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => goalApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal deleted');
    },
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Goals</h1>
          <p className="text-muted-foreground mt-1">Track and manage your trading milestone objectives</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" /> New Goal
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Card>
              <CardHeader>
                <CardTitle>Create Goal</CardTitle>
                <CardDescription>Define target performance variables for this period</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Monthly profit target" />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select onValueChange={setType}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {GOAL_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target</Label>
                  <Input type="number" value={target || ''} onChange={(e) => setTarget(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="USD, %, trades" />
                </div>
                <div className="sm:col-span-2 pt-2">
                  <Button onClick={() => createMutation.mutate()} disabled={!title || !type || !target}>
                    Create Goal
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        layout
        className="grid gap-6 md:grid-cols-2"
      >
        <AnimatePresence mode="popLayout">
          {goals?.map((goal) => {
            const progress = Math.min((goal.current / goal.target) * 100, 100);
            return (
              <motion.div
                layout
                key={goal._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              >
                <Card className={cn(
                  'h-full relative overflow-hidden',
                  goal.isCompleted ? 'border-profit/30 bg-profit/5 shadow-profit/5' : ''
                )}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-foreground">{goal.title}</h3>
                          {goal.isCompleted && <CheckCircle2 className="h-4.5 w-4.5 text-profit fill-profit/20" />}
                        </div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mt-0.5">{goal.type} Goal</p>
                      </div>
                      <Button variant="ghost" size="icon" className="hover:bg-destructive/10 rounded-lg group" onClick={() => deleteMutation.mutate(goal._id)}>
                        <Trash2 className="h-4.5 w-4.5 text-muted-foreground group-hover:text-destructive transition-colors" />
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-foreground/95">
                          {goal.current} / {goal.target} <span className="text-muted-foreground font-normal">{goal.unit}</span>
                        </span>
                        <span className="font-bold text-primary">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>
                    
                    {goal.isCompleted && (
                      <motion.p 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="mt-3 text-xs text-profit font-bold flex items-center gap-1.5"
                      >
                        ✓ Target achieved! Excellent work.
                      </motion.p>
                    )}
                  </CardContent>
                  <div className="absolute -right-6 -bottom-6 w-12 h-12 rounded-full bg-primary/5 blur-lg pointer-events-none" />
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {goals?.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-2 text-center text-muted-foreground py-20 glass rounded-xl border border-border/20"
          >
            <Target className="h-10 w-10 mx-auto text-muted-foreground/60 mb-3" />
            <p className="font-semibold text-foreground/85">No goals set yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">Create objectives to push yourself and improve your trading discipline.</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
