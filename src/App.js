import profileImg from "./assets/yus.jpg";
import React, { useState, useEffect } from "react";
import {
  Home,
  Calendar,
  Tag,
  User,
  Plus,
  Check,
  BarChart3,
  Trash2,
} from "lucide-react";
import { supabase } from "./supabaseClient";

/* ==========================================================
                    HELPER
========================================================== */

function formatDifficulty(value) {
  const map = {
    low: "Low",
    medium: "Medium",
    high: "High",
  };
  return map[value] || value || "-";
}

/* ==========================================================
                    SUPABASE CRUD SERVICE
========================================================== */

const API = {
  async getTasks(userId) {
    let query = supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error getTasks:", error);
      return [];
    }

    return data || [];
  },

  async getTaskById(id) {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error getTaskById:", error);
      return null;
    }

    return data;
  },

  async addTask(task) {
    const { data, error } = await supabase
      .from("tasks")
      .insert([task])
      .select()
      .single();

    if (error) {
      console.error("Error addTask:", error);
      return null;
    }

    return data;
  },

  async updateTaskStatus(id, status) {
    const { data, error } = await supabase
      .from("tasks")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updateTaskStatus:", error);
      return null;
    }

    return data;
  },

  async deleteTask(id) {
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      console.error("Error deleteTask:", error);
      return false;
    }

    return true;
  },
};

/* ==========================================================
                        MAIN APP
========================================================== */

export default function App() {
  const [page, setPage] = useState("home");

  // AUTH STATE
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  // TASK STATE
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ===================== AUTH EFFECT ===================== */

  useEffect(() => {
    const initAuth = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("getUser error:", error);
      }
      if (data?.user) {
        setUser(data.user);
      }
      setAuthReady(true);
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setTasks([]);
        setCategories([]);
        setPage("home");
      } else {
        // reload tasks for new user
        loadAll(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===================== LOAD DATA ===================== */

  useEffect(() => {
    if (user) {
      loadAll(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadAll(userIdParam) {
    const currentUserId = userIdParam || user?.id;
    if (!currentUserId) {
      setTasks([]);
      setCategories([]);
      return;
    }

    setLoading(true);

    const t = await API.getTasks(currentUserId);
    setTasks(t);

    const categoryMap = {};
    t.forEach((task) => {
      const key = task.difficulty || "low";
      if (!categoryMap[key]) {
        categoryMap[key] = {
          name: key,
          count: 1,
          color:
            key === "high"
              ? "#ef4444"
              : key === "medium"
              ? "#f59e0b"
              : "#3b82f6",
        };
      } else {
        categoryMap[key].count++;
      }
    });

    setCategories(Object.values(categoryMap));
    setLoading(false);
  }

  async function toggleTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const newStatus = task.status === "completed" ? "pending" : "completed";

    await API.updateTaskStatus(id, newStatus);
    await loadAll();
  }

  async function openTask(id) {
    const data = await API.getTaskById(id);
    if (!data) return;
    setSelectedTask(data);
    setPage("taskDetail");
  }

  async function openCategory(name) {
    const filtered = tasks.filter((t) => t.difficulty === name);

    setSelectedCategory({
      name,
      tasks: filtered,
      count: filtered.length,
      color:
        name === "high" ? "#ef4444" : name === "medium" ? "#f59e0b" : "#3b82f6",
    });

    setPage("categoryDetail");
  }

  async function addNewTask(task) {
    if (!user) return null;

    const payload = {
      ...task,
      user_id: user.id,
    };

    const result = await API.addTask(payload);
    if (result) {
      await loadAll();
    }
    return result;
  }

  /* ==========================================================
                        PAGE: AUTH
========================================================== */

  const AuthPage = () => {
    const [mode, setMode] = useState("login"); // 'login' | 'register'
    const [form, setForm] = useState({ email: "", password: "" });
    const [authError, setAuthError] = useState("");
    const [authLoading, setAuthLoading] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setAuthError("");
      setAuthLoading(true);

      try {
        if (mode === "login") {
          const { error } = await supabase.auth.signInWithPassword({
            email: form.email,
            password: form.password,
          });
          if (error) throw error;
        } else {
          const { error } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
          });
          if (error) throw error;
          window.alert("Registrasi berhasil. Kamu sudah login 👍");
        }
      } catch (err) {
        console.error(err);
        setAuthError(err.message || "Terjadi kesalahan.");
      } finally {
        setAuthLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-500 to-indigo-600 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-1">
            Manajemen Tugas Kuliah Harian
          </h1>
          <p className="text-center text-sm text-gray-500 mb-6">
            Login atau daftar dulu untuk menyimpan tugas di Supabase
          </p>

          <div className="flex justify-center gap-2 mb-6">
            <button
              onClick={() => setMode("login")}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                mode === "login"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setMode("register")}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                mode === "register"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              Register
            </button>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-sm font-semibold mb-1 text-gray-700">Email</p>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                className="w-full p-3 border rounded-xl text-sm"
                placeholder="contoh@undip.ac.id"
              />
            </div>

            <div>
              <p className="text-sm font-semibold mb-1 text-gray-700">
                Password
              </p>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                className="w-full p-3 border rounded-xl text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm mt-2 disabled:opacity-60"
            >
              {authLoading
                ? "Memproses..."
                : mode === "login"
                ? "Login"
                : "Register"}
            </button>
          </form>
        </div>
      </div>
    );
  };

  /* ==========================================================
                        PAGE: HOME
========================================================== */

  const HomePage = () => (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-b-[32px] shadow-md">
        <h1 className="text-3xl font-bold">Halo! 👋</h1>
        <p className="text-blue-100 text-sm mt-2">
          Apa yang ingin kamu kerjakan hari ini?
        </p>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-2xl border border-orange-200 bg-orange-50">
            <p className="text-orange-600 font-semibold">Pending</p>
            <p className="mt-2 text-3xl font-bold text-orange-700">
              {tasks.filter((t) => t.status === "pending").length}
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-green-200 bg-green-50">
            <p className="text-green-600 font-semibold">Selesai</p>
            <p className="mt-2 text-3xl font-bold text-green-700">
              {tasks.filter((t) => t.status === "completed").length}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-800">
            Tugas Kuliah Hari Ini
          </h2>
          <button
            onClick={() => setPage("addTask")}
            className="text-blue-600 font-semibold text-sm"
          >
            + Tambah
          </button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <p className="text-center text-gray-500 py-8">Loading...</p>
          ) : tasks.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">
              Belum ada tugas. Tambah dulu yuk.
            </p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white shadow-md rounded-2xl p-4 flex items-start gap-3 border border-gray-100 cursor-pointer hover:shadow-lg transition"
                onClick={() => openTask(task.id)}
              >
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTask(task.id);
                  }}
                  className={`w-6 h-6 rounded-lg border flex items-center justify-center ${
                    task.status === "completed"
                      ? "bg-green-500 border-green-500"
                      : "border-gray-300"
                  }`}
                >
                  {task.status === "completed" && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </div>

                <div className="flex-1">
                  <p
                    className={`font-semibold ${
                      task.status === "completed"
                        ? "line-through text-gray-400"
                        : "text-gray-800"
                    }`}
                  >
                    {task.title}
                  </p>

                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <Calendar className="w-4 h-4" />
                    {task.deadline}

                    <span
                      className={`ml-3 px-2 py-0.5 rounded-lg text-xs font-medium ${
                        task.difficulty === "high"
                          ? "bg-red-100 text-red-600"
                          : task.difficulty === "medium"
                          ? "bg-yellow-100 text-yellow-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {formatDifficulty(task.difficulty)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  /* ==========================================================
                    PAGE: TASK DETAIL
========================================================== */

  const TaskDetailPage = () => {
    if (!selectedTask) return null;

    return (
      <div className="pb-20 bg-gray-50 min-h-screen">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
          <button onClick={() => setPage("home")} className="mb-3 text-white">
            ← Kembali
          </button>
          <h1 className="text-2xl font-bold">{selectedTask.title}</h1>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h3 className="font-bold text-gray-800 mb-4">Detail Tugas</h3>

            <div className="space-y-3 text-sm">
              <p>
                <span className="text-gray-500">Deskripsi:</span>{" "}
                {selectedTask.description}
              </p>
              <p>
                <span className="text-gray-500">Kesulitan:</span>{" "}
                {formatDifficulty(selectedTask.difficulty)}
              </p>
              <p>
                <span className="text-gray-500">Deadline:</span>{" "}
                {selectedTask.deadline}
              </p>
              <p>
                <span className="text-gray-500">Status:</span>{" "}
                {selectedTask.status}
              </p>
            </div>
          </div>

          <button
            onClick={async () => {
              const ok = window.confirm("Yakin ingin menghapus tugas ini?");
              if (!ok) return;

              const success = await API.deleteTask(selectedTask.id);

              if (success) {
                window.alert("🗑️ Tugas berhasil dihapus!");
                await loadAll();
                setPage("home");
              } else {
                window.alert("❌ Gagal menghapus tugas!");
              }
            }}
            className="w-full py-3 rounded-xl text-white font-semibold bg-red-500 flex justify-center items-center gap-2"
          >
            <Trash2 className="w-5 h-5" /> Hapus Tugas
          </button>
        </div>
      </div>
    );
  };

  /* ==========================================================
                    PAGE: ADD TASK 
========================================================== */

  const AddTaskPage = () => {
    const [form, setForm] = useState({
      title: "",
      description: "",
      deadline: "",
      difficulty: "medium",
      status: "pending",
    });

    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);

    async function submit() {
      if (!form.title || !form.description || !form.deadline) {
        setMessage("⚠️ Harap isi semua field.");
        return;
      }

      setSaving(true);
      const result = await addNewTask(form);
      setSaving(false);

      if (!result) {
        setMessage("❌ Gagal menyimpan tugas baru.");
        return;
      }

      setMessage("✔️ Tugas berhasil ditambahkan!");

      setTimeout(() => {
        setMessage("");
        setPage("home");
      }, 800);
    }

    return (
      <div className="pb-20 bg-gray-50 min-h-screen">
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6">
          <button onClick={() => setPage("home")} className="mb-3 text-white">
            ← Kembali
          </button>
          <h1 className="text-2xl font-bold">Tambah Tugas</h1>
        </div>

        <div className="p-6 space-y-4">
          {message && (
            <div className="p-3 rounded-xl text-center text-sm font-semibold bg-green-100 text-green-700 border border-green-300">
              {message}
            </div>
          )}

          <div>
            <p className="text-sm font-semibold mb-1">Judul</p>
            <input
              type="text"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
              className="w-full p-3 border rounded-xl"
            />
          </div>

          <div>
            <p className="text-sm font-semibold mb-1">Deskripsi</p>
            <textarea
              rows="3"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full p-3 border rounded-xl"
            />
          </div>

          <div>
            <p className="text-sm font-semibold mb-1">Deadline</p>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) =>
                setForm({ ...form, deadline: e.target.value })
              }
              className="w-full p-3 border rounded-xl"
            />
          </div>

          <div>
            <p className="text-sm font-semibold mb-1">Kesulitan</p>
            <select
              value={form.difficulty}
              onChange={(e) =>
                setForm({ ...form, difficulty: e.target.value })
              }
              className="w-full p-3 border rounded-xl"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="w-full bg-green-500 text-white p-3 rounded-xl font-semibold disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    );
  };

  /* ==========================================================
                    PAGE: KESULITAN
========================================================== */

  const CategoriesPage = () => (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-b-[32px]">
        <h1 className="text-2xl font-bold">Kesulitan</h1>
        <p className="text-purple-100 text-sm mt-1">
          Filter berdasar tingkat kesulitan
        </p>
      </div>

      <div className="p-4 grid grid-cols-2 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.name}
            onClick={() => openCategory(cat.name)}
            className="bg-white p-5 rounded-2xl shadow-sm border cursor-pointer hover:shadow-lg transition"
            style={{ borderLeft: `5px solid ${cat.color}` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4" style={{ color: cat.color }} />
              <p className="font-semibold text-gray-800">
                {formatDifficulty(cat.name)}
              </p>
            </div>

            <p className="text-3xl font-bold" style={{ color: cat.color }}>
              {cat.count}
            </p>

            <p className="text-xs text-gray-500">tugas</p>
          </div>
        ))}
      </div>
    </div>
  );

  /* ==========================================================
                    PAGE: CATEGORY DETAIL
========================================================== */

  const CategoryDetailPage = () => {
    if (!selectedCategory) return null;

    return (
      <div className="pb-20 bg-gray-50 min-h-screen">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6">
          <button
            onClick={() => setPage("categories")}
            className="mb-3 text-white"
          >
            ← Kembali
          </button>
          <h1 className="text-2xl font-bold">
            {formatDifficulty(selectedCategory.name)}
          </h1>
          <p className="text-purple-100 text-sm mt-1">
            {selectedCategory.count} tugas
          </p>
        </div>

        <div className="p-4 space-y-4">
          {selectedCategory.tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white p-4 rounded-xl shadow-sm border cursor-pointer hover:shadow-md transition"
              onClick={() => openTask(task.id)}
            >
              <p className="font-semibold text-gray-800">{task.title}</p>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {task.deadline}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* ==========================================================
                    PAGE: STATISTICS
========================================================== */

  const StatisticsPage = () => {
    const completed = tasks.filter((t) => t.status === "completed").length;
    const pending = tasks.filter((t) => t.status === "pending").length;
    const total = tasks.length;

    const low = tasks.filter((t) => t.difficulty === "low").length;
    const medium = tasks.filter((t) => t.difficulty === "medium").length;
    const high = tasks.filter((t) => t.difficulty === "high").length;

    return (
      <div className="pb-20 bg-gray-50 min-h-screen">
        <div className="bg-gradient-to-r from-pink-500 to-rose-600 text-white p-6 rounded-b-[32px]">
          <h1 className="text-2xl font-bold">Statistik</h1>
          <p className="text-rose-100">Lihat progress tugasmu</p>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h3 className="font-bold mb-3">Tingkat Penyelesaian</h3>

            <div className="flex justify-center items-center my-4">
              <div className="relative w-32 h-32">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#10b981"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${total > 0 ? (completed / total) * 351 : 0} 351`}
                    className="transition-all"
                  />
                </svg>

                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-3xl font-bold">
                    {total > 0 ? Math.round((completed / total) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>

            <p className="text-center text-sm text-gray-600">
              {completed} selesai dari {total} tugas
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h3 className="font-bold mb-3">Status Tugas</h3>

            <div className="flex justify-between mb-2">
              <p className="flex gap-2 items-center">
                <span className="w-4 h-4 bg-green-500 rounded"></span>Selesai
              </p>
              <p className="font-semibold">{completed}</p>
            </div>

            <div className="flex justify-between">
              <p className="flex gap-2 items-center">
                <span className="w-4 h-4 bg-orange-500 rounded"></span>Pending
              </p>
              <p className="font-semibold">{pending}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h3 className="font-bold mb-3">Tingkat Kesulitan</h3>

            <div className="space-y-3">
              <div className="flex justify-between">
                <p className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-blue-500 rounded"></span>Low
                </p>
                <p className="font-semibold">{low}</p>
              </div>

              <div className="flex justify-between">
                <p className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-yellow-500 rounded"></span>
                  Medium
                </p>
                <p className="font-semibold">{medium}</p>
              </div>

              <div className="flex justify-between">
                <p className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-red-500 rounded"></span>High
                </p>
                <p className="font-semibold">{high}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ==========================================================
                    PAGE: PROFILE
========================================================== */

  const ProfilePage = () => (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-6 rounded-b-[32px] text-center">
        <div className="w-24 h-24 bg-white rounded-full mx-auto overflow-hidden shadow-md">
          <img
            src={profileImg}
            alt="Foto Profil"
            className="w-full h-full object-cover"
          />
        </div>

        <h1 className="text-2xl font-bold mt-3">Maulana Yusuf Muhammad</h1>
        <p className="text-indigo-100">NIM 21120123140166</p>
        {user && (
          <p className="text-indigo-100 text-xs mt-1">{user.email}</p>
        )}
      </div>

      <div className="p-5 space-y-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h3 className="font-bold mb-3">Tentang Aplikasi</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Aplikasi ini adalah Progressive Web App (PWA) untuk manajemen tugas
            kuliah harian. Pengguna dapat menambahkan tugas, mengatur deadline,
            menentukan tingkat kesulitan (Low, Medium, High), memberi status
            selesai/belum, dan melihat statistik penyelesaian tugas secara
            visual. Aplikasi dibangun menggunakan React, terintegrasi dengan
            Supabase sebagai backend database, dan didesain agar ringan,
            responsif, serta nyaman digunakan di perangkat mobile maupun desktop.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h3 className="font-bold mb-3">Statistik Cepat</h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-blue-600">
                {tasks.length}
              </p>
              <p className="text-xs text-gray-500">Total Tugas</p>
            </div>

            <div>
              <p className="text-3xl font-bold text-green-600">
                {tasks.filter((t) => t.status === "completed").length}
              </p>
              <p className="text-xs text-gray-500">Selesai</p>
            </div>
          </div>
        </div>

        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.alert("Kamu sudah logout.");
          }}
          className="w-full bg-red-500 text-white py-3 rounded-xl font-semibold text-sm"
        >
          Logout
        </button>
      </div>
    </div>
  );

  /* ==========================================================
                    BOTTOM NAVIGATION
========================================================== */

  const BottomNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-xl">
      <div className="flex justify-around items-center h-16">
        <button
          onClick={() => setPage("home")}
          className={`flex flex-col items-center ${
            page === "home" ? "text-blue-600" : "text-gray-400"
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-xs font-medium">Home</span>
        </button>

        <button
          onClick={() => setPage("categories")}
          className={`flex flex-col items-center ${
            page === "categories" ? "text-blue-600" : "text-gray-400"
          }`}
        >
          <Tag className="w-5 h-5" />
          <span className="text-xs font-medium">Kesulitan</span>
        </button>

        <button onClick={() => setPage("addTask")}>
          <div className="bg-blue-600 text-white p-4 rounded-full -mt-10 shadow-md">
            <Plus className="w-6 h-6" />
          </div>
        </button>

        <button
          onClick={() => setPage("statistics")}
          className={`flex flex-col items-center ${
            page === "statistics" ? "text-blue-600" : "text-gray-400"
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-xs font-medium">Statistik</span>
        </button>

        <button
          onClick={() => setPage("profile")}
          className={`flex flex-col items-center ${
            page === "profile" ? "text-blue-600" : "text-gray-400"
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-xs font-medium">Profil</span>
        </button>
      </div>
    </nav>
  );

  /* ==========================================================
                        RENDER PAGE
========================================================== */

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Memuat...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      {page === "home" && <HomePage />}
      {page === "categories" && <CategoriesPage />}
      {page === "taskDetail" && <TaskDetailPage />}
      {page === "categoryDetail" && <CategoryDetailPage />}
      {page === "addTask" && <AddTaskPage />}
      {page === "statistics" && <StatisticsPage />}
      {page === "profile" && <ProfilePage />}
      <BottomNav />
    </div>
  );
}