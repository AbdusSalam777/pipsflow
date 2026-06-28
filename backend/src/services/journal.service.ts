import { JournalEntry, Goal } from '../models';
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

export class GoalService {
  async create(userId: string, data: {
    title: string;
    type: string;
    target: number;
    current?: number;
    unit?: string;
    deadline?: string;
  }) {
    return Goal.create({
      userId,
      ...data,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
    });
  }

  async findAll(userId: string) {
    return Goal.find({ userId }).sort({ createdAt: -1 });
  }

  async findById(userId: string, id: string) {
    const goal = await Goal.findOne({ _id: id, userId });
    if (!goal) throw new AppError('Goal not found', 404);
    return goal;
  }

  async update(userId: string, id: string, data: Partial<{
    title: string;
    target: number;
    current: number;
    unit: string;
    deadline: string;
    isCompleted: boolean;
  }>) {
    const goal = await Goal.findOneAndUpdate(
      { _id: id, userId },
      { ...data, ...(data.deadline && { deadline: new Date(data.deadline) }) },
      { new: true }
    );
    if (!goal) throw new AppError('Goal not found', 404);

    if (goal.current >= goal.target) {
      goal.isCompleted = true;
      await goal.save();
    }

    return goal;
  }

  async delete(userId: string, id: string) {
    const goal = await Goal.findOneAndDelete({ _id: id, userId });
    if (!goal) throw new AppError('Goal not found', 404);
    return { message: 'Goal deleted' };
  }
}

export const journalService = new JournalService();
export const goalService = new GoalService();
