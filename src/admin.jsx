import React, { useEffect, useState } from 'react';
import './admin.css';

const API = '/api';
const emptyForms = {
  notices: { title: '', date: '', description: '' },
  gallery: { title: '', url: '' },
  courses: { name: '', duration: '', fees: '', category: 'Engineering', description: '' },
  faculty: { name: '', designation: '', department: '', photo: '' },
  events: { title: '', date: '', time: '', description: '' }
};

export default function Admin({ onExit }) {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [active, setActive] = useState('dashboard');
  const [stats, setStats] = useState({ admissions: 0, notices: 0, gallery: 0, courses: 0, faculty: 0, events: 0 });
  const [data, setData] = useState({ admissions: [], notices: [], gallery: [], courses: [], faculty: [], events: [] });
  const [forms, setForms] = useState(emptyForms);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const logout = async () => {
    try { await fetch(`${API}/logout`, { method: 'POST', headers }); } catch {}
    localStorage.removeItem('adminToken');
    setToken('');
    onExit?.();
  };

  const load = async () => {
    if (!token) return;
    try {
      const [s, a, n, g, c, f, e] = await Promise.all([
        fetch(`${API}/admin/stats`, { headers }), fetch(`${API}/admin/admissions`, { headers }),
        fetch(`${API}/admin/notices`, { headers }), fetch(`${API}/admin/gallery`, { headers }),
        fetch(`${API}/admin/courses`, { headers }), fetch(`${API}/admin/faculty`, { headers }),
        fetch(`${API}/admin/events`, { headers })
      ]);
      if ([s,a,n,g,c,f,e].some(r => r.status === 401)) return logout();
      setStats(await s.json());
      setData({ admissions: await a.json(), notices: await n.json(), gallery: await g.json(), courses: await c.json(), faculty: await f.json(), events: await e.json() });
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (token) load(); }, [token]);

  const login = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const res = await fetch(`${API}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Login failed');
      localStorage.setItem('adminToken', result.token); setToken(result.token);
    } catch (err) { alert(err.message); }
    finally { setBusy(false); }
  };

  const endpointMap = { notices: 'notices', gallery: 'gallery', courses: 'courses', faculty: 'faculty', events: 'events' };
  const saveItem = async (type, e) => {
    e.preventDefault(); setBusy(true);
    try {
      const id = editing?.type === type ? editing.id : null;
      const url = `${API}/admin/${endpointMap[type]}${id ? `/${id}` : ''}`;
      const res = await fetch(url, { method: id ? 'PUT' : 'POST', headers, body: JSON.stringify(forms[type]) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || result.error || 'Save failed');
      setForms({ ...forms, [type]: { ...emptyForms[type] } }); setEditing(null); await load();
    } catch (err) { alert(err.message); }
    finally { setBusy(false); }
  };

  const editItem = (type, item) => { setEditing({ type, id: item.id }); setForms({ ...forms, [type]: { ...emptyForms[type], ...item } }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const deleteItem = async (type, id) => {
    if (!confirm('Delete this item?')) return;
    const res = await fetch(`${API}/admin/${endpointMap[type]}/${id}`, { method: 'DELETE', headers });
    if (res.status === 401) return logout();
    await load();
  };

  if (!token) return <Login credentials={credentials} setCredentials={setCredentials} login={login} busy={busy} />;

  const nav = [
    ['dashboard','📊','Dashboard'], ['admissions','📥','Admissions'], ['notices','📌','Notice Board'],
    ['gallery','🖼️','Gallery'], ['courses','📚','Courses'], ['faculty','👨‍🏫','Faculty'], ['events','📅','Events']
  ];

  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <div className="brand"><div className="brand-mark">AIT</div><div><b>AIT Admin</b><small>Control Center</small></div></div>
      <nav>{nav.map(([id,icon,label]) => <button key={id} className={active===id?'active':''} onClick={()=>setActive(id)}><span>{icon}</span>{label}</button>)}</nav>
      <button className="logout" onClick={logout}>↪ Logout</button>
    </aside>
    <main className="admin-main">
      <header className="admin-top"><div><p className="eyebrow">ADMINISTRATOR</p><h1>{nav.find(x=>x[0]===active)?.[2]}</h1></div><div className="top-actions"><button onClick={load}>↻ Refresh</button><button className="website-btn" onClick={onExit}>🌐 Main Website</button></div></header>
      {active==='dashboard' && <Dashboard stats={stats} data={data} setActive={setActive} />}
      {active==='admissions' && <Admissions rows={data.admissions} deleteItem={deleteItem} />}
      {['notices','gallery','courses','faculty','events'].includes(active) && <Manager type={active} items={data[active]} form={forms[active]} setForm={(v)=>setForms({...forms,[active]:v})} save={saveItem.bind(null,active)} edit={editItem.bind(null,active)} remove={deleteItem.bind(null,active)} editing={editing?.type===active} cancel={()=>{setEditing(null);setForms({...forms,[active]:{...emptyForms[active]}})}} busy={busy} />}
    </main>
  </div>;
}

function Login({ credentials, setCredentials, login, busy }) {
  return <div className="login-page"><div className="login-card"><div className="login-logo">AIT</div><h1>Admin Login</h1><p>Sign in to manage the institute website.</p><form onSubmit={login}><input placeholder="Username" value={credentials.username} onChange={e=>setCredentials({...credentials,username:e.target.value})} required /><input type="password" placeholder="Password" value={credentials.password} onChange={e=>setCredentials({...credentials,password:e.target.value})} required /><button disabled={busy}>{busy?'Checking...':'Login to Dashboard'}</button></form><small>Admin credentials are kept on the server, not in the React code.</small></div></div>;
}

function Dashboard({ stats, data, setActive }) {
  const cards = [['admissions','📥','Applications'],['notices','📌','Notices'],['gallery','🖼️','Gallery Images'],['courses','📚','Courses'],['faculty','👨‍🏫','Faculty'],['events','📅','Events']];
  return <>
    <section className="welcome"><div><span>WELCOME BACK</span><h2>Website Control Center</h2><p>Manage your public website content from one place.</p></div><div className="welcome-icon">⚙️</div></section>
    <div className="stat-grid">{cards.map(([id,icon,label])=><button key={id} className="stat-card" onClick={()=>setActive(id)}><span className="stat-icon">{icon}</span><div><strong>{stats[id]}</strong><small>{label}</small></div><b>→</b></button>)}</div>
    <section className="panel"><div className="panel-head"><h3>Recent Applications</h3><button onClick={()=>setActive('admissions')}>View All</button></div>{data.admissions.slice(0,5).map(a=><div className="mini-row" key={a.id}><div><b>{a.fullName}</b><span>{a.course}</span></div><small>{a.phone}</small></div>)}{!data.admissions.length&&<Empty text="No applications yet."/>}</section>
  </>;
}

function Admissions({ rows, deleteItem }) {
  return <section className="panel"><div className="panel-head"><div><h3>Student Applications</h3><p>{rows.length} total applications</p></div></div><div className="table-wrap"><table><thead><tr><th>Name</th><th>Contact</th><th>Course</th><th>Message</th><th>Action</th></tr></thead><tbody>{rows.map(a=><tr key={a.id}><td><b>{a.fullName}</b></td><td>{a.phone}<br/><small>{a.email}</small></td><td>{a.course}</td><td>{a.message||'—'}</td><td><button className="danger" onClick={()=>deleteItem('admissions',a.id)}>Delete</button></td></tr>)}</tbody></table></div>{!rows.length&&<Empty text="No applications yet."/>}</section>;
}

function Manager({ type, items, form, setForm, save, edit, remove, editing, cancel, busy }) {
  const labels={notices:'Notice Board',gallery:'Gallery',courses:'Courses',faculty:'Faculty',events:'Events'};
  const renderFields=()=>{
    if(type==='notices') return <><input placeholder="Notice title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/><input placeholder="Date (e.g. 28 Sep 2026)" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} required/><textarea placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></>;
    if(type==='gallery') return <><input placeholder="Image title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/><input placeholder="Image URL" value={form.url} onChange={e=>setForm({...form,url:e.target.value})} required/><p className="hint">Use a public image URL. File upload can be added later.</p></>;
    if(type==='courses') return <><input placeholder="Course name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/><div className="form-grid"><input placeholder="Duration" value={form.duration} onChange={e=>setForm({...form,duration:e.target.value})} required/><input placeholder="Fees" value={form.fees} onChange={e=>setForm({...form,fees:e.target.value})}/></div><input placeholder="Category" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/><textarea placeholder="Course description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></>;
    if(type==='faculty') return <><input placeholder="Faculty name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/><div className="form-grid"><input placeholder="Designation" value={form.designation} onChange={e=>setForm({...form,designation:e.target.value})}/><input placeholder="Department" value={form.department} onChange={e=>setForm({...form,department:e.target.value})}/></div><input placeholder="Photo URL" value={form.photo} onChange={e=>setForm({...form,photo:e.target.value})}/></>;
    return <><input placeholder="Event title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/><div className="form-grid"><input placeholder="Date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} required/><input placeholder="Time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/></div><textarea placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></>;
  };
  const renderItem=(item)=> type==='notices'?<><b>{item.title}</b><span>{item.date}</span></>:type==='gallery'?<><img src={item.url} alt=""/><div><b>{item.title}</b><span>Gallery image</span></div></>:type==='courses'?<><b>{item.name}</b><span>{item.duration} • {item.fees} • {item.category}</span></>:type==='faculty'?<>{item.photo&&<img src={item.photo} alt=""/>}<div><b>{item.name}</b><span>{item.designation} • {item.department}</span></div></>:<><b>{item.title}</b><span>{item.date} {item.time&&`• ${item.time}`}</span></>;
  return <><section className="panel editor"><div className="panel-head"><div><h3>{editing?'Edit':'Add'} {labels[type]}</h3><p>Changes are saved directly to SQLite.</p></div></div><form onSubmit={save} className="manager-form">{renderFields()}<div className="form-actions"><button type="submit" disabled={busy}>{busy?'Saving...':editing?'Save Changes':`+ Add ${labels[type].replace(' Board','')}`}</button>{editing&&<button type="button" className="secondary" onClick={cancel}>Cancel</button>}</div></form></section><section className="panel"><div className="panel-head"><h3>Manage {labels[type]}</h3></div><div className="item-list">{items.map(item=><div className="manage-item" key={item.id}><div className="item-content">{renderItem(item)}</div><div className="item-actions"><button onClick={()=>edit(item)}>Edit</button><button className="danger" onClick={()=>remove(item.id)}>Delete</button></div></div>)}{!items.length&&<Empty text={`No ${labels[type].toLowerCase()} found.`}/>}</div></section></>;
}

function Empty({text}){return <div className="empty">{text}</div>}
