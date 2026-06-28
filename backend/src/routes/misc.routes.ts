import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { upload } from '../middleware/upload';
import { journalSchema, goalSchema } from '../validators';
import * as miscController from '../controllers/misc.controller';

const journalRouter = Router();
journalRouter.use(authenticate);
journalRouter.post('/', validate(journalSchema), miscController.createJournal);
journalRouter.get('/', miscController.getJournals);
journalRouter.get('/:id', miscController.getJournal);
journalRouter.put('/:id', validate(journalSchema), miscController.updateJournal);
journalRouter.delete('/:id', miscController.deleteJournal);

const goalRouter = Router();
goalRouter.use(authenticate);
goalRouter.post('/', validate(goalSchema), miscController.createGoal);
goalRouter.get('/', miscController.getGoals);
goalRouter.get('/:id', miscController.getGoal);
goalRouter.put('/:id', miscController.updateGoal);
goalRouter.delete('/:id', miscController.deleteGoal);

const profileRouter = Router();
profileRouter.use(authenticate);
profileRouter.get('/', miscController.getProfile);
profileRouter.put('/', miscController.updateProfile);
profileRouter.put('/picture', upload.single('profilePicture'), miscController.updateProfilePicture);
profileRouter.delete('/', miscController.deleteProfile);

export { journalRouter, goalRouter, profileRouter };
