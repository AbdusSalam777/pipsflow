import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { tradeApi } from '@/services/trade.service';
import { FOREX_PAIRS, SETUP_TAGS, MISTAKE_TYPES } from '@/types';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface TradeForm {
  pair: string;
  direction: 'Long' | 'Short';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  result: 'Profit' | 'Loss';
  pnl: number;
  tradeNotes: string;
  psychologyNotes: string;
  tags: string[];
  mistakes: string[];
}

export default function AddTradePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [beforeImage, setBeforeImage] = useState<File | null>(null);
  const [afterImage, setAfterImage] = useState<File | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedMistakes, setSelectedMistakes] = useState<string[]>([]);

  const { register, handleSubmit, watch, setValue } = useForm<TradeForm>({
    defaultValues: { direction: 'Long', result: 'Profit', tags: [], mistakes: [] },
  });

  const entryPrice = watch('entryPrice');
  const stopLoss = watch('stopLoss');
  const takeProfit = watch('takeProfit');
  const direction = watch('direction');
  const result = watch('result');

  const calculations = useMemo(() => {
    const entry = Number(entryPrice) || 0;
    const sl = Number(stopLoss) || 0;
    const tp = Number(takeProfit) || 0;
    if (!entry || !sl || !tp) return { risk: 0, reward: 0, rr: 0 };

    let risk: number, reward: number;
    if (direction === 'Long') {
      risk = entry - sl;
      reward = tp - entry;
    } else {
      risk = sl - entry;
      reward = entry - tp;
    }
    const rr = Math.abs(risk) > 0 ? Math.abs(reward / risk) : 0;
    return { risk: Math.abs(risk), reward: Math.abs(reward), rr: Math.round(rr * 100) / 100 };
  }, [entryPrice, stopLoss, takeProfit, direction]);

  const toggleTag = (tag: string) => {
    const updated = selectedTags.includes(tag) ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag];
    setSelectedTags(updated);
    setValue('tags', updated);
  };

  const toggleMistake = (mistake: string) => {
    const updated = selectedMistakes.includes(mistake) ? selectedMistakes.filter((m) => m !== mistake) : [...selectedMistakes, mistake];
    setSelectedMistakes(updated);
    setValue('mistakes', updated);
  };

  const onSubmit = async (data: TradeForm) => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'tags' || key === 'mistakes') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });
      if (beforeImage) formData.append('beforeImage', beforeImage);
      if (afterImage) formData.append('afterImage', afterImage);

      await tradeApi.create(formData);
      toast.success('Trade logged successfully!');
      navigate('/trades');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to create trade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add Trade</h1>
        <p className="text-muted-foreground">Log a new trade entry</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Trade Information</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Pair</Label>
              <Select onValueChange={(v) => setValue('pair', v)}>
                <SelectTrigger><SelectValue placeholder="Select pair" /></SelectTrigger>
                <SelectContent>
                  {FOREX_PAIRS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Direction</Label>
              <Select defaultValue="Long" onValueChange={(v) => setValue('direction', v as 'Long' | 'Short')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Long">Long</SelectItem>
                  <SelectItem value="Short">Short</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Entry Price</Label>
              <Input type="number" step="any" {...register('entryPrice', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Stop Loss</Label>
              <Input type="number" step="any" {...register('stopLoss', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Take Profit</Label>
              <Input type="number" step="any" {...register('takeProfit', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Lot Size</Label>
              <Input type="number" step="0.01" {...register('lotSize', { valueAsNumber: true })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Auto Calculations</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-xs text-muted-foreground">Risk</p><p className="text-lg font-bold">{calculations.risk.toFixed(5)}</p></div>
            <div><p className="text-xs text-muted-foreground">Reward</p><p className="text-lg font-bold">{calculations.reward.toFixed(5)}</p></div>
            <div><p className="text-xs text-muted-foreground">R:R Ratio</p><p className="text-lg font-bold text-primary">{calculations.rr}R</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Result</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button type="button" variant={result === 'Profit' ? 'profit' : 'outline'} onClick={() => setValue('result', 'Profit')}>Profit</Button>
              <Button type="button" variant={result === 'Loss' ? 'loss' : 'outline'} onClick={() => setValue('result', 'Loss')}>Loss</Button>
            </div>
            <div className="space-y-2">
              <Label>{result === 'Profit' ? 'Profit Amount (USD)' : 'Loss Amount (USD)'}</Label>
              <Input type="number" step="0.01" {...register('pnl', { valueAsNumber: true })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Trade Notes</Label>
              <Textarea {...register('tradeNotes')} placeholder="Setup description, market conditions..." />
            </div>
            <div className="space-y-2">
              <Label>Psychology Notes</Label>
              <Textarea {...register('psychologyNotes')} placeholder="Fear, FOMO, Confidence, Revenge Trading..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Setup Tags</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {SETUP_TAGS.map((tag) => (
              <button key={tag} type="button" onClick={() => toggleTag(tag)}
                className={`rounded-full px-3 py-1 text-xs border transition-colors ${selectedTags.includes(tag) ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary'}`}>
                {tag}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Mistakes</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {MISTAKE_TYPES.map((mistake) => (
              <label key={mistake} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={selectedMistakes.includes(mistake)} onCheckedChange={() => toggleMistake(mistake)} />
                {mistake}
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Screenshots</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Before Trade</Label>
              <Input type="file" accept="image/*" onChange={(e) => setBeforeImage(e.target.files?.[0] || null)} />
              {beforeImage && <img src={URL.createObjectURL(beforeImage)} alt="Before" className="mt-2 h-32 rounded-md object-cover" />}
            </div>
            <div className="space-y-2">
              <Label>After Trade</Label>
              <Input type="file" accept="image/*" onChange={(e) => setAfterImage(e.target.files?.[0] || null)} />
              {afterImage && <img src={URL.createObjectURL(afterImage)} alt="After" className="mt-2 h-32 rounded-md object-cover" />}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading} className="flex-1">{loading ? 'Saving...' : 'Save Trade'}</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/trades')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
