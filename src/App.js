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
                    SUPABASE CRUD SERVICE
========================================================== */

const API = {
  async getTasks() {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

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
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);

    const t = await API.getTasks();
    setTasks(t);

    const categoryMap = {};
    t.forEach((task) => {
      if (!categoryMap[task.difficulty]) {
        categoryMap[task.difficulty] = {
          name: task.difficulty,
          count: 1,
          color:
            task.difficulty === "high"
              ? "#ef4444"
              : task.difficulty === "medium"
              ? "#f59e0b"
              : "#3b82f6",
        };
      } else {
        categoryMap[task.difficulty].count++;
      }
    });

    setCategories(Object.values(categoryMap));
    setLoading(false);
  }

  async function toggleTask(id) {
    const task = tasks.find((t) => t.id === id);
    const newStatus = task.status === "completed" ? "pending" : "completed";

    await API.updateTaskStatus(id, newStatus);
    await loadAll();
  }

  async function openTask(id) {
    const data = await API.getTaskById(id);
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
    await API.addTask(task);
    await loadAll();
    setPage("home");
  }

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
          <h2 className="text-lg font-bold text-gray-800">Tugas Kuliah Hari Ini</h2>
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
                      {task.difficulty}
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

  const TaskDetailPage = () => (
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
              {selectedTask.difficulty}
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
            // eslint-disable-next-line no-restricted-globals
            const ok = confirm("Yakin ingin menghapus tugas ini?");
            if (!ok) return;

            const success = await API.deleteTask(selectedTask.id);

            if (success) {
              alert("🗑️ Tugas berhasil dihapus!");
              await loadAll();
              setPage("home");
            } else {
              alert("❌ Gagal menghapus tugas!");
            }
          }}
          className="w-full py-3 rounded-xl text-white font-semibold bg-red-500 flex justify-center items-center gap-2"
        >
          <Trash2 className="w-5 h-5" /> Hapus Tugas
        </button>
      </div>
    </div>
  );

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

    async function submit() {
      if (!form.title || !form.description || !form.deadline) {
        setMessage("⚠️ Harap isi semua field.");
        return;
      }

      const result = await addNewTask(form);

      if (!result) {
        setMessage("❌ Gagal menyimpan tugas baru.");
        return;
      }

      setMessage("✔️ Tugas berhasil ditambahkan!");

      setTimeout(() => {
        setMessage("");
        setPage("home");
      }, 1000);
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
            className="w-full bg-green-500 text-white p-3 rounded-xl font-semibold"
          >
            Simpan
          </button>
        </div>
      </div>
    );
  };

  /* ==========================================================
                    PAGE: CATEGORIES
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
      <p className="font-semibold text-gray-800">{cat.name}</p>
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

  const CategoryDetailPage = () => (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6">
        <button
          onClick={() => setPage("categories")}
          className="mb-3 text-white"
        >
          ← Kembali
        </button>
        <h1 className="text-2xl font-bold">{selectedCategory.name}</h1>
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

  /* ==========================================================
                    PAGE: STATISTICS
========================================================== */

  const StatisticsPage = () => {
    const completed = tasks.filter((t) => t.status === "completed").length;
    const pending = tasks.filter((t) => t.status === "pending").length;
    const total = tasks.length;

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
                    strokeDasharray={`${(completed / total) * 351} 351`}
                    className="transition-all"
                  />
                </svg>

                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-3xl font-bold">
                    {total > 0
                      ? Math.round((completed / total) * 100)
                      : 0}
                    %
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
      </div>

      <div className="p-5 space-y-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h3 className="font-bold mb-3">Tentang Aplikasi</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Aplikasi ini adalah Progressive Web App (PWA) untuk manajemen tugas
            kuliah harian. Pengguna dapat menambahkan tugas, mengatur deadline,
            menentukan tingkat kesulitan (low, medium, high), memberi status
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
