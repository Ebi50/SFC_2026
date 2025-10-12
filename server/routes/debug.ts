import express from 'express';
import { db } from '../database';

const router = express.Router();

console.log('Debug router module loaded');

router.get('/test', (req, res) => {
  console.log('Debug test endpoint called');
  res.json({ message: 'Debug router is working!' });
});

export default router;