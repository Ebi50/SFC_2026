import express from 'express';
import * as training from '../services/trainingService';

const router = express.Router();

// Alle Trainings-Endpunkte gehören zum eingeloggten Nutzer; jede Abfrage filtert nach seiner Session-ID.
router.use((req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Nicht angemeldet.' });
  }
  next();
});

type Handler = (userId: string, req: express.Request) => unknown;

function handle(fn: Handler): express.RequestHandler {
  return (req, res) => {
    try {
      const data = fn(req.session.userId!, req);
      res.json({ success: true, data: data ?? null });
    } catch (error) {
      if (error instanceof training.TrainingValidationError) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Training API error:', error);
      res.status(500).json({ error: 'Interner Fehler beim Trainingsplan.' });
    }
  };
}

// GET /api/training/state?today=YYYY-MM-DD – Einstellungen (beim ersten Aufruf angelegt) und Feedback
router.get('/state', handle((uid, req) => training.getState(uid, req.query.today)));

// PUT /api/training/settings – { dur, rest, change, cycleStart }
router.put('/settings', handle((uid, req) => training.saveSettings(uid, req.body)));

// GET /api/training/log?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/log', handle((uid, req) => training.listLog(uid, req.query.from, req.query.to)));

// PUT /api/training/log – Abhaken (Upsert); DELETE – Rückgängig
router.put('/log', handle((uid, req) => training.upsertLog(uid, req.body)));
router.delete('/log', handle((uid, req) => training.deleteLog(uid, req.body)));

// PUT /api/training/feedback – { exerciseId, level: -2..2 }
router.put('/feedback', handle((uid, req) => training.saveFeedback(uid, req.body)));

// POST /api/training/import – einmalige Übernahme der Browser-Daten
router.post('/import', handle((uid, req) => training.importLocal(uid, req.body)));

// DELETE /api/training/data – alle Trainingsdaten des Nutzers löschen
router.delete('/data', handle(uid => training.deleteAllTrainingData(uid)));

export default router;
