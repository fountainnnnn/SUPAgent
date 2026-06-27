import express from 'express';

const router = express.Router();

router.get('/', (_req, res): void => {
  res.status(501).json({
    error: 'Real mode (Codex pipeline) lands in Phase 2.',
  });
});

export default router;
