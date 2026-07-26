import { JournalEntry, StrategyRule } from '../models';
import { AppError } from '../utils/AppError';

export class JournalService {
  async create(userId: string, data: { title: string; content: string; date?: string }) {
    return JournalEntry.create({
      userId,
      title: data.title,
      content: data.content,
      date: data.date ? new Date(data.date) : new Date(),
    });
  }

  async findAll(userId: string) {
    return JournalEntry.find({ userId }).sort({ date: -1 });
  }

  async findById(userId: string, id: string) {
    const entry = await JournalEntry.findOne({ _id: id, userId });
    if (!entry) throw new AppError('Journal entry not found', 404);
    return entry;
  }

  async update(userId: string, id: string, data: Partial<{ title: string; content: string; date: string }>) {
    const entry = await JournalEntry.findOneAndUpdate(
      { _id: id, userId },
      { ...data, ...(data.date && { date: new Date(data.date) }) },
      { new: true }
    );
    if (!entry) throw new AppError('Journal entry not found', 404);
    return entry;
  }

  async delete(userId: string, id: string) {
    const entry = await JournalEntry.findOneAndDelete({ _id: id, userId });
    if (!entry) throw new AppError('Journal entry not found', 404);
    return { message: 'Journal entry deleted' };
  }
}

export class StrategyRuleService {
  async create(userId: string, data: { title: string; description?: string }) {
    // New rules append to the end of the list.
    const last = await StrategyRule.findOne({ userId }).sort({ order: -1 });
    return StrategyRule.create({
      userId,
      title: data.title,
      description: data.description ?? '',
      order: (last?.order ?? -1) + 1,
    });
  }

  async findAll(userId: string) {
    return StrategyRule.find({ userId }).sort({ order: 1 });
  }

  /** Count used to snapshot a trade's adherence denominator at save time. */
  async countActive(userId: string): Promise<number> {
    return StrategyRule.countDocuments({ userId, isActive: true });
  }

  async update(
    userId: string,
    id: string,
    data: Partial<{ title: string; description: string; isActive: boolean }>
  ) {
    const rule = await StrategyRule.findOneAndUpdate({ _id: id, userId }, data, { new: true });
    if (!rule) throw new AppError('Rule not found', 404);
    return rule;
  }

  /** Swaps this rule's order with its neighbor so the list can be reordered without drag-and-drop. */
  async reorder(userId: string, id: string, direction: 'up' | 'down') {
    const rules = await this.findAll(userId);
    const index = rules.findIndex((r) => r._id.toString() === id);
    if (index === -1) throw new AppError('Rule not found', 404);

    const swapWith = direction === 'up' ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= rules.length) return rules;

    const a = rules[index];
    const b = rules[swapWith];
    const aOrder = a.order;
    a.order = b.order;
    b.order = aOrder;
    await Promise.all([a.save(), b.save()]);

    return this.findAll(userId);
  }

  async delete(userId: string, id: string) {
    const rule = await StrategyRule.findOneAndDelete({ _id: id, userId });
    if (!rule) throw new AppError('Rule not found', 404);
    return { message: 'Rule deleted' };
  }
}

export const journalService = new JournalService();
export const strategyRuleService = new StrategyRuleService();
