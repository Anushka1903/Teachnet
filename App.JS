const TEACHERS_KEY = "teachnet_teachers";
const REQUESTS_KEY = "teachnet_requests";
const USER_PROFILES_KEY = "teachnet_user_profiles";

const seedTeachers = [
  {
    id: "t-physics-rao",
    name: "Prof. Nikhil Rao",
    title: "Former College Professor, Physics",
    subject: "Physics",
    location: "Bengaluru",
    mode: "Hybrid",
    rate: 1400,
    experience: "14 years",
    email: "nikhil.rao@example.com",
    resume: "https://example.com/prof-rao-resume",
    schedule: "Tue/Thu 6-8 PM; Sat 10 AM-1 PM",
    bio: "Specializes in conceptual physics, engineering entrance preparation, and lab-linked learning.",
    tags: ["IIT-JEE", "NEET", "Mechanics", "College Physics"]
  },
  {
    id: "t-math-mehta",
    name: "Dr. Asha Mehta",
    title: "Assistant Professor, Mathematics",
    subject: "Mathematics",
    location: "Delhi NCR",
    mode: "Online",
    rate: 1200,
    experience: "9 years",
    email: "asha.mehta@example.com",
    resume: "https://example.com/asha-mehta",
    schedule: "Mon/Wed/Fri 7-9 PM; Sun 9-11 AM",
    bio: "Builds strong foundations in algebra, calculus, statistics, and board exam strategy.",
    tags: ["CBSE", "Calculus", "Statistics", "SAT"]
  }
];

const state = {
  teachers: load(TEACHERS_KEY, seedTeachers),
  requests: load(REQUESTS_KEY, []),
  userProfiles: load(USER_PROFILES_KEY, [])
};

const teacherGrid = document.querySelector("#teacherGrid");
const resultCount = document.querySelector("#resultCount");
const subjectFilter = document.querySelector("#subjectFilter");
const modeFilter = document.querySelector("#modeFilter");
const budgetFilter = document.querySelector("#budgetFilter");
const searchInput = document.querySelector("#search");
const profileForm = document.querySelector("#profileForm");
const userProfileForm = document.querySelector("#userProfileForm");
const userProfileList = document.querySelector("#userProfileList");
const requestList = document.querySelector("#requestList");
const contactDialog = document.querySelector("#contactDialog");
const contactForm = document.querySelector("#contactForm");
const dialogTeacherName = document.querySelector("#dialogTeacherName");
const toast = document.querySelector("#toast");

function load(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function save() {
  localStorage.setItem(TEACHERS_KEY, JSON.stringify(state.teachers));
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(state.requests));
  localStorage.setItem(USER_PROFILES_KEY, JSON.stringify(state.userProfiles));
}

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function currency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags;
  return String(tags)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function populateSubjects() {
  const selected = subjectFilter.value || "all";
  const subjects = [...new Set(state.teachers.map((teacher) => teacher.subject).filter(Boolean))].sort();
  subjectFilter.innerHTML = '<option value="all">All subjects</option>';

  subjects.forEach((subject) => {
    const option = document.createElement("option");
    option.value = subject;
    option.textContent = subject;
    subjectFilter.append(option);
  });

  subjectFilter.value = subjects.includes(selected) ? selected : "all";
}

function filteredTeachers() {
  const query = searchInput.value.trim().toLowerCase();
  const subject = subjectFilter.value;
  const mode = modeFilter.value;
  const maxRate = Number(budgetFilter.value || 0);

  return state.teachers.filter((teacher) => {
    const tags = normalizeTags(teacher.tags);
    const searchable = [
      teacher.name,
      teacher.title,
      teacher.subject,
      teacher.location,
      teacher.mode,
      teacher.schedule,
      teacher.bio,
      tags.join(" ")
    ]
      .join(" ")
      .toLowerCase();

    return (
      (!query || searchable.includes(query)) &&
      (subject === "all" || teacher.subject === subject) &&
      (mode === "all" || teacher.mode === mode) &&
      (!maxRate || Number(teacher.rate) <= maxRate)
    );
  });
}

function renderTeachers() {
  const teachers = filteredTeachers();
  resultCount.textContent = `${teachers.length} profile${teachers.length === 1 ? "" : "s"} shown`;

  if (!teachers.length) {
    teacherGrid.innerHTML = '<div class="empty-state">No teachers match these filters yet.</div>';
    return;
  }

  teacherGrid.innerHTML = teachers
    .map((teacher) => {
      const tags = normalizeTags(teacher.tags)
        .slice(0, 4)
        .map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`)
        .join("");

      const resumeUrl = safeUrl(teacher.resume);
      const resume = resumeUrl
        ? `<a class="resume-link" href="${escapeAttribute(resumeUrl)}" target="_blank" rel="noreferrer">View resume</a>`
        : "<span>No resume link added</span>";

      return `
        <article class="teacher-card">
          <div class="card-head">
            <div class="avatar">${escapeHtml(initials(teacher.name))}</div>
            <div>
              <h3>${escapeHtml(teacher.name)}</h3>
              <p>${escapeHtml(teacher.title)}</p>
            </div>
          </div>
          <div class="meta-row">
            <span class="pill alt">${escapeHtml(teacher.subject)}</span>
            <span class="pill alt">${escapeHtml(teacher.mode)}</span>
            <span class="pill alt">${escapeHtml(teacher.location)}</span>
          </div>
          <p>${escapeHtml(teacher.bio)}</p>
          <div class="schedule-box">
            <strong>Available schedule</strong>
            <p>${escapeHtml(teacher.schedule)}</p>
          </div>
          <div class="meta-row">${tags}</div>
          <p><strong>${escapeHtml(teacher.experience)}</strong> experience - <strong>${currency(teacher.rate)}/hr</strong></p>
          <div class="card-actions">
            <button class="button primary" type="button" data-contact="${escapeAttribute(teacher.id)}">Request hire</button>
            ${resume}
          </div>
        </article>
      `;
    })
    .join("");
}

function selectedProfileType() {
  return document.querySelector('input[name="profileType"]:checked').value;
}

function updateProfileTypeFields() {
  const type = selectedProfileType();

  document.querySelectorAll(".student-only").forEach((field) => {
    field.classList.toggle("hidden", type !== "Student");
  });

  document.querySelectorAll(".teacher-only").forEach((field) => {
    field.classList.toggle("hidden", type !== "Teacher");
  });
}

function renderUserProfiles() {
  if (!state.userProfiles.length) {
    userProfileList.innerHTML = '<div class="empty-state">No student or teacher user profiles saved yet.</div>';
    return;
  }

  userProfileList.innerHTML = state.userProfiles
    .map((profile) => {
      const detail =
        profile.type === "Student"
          ? `${profile.studentLevel || "Learning level not added"} - ${profile.studentSubject || "Subject not added"}`
          : `${profile.teacherQualification || "Qualification not added"} - ${profile.teacherSubject || "Subject not added"}`;

      return `
        <article class="user-profile-card">
          <div class="meta-row">
            <span class="pill alt">${escapeHtml(profile.type)}</span>
            <span class="pill">${escapeHtml(profile.mode)}</span>
          </div>
          <h3>${escapeHtml(profile.name)}</h3>
          <p>${escapeHtml(detail)}</p>
          <p>${escapeHtml(profile.summary)}</p>
          <p>Location: ${escapeHtml(profile.location)} - Contact: ${escapeHtml(profile.contact)}</p>
        </article>
      `;
    })
    .join("");
}

function renderRequests() {
  if (!state.requests.length) {
    requestList.innerHTML = '<div class="empty-state">No student requests yet. New hiring requests will appear here.</div>';
    return;
  }

  requestList.innerHTML = state.requests
    .map((request) => `
      <article class="request-item">
        <strong>${escapeHtml(request.studentName)} requested ${escapeHtml(request.teacherName)}</strong>
        <p>${escapeHtml(request.requirement)}</p>
        <p>Contact: ${escapeHtml(request.studentContact)} - ${escapeHtml(request.createdAt)}</p>
      </article>
    `)
    .join("");
}

function openContactForm(teacherId) {
  const teacher = state.teachers.find((item) => item.id === teacherId);
  if (!teacher) return;

  contactForm.reset();
  contactForm.elements.teacherId.value = teacher.id;
  dialogTeacherName.textContent = `Hire ${teacher.name}`;
  contactDialog.showModal();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function safeUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw, window.location.href);
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function refresh() {
  populateSubjects();
  renderTeachers();
  updateProfileTypeFields();
  renderUserProfiles();
  renderRequests();
}

profileForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = new FormData(profileForm);

  const teacher = {
    id: `t-${Date.now()}`,
    name: data.get("name").trim(),
    title: data.get("title").trim(),
    subject: data.get("subject").trim(),
    location: data.get("location").trim(),
    mode: data.get("mode"),
    rate: Number(data.get("rate")),
    experience: data.get("experience").trim(),
    email: data.get("email").trim(),
    resume: data.get("resume").trim(),
    schedule: data.get("schedule").trim(),
    bio: data.get("bio").trim(),
    tags: normalizeTags(data.get("tags"))
  };

  state.teachers.unshift(teacher);
  save();
  profileForm.reset();
  refresh();
  showToast("Teacher profile published.");
  document.querySelector("#directory").scrollIntoView({ behavior: "smooth" });
});

userProfileForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = new FormData(userProfileForm);
  const type = selectedProfileType();

  state.userProfiles.unshift({
    id: `u-${Date.now()}`,
    type,
    name: data.get("userName").trim(),
    contact: data.get("userContact").trim(),
    location: data.get("userLocation").trim(),
    mode: data.get("userMode"),
    studentLevel: data.get("studentLevel").trim(),
    studentSubject: data.get("studentSubject").trim(),
    teacherQualification: data.get("teacherQualification").trim(),
    teacherSubject: data.get("teacherSubject").trim(),
    summary: data.get("userSummary").trim()
  });

  save();
  userProfileForm.reset();
  document.querySelector('input[name="profileType"][value="Student"]').checked = true;
  refresh();
  showToast(`${type} user profile saved.`);
});

teacherGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-contact]");
  if (button) openContactForm(button.dataset.contact);
});

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = new FormData(contactForm);
  const teacher = state.teachers.find((item) => item.id === data.get("teacherId"));
  if (!teacher) return;

  state.requests.unshift({
    teacherId: teacher.id,
    teacherName: teacher.name,
    studentName: data.get("studentName").trim(),
    studentContact: data.get("studentContact").trim(),
    requirement: data.get("requirement").trim(),
    createdAt: new Date().toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    })
  });

  save();
  contactDialog.close();
  renderRequests();
  showToast("Hiring request saved.");
  document.querySelector("#requests").scrollIntoView({ behavior: "smooth" });
});

document.querySelector(".close-dialog").addEventListener("click", () => contactDialog.close());

document.querySelector("#clearRequests").addEventListener("click", () => {
  state.requests = [];
  save();
  renderRequests();
  showToast("Requests cleared.");
});

document.querySelector("#clearUserProfiles").addEventListener("click", () => {
  state.userProfiles = [];
  save();
  renderUserProfiles();
  showToast("User profiles cleared.");
});

document.querySelector("#resetData").addEventListener("click", () => {
  state.teachers = seedTeachers;
  state.requests = [];
  state.userProfiles = [];
  save();
  refresh();
  showToast("Demo data reset.");
});

document.querySelectorAll('input[name="profileType"]').forEach((control) => {
  control.addEventListener("change", updateProfileTypeFields);
});

[searchInput, subjectFilter, modeFilter, budgetFilter].forEach((control) => {
  control.addEventListener("input", renderTeachers);
});

refresh();