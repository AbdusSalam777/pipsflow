import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { upload } from '../middleware/upload';
import { journalSchema, ruleSchema, updateRuleSchema, reorderRuleSchema, updateProfileSchema } from '../validators';
import * as miscController from '../controllers/misc.controller';

const journalRouter = Router();
journalRouter.use(authenticate);
journalRouter.post('/', validate(journalSchema), miscController.createJournal);
journalRouter.get('/', miscController.getJournals);
journalRouter.get('/:id', miscController.getJournal);
journalRouter.put('/:id', validate(journalSchema), miscController.updateJournal);
journalRouter.delete('/:id', miscController.deleteJournal);

const ruleRouter = Router();
ruleRouter.use(authenticate);
ruleRouter.post('/', validate(ruleSchema), miscController.createRule);
ruleRouter.get('/', miscController.getRules);
ruleRouter.put('/:id', validate(updateRuleSchema), miscController.updateRule);
ruleRouter.put('/:id/reorder', validate(reorderRuleSchema), miscController.reorderRule);
ruleRouter.delete('/:id', miscController.deleteRule);

const profileRouter = Router();
profileRouter.use(authenticate);
profileRouter.get('/', miscController.getProfile);
profileRouter.put('/', validate(updateProfileSchema), miscController.updateProfile);
profileRouter.put('/picture', upload.single('profilePicture'), miscController.updateProfilePicture);
profileRouter.delete('/', miscController.deleteProfile);

export { journalRouter, ruleRouter, profileRouter };
