
import React, { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Wrench,
  Boxes,
  BrainCircuit,
  ChartNoAxesCombined,
  LogOut,
  Plus,
  RefreshCw,
  Menu,
  X
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function App() {
  const [token, setToken] = useState(localStorage.getItem("cc_token") || "");
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("cc_user") || "null")
  );

  const [page, setPage] = useState("Dashboard");

  const [data, setData] = useState({
    complaints: [],
    technicians: [],
    assets: [],
    workOrders: [],
    predictions: []
  });

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mobile, setMobile] = useState(false);

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  async function api(path, options = {}) {
    const r = await fetch(API + path, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });

    const j = await r.json().catch(() => ({}));

    if (!r.ok) {
      throw new Error(j.message || "Request failed");
    }

    return j;
  }

  function saveSession(j) {
    localStorage.setItem("cc_token", j.token);
    localStorage.setItem("cc_user", JSON.stringify(j.user));

    setToken(j.token);
    setUser(j.user);
  }

  function logout() {
    localStorage.removeItem("cc_token");
    localStorage.removeItem("cc_user");

    setToken("");
    setUser(null);

    setData({
      complaints: [],
      technicians: [],
      assets: [],
      workOrders: [],
      predictions: []
    });
  }

  async function load() {
  if (!token) return;

  setBusy(true);
  setError("");

  try {
    const jobs = [api("/complaints")];

    const canAccessWorkOrders = ["Admin", "Technician"].includes(user?.role);

    if (canAccessWorkOrders) {
      jobs.push(api("/work-orders"));
    }

    if (user?.role === "Admin") {
      jobs.push(
        api("/technicians"),
        api("/assets"),
        api("/predictions")
      );
    }

    const results = await Promise.all(jobs);

    let index = 1;

    const next = {
      complaints: results[0].complaints || [],
      workOrders: [],
      technicians: [],
      assets: [],
      predictions: []
    };

    if (canAccessWorkOrders) {
      next.workOrders = results[index++].workOrders || [];
    }

    if (user?.role === "Admin") {
      next.technicians = results[index++].technicians || [];
      next.assets = results[index++].assets || [];
      next.predictions = results[index++].predictions || [];
    }

    setData(next);
  } catch (e) {
    setError(e.message);
  } finally {
    setBusy(false);
  }
}

  useEffect(() => {
    if (token) load();
  }, [token, user?.role]);

  const nav = useMemo(() => {
  const base = [
    ["Dashboard", LayoutDashboard],
    ["Complaints", ClipboardList]
  ];

  if (["Admin", "Technician"].includes(user?.role)) {
    base.push(["Work Orders", Wrench]);
  }

  if (user?.role === "Admin") {
    base.push(
      ["Technicians", Users],
      ["Assets", Boxes],
      ["Predictions", BrainCircuit],
      ["Analytics", ChartNoAxesCombined]
    );
  }

  return base;
}, [user]);

  if (!token || !user) {
    return <Auth onSuccess={saveSession} />;
  }

  const counts = {
    total: data.complaints.length,
    pending: data.complaints.filter(x => x.status === "Pending").length,
    progress: data.complaints.filter(x => x.status === "In Progress").length,
    resolved: data.complaints.filter(x => x.status === "Resolved").length
  };

  async function action(fn) {
    setError("");

    try {
      await fn();
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="layout">

      <aside className={mobile ? "sidebar open" : "sidebar"}>

        <div className="brand">
          <span className="brand-icon">CC</span>

          <div>
            <b>CampusCare</b>
            <small>AI INFRASTRUCTURE</small>
          </div>

          <button
            className="mobile-close"
            onClick={() => setMobile(false)}
          >
            <X />
          </button>
        </div>

        <div className="profile">
          <div className="avatar">
            {user.name?.[0]?.toUpperCase()}
          </div>

          <div>
            <b>{user.name}</b>
            <small>{user.role}</small>
          </div>
        </div>

        <nav>
          {nav.map(([n, I]) => (
            <button
              key={n}
              className={page === n ? "active" : ""}
              onClick={() => {
                setPage(n);
                setMobile(false);
              }}
            >
              <I size={18} />
              {n}
            </button>
          ))}
        </nav>

        <button className="logout" onClick={logout}>
          <LogOut size={18} />
          Sign out
        </button>

      </aside>

      <main className="main">

        <header>
          <button
            className="menu-btn"
            onClick={() => setMobile(true)}
          >
            <Menu />
          </button>

          <div>
            <h1>{page}</h1>
            <p>Campus infrastructure management workspace</p>
          </div>

          <button className="outline" onClick={load} disabled={busy}>
            <RefreshCw size={16} />
            {busy ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        {error && <div className="error">{error}</div>}

        {page === "Dashboard" && (
          <>
            <div className="welcome">
              <div>
                <span className="eyebrow">OVERVIEW</span>
                <h2>Good day, {user.name.split(" ")[0]}.</h2>
                <p>Here is the current campus maintenance overview.</p>
              </div>

              <span className="welcome-icon">
                <LayoutDashboard size={34} />
              </span>
            </div>

            <div className="stats">
              <Stat label="Total complaints" value={counts.total} />
              <Stat label="Pending" value={counts.pending} />
              <Stat label="In progress" value={counts.progress} />
              <Stat label="Resolved" value={counts.resolved} />

              {user.role === "Admin" && (
                <>
                  <Stat label="Technicians" value={data.technicians.length} />
                  <Stat label="Assets" value={data.assets.length} />
                </>
              )}
            </div>

            <Panel title="Recent complaints">
              <ComplaintList items={data.complaints.slice(0, 6)} />
            </Panel>
          </>
        )}

        {page === "Complaints" && (
          <Complaints
            items={data.complaints}
            role={user.role}
            api={api}
            action={action}
          />
        )}

        {page === "Technicians" && user.role === "Admin" && (
          <Technicians
            items={data.technicians}
            api={api}
            action={action}
          />
        )}

        {page === "Assets" && user.role === "Admin" && (
          <Assets
            items={data.assets}
            api={api}
            action={action}
          />
        )}

        {page === "Work Orders" &&
  ["Admin", "Technician"].includes(user.role) && (
    <WorkOrders
      items={data.workOrders}
      technicians={data.technicians}
      role={user.role}
      api={api}
      action={action}
    />
)}

        {page === "Predictions" && user.role === "Admin" && (
          <>
            <div className="stats">
              <Stat
                label="Critical"
                value={data.predictions.filter(x => x.riskLevel === "Critical").length}
              />

              <Stat
                label="High"
                value={data.predictions.filter(x => x.riskLevel === "High").length}
              />

              <Stat
                label="Medium"
                value={data.predictions.filter(x => x.riskLevel === "Medium").length}
              />

              <Stat
                label="Low"
                value={data.predictions.filter(x => x.riskLevel === "Low").length}
              />
            </div>

            <Panel title="Asset risk predictions">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Location</th>
                      <th>Risk score</th>
                      <th>Risk level</th>
                      <th>Recommendation</th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.predictions.map(p => (
                      <tr key={p.assetId}>
                        <td>
                          {p.assetName}
                          <small>{p.assetCode}</small>
                        </td>

                        <td>{p.location}</td>
                        <td>{p.riskScore}/100</td>
                        <td><Pill value={p.riskLevel} /></td>
                        <td>{p.recommendation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </>
        )}

        {page === "Analytics" && user.role === "Admin" && (
          <Analytics
            complaints={data.complaints}
            workOrders={data.workOrders}
            predictions={data.predictions}
          />
        )}

      </main>
    </div>
  );
}


/* AUTHENTICATION */

function Auth({ onSuccess }) {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("Student");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();

    setError("");
    setBusy(true);

    try {
      const endpoint = mode === "login"
        ? "/auth/login"
        : role === "Technician"
          ? "/auth/register-technician"
          : "/auth/register";

      const body = mode === "login"
        ? { email: form.email, password: form.password }
        : { ...form, role };

      const r = await fetch(API + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const j = await r.json();

      if (!r.ok) {
        throw new Error(j.message || "Unable to continue");
      }

      onSuccess(j);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth-card">

        <div className="auth-brand">
          <span className="brand-icon">CC</span>

          <div>
            <b>CampusCare AI</b>
            <small>SMART CAMPUS MAINTENANCE</small>
          </div>
        </div>

        <span className="eyebrow">
          {mode === "login" ? "WELCOME BACK" : "CREATE ACCOUNT"}
        </span>

        <h1>
          {mode === "login"
            ? "Sign in to your workspace"
            : "Join CampusCare"}
        </h1>

        <p className="muted">
          Manage campus facilities, complaints and maintenance.
        </p>

        <form onSubmit={submit}>

          {mode === "register" && (
            <>
              <label>Full name</label>

              <input
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />

              <label>Account type</label>

              <select
                value={role}
                onChange={e => setRole(e.target.value)}
              >
                <option>Student</option>
                <option>Faculty</option>
                <option>Technician</option>
              </select>
            </>
          )}

          <label>Email address</label>

          <input
            type="email"
            required
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />

          <label>Password</label>

          <input
            type="password"
            minLength="8"
            required
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
          />

          {error && <div className="error">{error}</div>}

          <button className="primary full" disabled={busy}>
            {busy
              ? "Please wait..."
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>

        </form>

        <p className="switch">
          {mode === "login"
            ? "New to CampusCare?"
            : "Already have an account?"}

          <button
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
          >
            {mode === "login" ? "Create an account" : "Sign in"}
          </button>
        </p>

        <small className="auth-note">
          Administrator accounts are created by the system administrator.
        </small>

      </div>
    </div>
  );
}


/* COMMON COMPONENTS */

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function Panel({ title, children, action }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h3>{title}</h3>
        {action}
      </div>

      {children}
    </section>
  );
}

function Pill({ value }) {
  return (
    <span className={`pill ${String(value).toLowerCase().replaceAll(" ", "-")}`}>
      {value}
    </span>
  );
}

function ComplaintList({ items }) {
  if (!items.length) {
    return <p className="empty">No complaints to display.</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Complaint</th>
            <th>Category</th>
            <th>Location</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>

        <tbody>
          {items.map(c => (
            <tr key={c._id}>
              <td>
                <b>{c.title}</b>
                <small>{c.description}</small>
              </td>

              <td>{c.category}</td>
              <td>{c.location}</td>
              <td><Pill value={c.priority} /></td>
              <td><Pill value={c.status} /></td>
              <td>{new Date(c.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


/* AI COMPLAINT CLASSIFICATION */

function Complaints({ items, role, api, action }) {
  const [show, setShow] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Electrical",
    location: "",
    priority: "Medium"
  });

  const [suggestion, setSuggestion] = useState(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");

  function openForm() {
    setForm({
      title: "",
      description: "",
      category: "Electrical",
      location: "",
      priority: "Medium"
    });

    setSuggestion(null);
    setAiError("");
    setShow(true);
  }

  async function suggestWithAI() {
    if (!form.title.trim() || !form.description.trim()) {
      setAiError("Enter both complaint title and description first.");
      return;
    }

    setAiBusy(true);
    setAiError("");
    setSuggestion(null);

    try {
      const result = await api("/ai/classify", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          description: form.description
        })
      });

      if (!result.classification) {
        throw new Error("AI did not return a classification.");
      }

      setSuggestion(result.classification);
    } catch (e) {
      setAiError(e.message || "Unable to classify complaint.");
    } finally {
      setAiBusy(false);
    }
  }

  function applySuggestion() {
    if (!suggestion) return;

    setForm(old => ({
      ...old,
      category: suggestion.category,
      priority: suggestion.priority
    }));
  }

  async function submit(e) {
    e.preventDefault();

    await action(async () => {
      await api("/complaints", {
        method: "POST",
        body: JSON.stringify(form)
      });

      setShow(false);
      setSuggestion(null);
      setAiError("");
    });
  }

  return (
    <>
      <Panel
        title="Complaint register"
        action={
          role !== "Technician" && (
            <button className="primary" onClick={openForm}>
              <Plus size={16} /> Submit complaint
            </button>
          )
        }
      >
        <ComplaintList items={items} />
      </Panel>

      {show && (
        <Modal title="Submit complaint" close={() => setShow(false)}>

          <form onSubmit={submit}>

            <label>Title</label>

            <input
              required
              value={form.title}
              onChange={e => {
                setForm({ ...form, title: e.target.value });
                setSuggestion(null);
                setAiError("");
              }}
            />

            <label>Description</label>

            <textarea
              required
              value={form.description}
              onChange={e => {
                setForm({ ...form, description: e.target.value });
                setSuggestion(null);
                setAiError("");
              }}
            />

            <button
              type="button"
              className="outline full"
              onClick={suggestWithAI}
              disabled={aiBusy}
            >
              <BrainCircuit size={16} />

              {aiBusy
                ? "Analysing complaint..."
                : "Suggest Category & Priority with AI"}
            </button>

            {aiError && (
              <div className="error">{aiError}</div>
            )}

            {suggestion && (
              <div className="panel" style={{ marginTop: 12, padding: 14 }}>

                <h3>AI Classification Result</h3>

                <p>
                  <b>Category:</b> {suggestion.category}
                </p>

                <p>
                  <b>Priority:</b> <Pill value={suggestion.priority} />
                </p>

                <p>
                  <b>Specialization:</b> {suggestion.specialization}
                </p>

                <p>
                  <b>Confidence:</b> {suggestion.confidence}
                </p>

                <p>{suggestion.explanation}</p>

                <button
                  type="button"
                  className="primary full"
                  onClick={applySuggestion}
                >
                  Apply AI Suggestion
                </button>

              </div>
            )}

            <label>Category</label>

            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
            >
              {[
                "Electrical",
                "Plumbing",
                "Cleaning",
                "Furniture",
                "Network",
                "Other"
              ].map(x => (
                <option key={x}>{x}</option>
              ))}
            </select>

            <label>Location</label>

            <input
              required
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
            />

            <label>Priority</label>

            <select
              value={form.priority}
              onChange={e => setForm({ ...form, priority: e.target.value })}
            >
              {["Low", "Medium", "High", "Critical"].map(x => (
                <option key={x}>{x}</option>
              ))}
            </select>

            <button className="primary full" type="submit">
              Submit Complaint
            </button>

          </form>

        </Modal>
      )}
    </>
  );
}


/* TECHNICIANS */

function Technicians({ items, api, action }) {
  const [show, setShow] = useState(false);

  const [f, setF] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "Electrical"
  });

  async function submit(e) {
    e.preventDefault();

    await action(async () => {
      await api("/technicians", {
        method: "POST",
        body: JSON.stringify(f)
      });

      setShow(false);

      setF({
        name: "",
        email: "",
        phone: "",
        specialization: "Electrical"
      });
    });
  }

  return (
    <>
      <Panel
        title="Technician directory"
        action={
          <button className="primary" onClick={() => setShow(true)}>
            <Plus size={16} /> Add technician
          </button>
        }
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Specialization</th>
                <th>Open assignments</th>
              </tr>
            </thead>

            <tbody>
              {items.map(t => (
                <tr key={t._id}>
                  <td>{t.name}</td>
                  <td>{t.email}</td>
                  <td>{t.phone}</td>
                  <td>{t.specialization}</td>
                  <td>{t.assignedCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {show && (
        <Modal title="Add technician" close={() => setShow(false)}>
          <form onSubmit={submit}>

            <label>Name</label>
            <input
              required
              value={f.name}
              onChange={e => setF({ ...f, name: e.target.value })}
            />

            <label>Email</label>
            <input
              type="email"
              required
              value={f.email}
              onChange={e => setF({ ...f, email: e.target.value })}
            />

            <label>Phone</label>
            <input
              value={f.phone}
              onChange={e => setF({ ...f, phone: e.target.value })}
            />

            <label>Specialization</label>
            <select
              value={f.specialization}
              onChange={e => setF({ ...f, specialization: e.target.value })}
            >
              {[
                "Electrical",
                "Plumbing",
                "Cleaning",
                "Furniture",
                "Network",
                "General Maintenance"
              ].map(x => (
                <option key={x}>{x}</option>
              ))}
            </select>

            <button className="primary full">Save technician</button>

          </form>
        </Modal>
      )}
    </>
  );
}


/* ASSETS */

function Assets({ items, api, action }) {
  const [show, setShow] = useState(false);

  const [f, setF] = useState({
    assetName: "",
    assetCode: "",
    assetType: "",
    location: "",
    condition: "Good",
    status: "Operational"
  });

  async function submit(e) {
    e.preventDefault();

    await action(async () => {
      await api("/assets", {
        method: "POST",
        body: JSON.stringify(f)
      });

      setShow(false);
    });
  }

  return (
    <>
      <Panel
        title="Campus assets"
        action={
          <button className="primary" onClick={() => setShow(true)}>
            <Plus size={16} /> Register asset
          </button>
        }
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Asset</th>
                <th>Code</th>
                <th>Type</th>
                <th>Location</th>
                <th>Condition</th>
                <th>Status</th>
                <th>Complaints</th>
              </tr>
            </thead>

            <tbody>
              {items.map(a => (
                <tr key={a._id}>
                  <td>{a.assetName}</td>
                  <td>{a.assetCode}</td>
                  <td>{a.assetType}</td>
                  <td>{a.location}</td>
                  <td>{a.condition}</td>
                  <td>{a.status}</td>
                  <td>{a.totalComplaints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {show && (
        <Modal title="Register asset" close={() => setShow(false)}>
          <form onSubmit={submit}>

            {[
              ["assetName", "Asset name"],
              ["assetCode", "Asset code"],
              ["assetType", "Asset type"],
              ["location", "Location"]
            ].map(([k, l]) => (
              <React.Fragment key={k}>
                <label>{l}</label>
                <input
                  required
                  value={f[k]}
                  onChange={e => setF({ ...f, [k]: e.target.value })}
                />
              </React.Fragment>
            ))}

            <label>Condition</label>

            <select
              value={f.condition}
              onChange={e => setF({ ...f, condition: e.target.value })}
            >
              <option>Good</option>
              <option>Fair</option>
              <option>Poor</option>
            </select>

            <button className="primary full">Save asset</button>

          </form>
        </Modal>
      )}
    </>
  );
}


/* WORK ORDERS */

function WorkOrders({ items, technicians, role, api, action }) {
  return (
    <Panel
      title="Maintenance work orders"
      action={
        role === "Admin" && (
          <button
            className="primary"
            onClick={() => action(async () => {
              const result = await api("/work-orders/generate", {
                method: "POST"
              });

              window.alert(
                result.message ||
                `Generated: ${result.created || 0}; skipped: ${result.skipped || 0}`
              );
            })}
          >
            <RefreshCw size={16} /> Generate from risk
          </button>
        )
      }
    >
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Asset</th>
              <th>Risk</th>
              <th>Priority</th>
              <th>Technician</th>
              <th>Status</th>
              <th>Update</th>
            </tr>
          </thead>

          <tbody>
            {items.map(w => (
              <tr key={w._id}>
                <td>{w.asset?.assetName || "Asset"}</td>
                <td>{w.riskScore}</td>
                <td><Pill value={w.priority} /></td>

                <td>
                  {role === "Admin" ? (
                    <select
                      value={w.assignedTechnician?._id || ""}
                      onChange={e => action(() => api(
                        `/work-orders/${w._id}/assign`,
                        {
                          method: "PATCH",
                          body: JSON.stringify({
                            technicianId: e.target.value || null
                          })
                        }
                      ))}
                    >
                      <option value="">Unassigned</option>

                      {technicians.map(t => (
                        <option key={t._id} value={t._id}>
                          {t.name} ({t.specialization})
                        </option>
                      ))}
                    </select>
                  ) : (
                    w.assignedTechnician?.name || "Unassigned"
                  )}
                </td>

                <td><Pill value={w.status} /></td>

                <td>
                  <select
                    value={w.status}
                    onChange={e => action(() => api(
                      `/work-orders/${w._id}/status`,
                      {
                        method: "PATCH",
                        body: JSON.stringify({
                          status: e.target.value
                        })
                      }
                    ))}
                  >
                    <option>Pending</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                  </select>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}


/* ANALYTICS DASHBOARD */

function Analytics({ complaints, workOrders, predictions }) {

  const total = complaints.length;

  const resolved = complaints.filter(
    c => c.status === "Resolved"
  ).length;

  const pending = complaints.filter(
    c => c.status === "Pending"
  ).length;

  const progress = complaints.filter(
    c => c.status === "In Progress"
  ).length;

  const resolution = total
    ? Math.round(resolved / total * 100)
    : 0;

  const categories = [
    "Electrical",
    "Plumbing",
    "Cleaning",
    "Furniture",
    "Network",
    "Other"
  ];

  const priorities = [
    "Critical",
    "High",
    "Medium",
    "Low"
  ];

  const statuses = [
    "Pending",
    "In Progress",
    "Resolved"
  ];

  const categoryData = categories.map(name => ({
    name,
    value: complaints.filter(c => c.category === name).length
  }));

  const priorityData = priorities.map(name => ({
    name,
    value: complaints.filter(c => c.priority === name).length
  }));

  const statusData = statuses.map(name => ({
    name,
    value: complaints.filter(c => c.status === name).length
  }));

  const months = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(
      now.getFullYear(),
      now.getMonth() - i,
      1
    );

    months.push({
      name: d.toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit"
      }),

      year: d.getFullYear(),
      month: d.getMonth(),

      value: complaints.filter(c => {
        const created = new Date(c.createdAt);

        return (
          created.getFullYear() === d.getFullYear() &&
          created.getMonth() === d.getMonth()
        );
      }).length
    });
  }

  const openOrders = workOrders.filter(
    w => w.status !== "Completed"
  ).length;

  const completedOrders = workOrders.filter(
    w => w.status === "Completed"
  ).length;

  const highRisk = predictions.filter(
    p => ["High", "Critical"].includes(p.riskLevel)
  ).length;

  return (
    <>
      <div className="stats">
        <Stat label="Total complaints" value={total} />
        <Stat label="Resolved complaints" value={resolved} />
        <Stat label="Pending complaints" value={pending} />
        <Stat label="Resolution rate" value={`${resolution}%`} />
        <Stat label="Open work orders" value={openOrders} />
        <Stat label="High-risk assets" value={highRisk} />
      </div>

      <div style={styles.analyticsGrid}>

        <ChartPanel title="Complaints by category">
          <BarChart data={categoryData} />
        </ChartPanel>

        <ChartPanel title="Complaints by priority">
          <DonutChart data={priorityData} />
        </ChartPanel>

        <ChartPanel title="Complaint status">
          <DonutChart data={statusData} />
        </ChartPanel>

        <ChartPanel title="Monthly complaint trend">
          <LineChart data={months} />
        </ChartPanel>

      </div>

      <div className="stats">
        <Stat label="Completed work orders" value={completedOrders} />
        <Stat label="In-progress complaints" value={progress} />
        <Stat label="Total work orders" value={workOrders.length} />
      </div>
    </>
  );
}


/* CHART CONTAINERS */

function ChartPanel({ title, children }) {
  return (
    <section
      className="panel"
      style={styles.chartPanel}
    >
      <div className="panel-head">
        <h3>{title}</h3>
      </div>

      {children}
    </section>
  );
}


/* BAR CHART */

function BarChart({ data }) {
  const max = Math.max(1, ...data.map(x => x.value));

  return (
    <div style={styles.chartBars}>

      {data.map(item => (
        <div
          key={item.name}
          style={styles.chartBarRow}
        >
          <span>{item.name}</span>

          <div style={styles.chartBarTrack}>
            <div
              style={{
                ...styles.chartBarFill,
                width: `${item.value / max * 100}%`
              }}
            />
          </div>

          <b>{item.value}</b>
        </div>
      ))}

    </div>
  );
}


/* DOUGHNUT CHART */

function DonutChart({ data }) {
  const colors = [
    "#dc5353",
    "#ed9b38",
    "#3984d6",
    "#28a879",
    "#8766d5",
    "#8492a6"
  ];

  const total = data.reduce(
    (sum, item) => sum + item.value,
    0
  );

  let offset = 0;

  return (
    <div style={styles.donutLayout}>

      <svg
        viewBox="0 0 120 120"
        style={styles.donutSvg}
      >
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="16"
        />

        {data.map((item, index) => {
          const length = total
            ? item.value / total * 282.74
            : 0;

          const currentOffset = offset;
          offset += length;

          return (
            <circle
              key={item.name}
              cx="60"
              cy="60"
              r="45"
              fill="none"
              stroke={colors[index % colors.length]}
              strokeWidth="16"
              strokeDasharray={`${length} ${282.74 - length}`}
              strokeDashoffset={-currentOffset}
              transform="rotate(-90 60 60)"
            />
          );
        })}

        <text
          x="60"
          y="57"
          textAnchor="middle"
          fontSize="17"
          fontWeight="bold"
          fill="currentColor"
        >
          {total}
        </text>

        <text
          x="60"
          y="70"
          textAnchor="middle"
          fontSize="8"
          fill="currentColor"
        >
          Total
        </text>
      </svg>

      <div style={styles.chartLegend}>

        {data.map((item, index) => (
          <div
            key={item.name}
            style={styles.legendItem}
          >
            <span
              style={{
                ...styles.legendDot,
                background: colors[index % colors.length]
              }}
            />

            <span>{item.name}</span>

            <b style={{ marginLeft: "auto" }}>
              {item.value}
            </b>
          </div>
        ))}

      </div>
    </div>
  );
}


/* MONTHLY LINE CHART */

function LineChart({ data }) {
  const max = Math.max(1, ...data.map(x => x.value));

  const points = data.map((item, index) => {
    const x = 15 + index * 70;
    const y = 105 - (item.value / max * 85);

    return `${x},${y}`;
  }).join(" ");

  return (
    <div style={{ width: "100%" }}>

      <svg
        viewBox="0 0 380 145"
        preserveAspectRatio="none"
        style={styles.lineSvg}
      >

        {[20, 60, 100].map(y => (
          <line
            key={y}
            x1="10"
            y1={y}
            x2="370"
            y2={y}
            stroke="#d7dce3"
            strokeDasharray="4 4"
          />
        ))}

        <polyline
          points={points}
          fill="none"
          stroke="#3984d6"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {data.map((item, index) => {
          const x = 15 + index * 70;
          const y = 105 - (item.value / max * 85);

          return (
            <g key={item.name}>
              <circle
                cx={x}
                cy={y}
                r="4"
                fill="#3984d6"
              />

              <text
                x={x}
                y={Math.max(12, y - 9)}
                textAnchor="middle"
                fontSize="9"
                fill="currentColor"
              >
                {item.value}
              </text>
            </g>
          );
        })}

      </svg>

      <div style={styles.lineLabels}>
        {data.map(item => (
          <span key={item.name}>{item.name}</span>
        ))}
      </div>

    </div>
  );
}


/* MODAL */

function Modal({ title, close, children }) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={e => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="modal">

        <div className="panel-head">
          <h3>{title}</h3>

          <button
            className="icon-btn"
            onClick={close}
          >
            <X />
          </button>
        </div>

        {children}

      </div>
    </div>
  );
}


/* ANALYTICS INLINE STYLES */

const styles = {

  analyticsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
    gap: "20px",
    margin: "20px 0"
  },

  chartPanel: {
    minWidth: 0,
    padding: "20px"
  },

  chartBars: {
    display: "flex",
    flexDirection: "column",
    gap: "19px",
    padding: "12px 0"
  },

  chartBarRow: {
    display: "grid",
    gridTemplateColumns: "90px minmax(0, 1fr) 30px",
    alignItems: "center",
    gap: "10px",
    fontSize: "13px"
  },

  chartBarTrack: {
    height: "11px",
    background: "#e9edf2",
    borderRadius: "20px",
    overflow: "hidden"
  },

  chartBarFill: {
    height: "100%",
    background: "#3984d6",
    borderRadius: "20px",
    transition: "width .3s ease"
  },

  donutLayout: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    gap: "15px",
    minHeight: "190px",
    flexWrap: "wrap"
  },

  donutSvg: {
    width: "150px",
    maxWidth: "45%",
    overflow: "visible"
  },

  chartLegend: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    fontSize: "13px",
    minWidth: "115px"
  },

  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },

  legendDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    flexShrink: 0
  },

  lineSvg: {
    width: "100%",
    height: "160px",
    overflow: "visible"
  },

  lineLabels: {
    display: "flex",
    justifyContent: "space-between",
    gap: "3px",
    fontSize: "11px",
    marginTop: "8px"
  }

};

export default App;
