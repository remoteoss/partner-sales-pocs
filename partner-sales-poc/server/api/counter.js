import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const COUNTER_FILE = path.resolve(__dirname, '../counter.json');

function readCounter() {
  try {
    const data = fs.readFileSync(COUNTER_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    // If file doesn't exist, create it with initial value
    const initial = { value: 1 };
    fs.writeFileSync(COUNTER_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
}

function writeCounter(counter) {
  fs.writeFileSync(COUNTER_FILE, JSON.stringify(counter, null, 2));
}

// GET /api/counter - Get current counter value
export function getCounter(req, res) {
  try {
    const counter = readCounter();
    res.status(200).json(counter);
  } catch (err) {
    console.error('Error reading counter:', err);
    res.status(500).json({ error: 'Failed to read counter' });
  }
}

// POST /api/counter/increment - Increment counter and return new value
export function incrementCounter(req, res) {
  try {
    const counter = readCounter();
    counter.value += 1;
    writeCounter(counter);
    res.status(200).json(counter);
  } catch (err) {
    console.error('Error incrementing counter:', err);
    res.status(500).json({ error: 'Failed to increment counter' });
  }
}

// POST /api/counter/reset - Reset counter to 1
export function resetCounter(req, res) {
  try {
    const counter = { value: 1 };
    writeCounter(counter);
    res.status(200).json(counter);
  } catch (err) {
    console.error('Error resetting counter:', err);
    res.status(500).json({ error: 'Failed to reset counter' });
  }
}

