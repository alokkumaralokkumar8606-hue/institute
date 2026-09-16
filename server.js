import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const db = new (sqlite3.verbose().Database)('./database.db', (err) => {
  if (err) console.error('Database connection error:', err.message);
  else console.log('Connected to SQLite database successfully!');
});

const sessions = new Map();

function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
  });
}

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS admissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    course TEXT,
    message TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS notices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    description TEXT DEFAULT '',
    active INTEGER DEFAULT 1
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    duration TEXT NOT NULL,
    fees TEXT DEFAULT '',
    category TEXT DEFAULT 'Other',
    description TEXT DEFAULT ''
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS faculty (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    designation TEXT DEFAULT '',
    department TEXT DEFAULT '',
    photo TEXT DEFAULT ''
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT DEFAULT '',
    description TEXT DEFAULT ''
  )`);

  db.get('SELECT COUNT(*) AS count FROM courses', [], (err, row) => {
    if (!err && row?.count === 0) {
      const seed = [
        ['B.Tech Computer Science & Engineering', '4 Years', '₹1,25,000 / yr', 'Engineering', 'Full-stack web development, AI, Data Structures, Cloud Computing and System Design.'],
        ['B.Tech Electronics & Communication Engineering', '4 Years', '₹1,15,000 / yr', 'Engineering', 'VLSI, Embedded Systems, IoT and Digital Signal Processing.'],
        ['B.Tech Mechanical Engineering', '4 Years', '₹1,10,000 / yr', 'Engineering', 'Thermodynamics, Robotics, CAD/CAM and Industrial Automation.'],
        ['B.Tech Civil Engineering', '4 Years', '₹1,10,000 / yr', 'Engineering', 'Structural Engineering, Surveying and Construction Management.'],
        ['B.Pharm', '4 Years', '₹1,20,000 / yr', 'Pharmacy', 'Pharmacology, Medicinal Chemistry and Drug Formulations.'],
        ['D.Pharm', '2 Years', '₹80,000 / yr', 'Pharmacy', 'Pharmaceutical Care, Hospital and Community Pharmacy.'],
        ['MBA (HR & Finance)', '2 Years', '₹1,40,000 / yr', 'Management', 'Corporate HR, Finance, Accounting and Business Ethics.'],
        ['MCA', '2 Years', '₹95,000 / yr', 'Computer Applications', 'Software Engineering, DevOps, Cloud Architecture and Data Science.']
      ];
      const stmt = db.prepare('INSERT INTO courses (name,duration,fees,category,description) VALUES (?,?,?,?,?)');
      seed.forEach(c => stmt.run(c));
      stmt.finalize();
    }
  });
});

// Public APIs
app.post('/api/admission', async (req, res) => {
  try {
    const { fullName, email, phone, course, message = '' } = req.body;
    if (!fullName || !email || !phone || !course) return res.status(400).json({ success: false, message: 'Required fields missing' });
    const result = await run('INSERT INTO admissions (fullName,email,phone,course,message) VALUES (?,?,?,?,?)', [fullName, email, phone, course, message]);
    res.json({ success: true, id: result.id });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/notices', async (req, res) => {
  try { res.json(await all('SELECT * FROM notices WHERE active=1 ORDER BY id DESC')); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/gallery', async (req, res) => {
  try { res.json(await all('SELECT * FROM gallery ORDER BY id DESC')); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/courses', async (req, res) => {
  try { res.json(await all('SELECT * FROM courses ORDER BY id ASC')); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/faculty', async (req, res) => {
  try { res.json(await all('SELECT * FROM faculty ORDER BY id DESC')); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/events', async (req, res) => {
  try { res.json(await all('SELECT * FROM events ORDER BY id DESC')); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: 'Invalid username or password' });
  }
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, Date.now());
  res.json({ success: true, token });
});
app.post('/api/logout', auth, (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  sessions.delete(token);
  res.json({ success: true });
});

// Admin APIs
app.get('/api/admin/stats', auth, async (req, res) => {
  try {
    const [a, n, g, c, f, e] = await Promise.all([
      get('SELECT COUNT(*) AS count FROM admissions'), get('SELECT COUNT(*) AS count FROM notices WHERE active=1'),
      get('SELECT COUNT(*) AS count FROM gallery'), get('SELECT COUNT(*) AS count FROM courses'),
      get('SELECT COUNT(*) AS count FROM faculty'), get('SELECT COUNT(*) AS count FROM events')
    ]);
    res.json({ admissions:a.count, notices:n.count, gallery:g.count, courses:c.count, faculty:f.count, events:e.count });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/admissions', auth, async (req, res) => {
  try { res.json(await all('SELECT * FROM admissions ORDER BY id DESC')); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/admin/admissions/:id', auth, async (req, res) => {
  try { await run('DELETE FROM admissions WHERE id=?', [req.params.id]); res.json({ success:true }); }
  catch (e) { res.status(500).json({ error:e.message }); }
});

app.get('/api/admin/notices', auth, async (req,res)=>res.json(await all('SELECT * FROM notices ORDER BY id DESC')));
app.post('/api/admin/notices', auth, async (req,res)=>{
  const {title,date,description=''}=req.body; if(!title||!date)return res.status(400).json({message:'Title and date required'});
  try { const r=await run('INSERT INTO notices(title,date,description,active) VALUES(?,?,?,1)',[title,date,description]); res.json({success:true,id:r.id}); } catch(e){res.status(500).json({error:e.message});}
});
app.put('/api/admin/notices/:id', auth, async (req,res)=>{
  const {title,date,description='',active=1}=req.body; try{await run('UPDATE notices SET title=?,date=?,description=?,active=? WHERE id=?',[title,date,description,active?1:0,req.params.id]);res.json({success:true});}catch(e){res.status(500).json({error:e.message});}
});
app.delete('/api/admin/notices/:id', auth, async (req,res)=>{try{await run('DELETE FROM notices WHERE id=?',[req.params.id]);res.json({success:true});}catch(e){res.status(500).json({error:e.message});}});

app.get('/api/admin/gallery', auth, async (req,res)=>res.json(await all('SELECT * FROM gallery ORDER BY id DESC')));
app.post('/api/admin/gallery', auth, async (req,res)=>{const {title,url}=req.body;if(!title||!url)return res.status(400).json({message:'Title and URL required'});try{const r=await run('INSERT INTO gallery(title,url) VALUES(?,?)',[title,url]);res.json({success:true,id:r.id});}catch(e){res.status(500).json({error:e.message});}});
app.put('/api/admin/gallery/:id', auth, async (req,res)=>{const {title,url}=req.body;try{await run('UPDATE gallery SET title=?,url=? WHERE id=?',[title,url,req.params.id]);res.json({success:true});}catch(e){res.status(500).json({error:e.message});}});
app.delete('/api/admin/gallery/:id', auth, async (req,res)=>{try{await run('DELETE FROM gallery WHERE id=?',[req.params.id]);res.json({success:true});}catch(e){res.status(500).json({error:e.message});}});

app.get('/api/admin/courses', auth, async (req,res)=>res.json(await all('SELECT * FROM courses ORDER BY id ASC')));
app.post('/api/admin/courses', auth, async (req,res)=>{const {name,duration,fees='',category='Other',description=''}=req.body;if(!name||!duration)return res.status(400).json({message:'Name and duration required'});try{const r=await run('INSERT INTO courses(name,duration,fees,category,description) VALUES(?,?,?,?,?)',[name,duration,fees,category,description]);res.json({success:true,id:r.id});}catch(e){res.status(500).json({error:e.message});}});
app.put('/api/admin/courses/:id', auth, async (req,res)=>{const {name,duration,fees='',category='Other',description=''}=req.body;try{await run('UPDATE courses SET name=?,duration=?,fees=?,category=?,description=? WHERE id=?',[name,duration,fees,category,description,req.params.id]);res.json({success:true});}catch(e){res.status(500).json({error:e.message});}});
app.delete('/api/admin/courses/:id', auth, async (req,res)=>{try{await run('DELETE FROM courses WHERE id=?',[req.params.id]);res.json({success:true});}catch(e){res.status(500).json({error:e.message});}});

app.get('/api/admin/faculty', auth, async (req,res)=>res.json(await all('SELECT * FROM faculty ORDER BY id DESC')));
app.post('/api/admin/faculty', auth, async (req,res)=>{const {name,designation='',department='',photo=''}=req.body;if(!name)return res.status(400).json({message:'Name required'});try{const r=await run('INSERT INTO faculty(name,designation,department,photo) VALUES(?,?,?,?)',[name,designation,department,photo]);res.json({success:true,id:r.id});}catch(e){res.status(500).json({error:e.message});}});
app.put('/api/admin/faculty/:id', auth, async (req,res)=>{const {name,designation='',department='',photo=''}=req.body;try{await run('UPDATE faculty SET name=?,designation=?,department=?,photo=? WHERE id=?',[name,designation,department,photo,req.params.id]);res.json({success:true});}catch(e){res.status(500).json({error:e.message});}});
app.delete('/api/admin/faculty/:id', auth, async (req,res)=>{try{await run('DELETE FROM faculty WHERE id=?',[req.params.id]);res.json({success:true});}catch(e){res.status(500).json({error:e.message});}});

app.get('/api/admin/events', auth, async (req,res)=>res.json(await all('SELECT * FROM events ORDER BY id DESC')));
app.post('/api/admin/events', auth, async (req,res)=>{const {title,date,time='',description=''}=req.body;if(!title||!date)return res.status(400).json({message:'Title and date required'});try{const r=await run('INSERT INTO events(title,date,time,description) VALUES(?,?,?,?)',[title,date,time,description]);res.json({success:true,id:r.id});}catch(e){res.status(500).json({error:e.message});}});
app.put('/api/admin/events/:id', auth, async (req,res)=>{const {title,date,time='',description=''}=req.body;try{await run('UPDATE events SET title=?,date=?,time=?,description=? WHERE id=?',[title,date,time,description,req.params.id]);res.json({success:true});}catch(e){res.status(500).json({error:e.message});}});
app.delete('/api/admin/events/:id', auth, async (req,res)=>{try{await run('DELETE FROM events WHERE id=?',[req.params.id]);res.json({success:true});}catch(e){res.status(500).json({error:e.message});}});

// Serve the built React app in production.
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));
app.use((req,res,next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
