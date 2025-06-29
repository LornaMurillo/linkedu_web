
// JavaScript actualizado con PATCH, PUT y funciones limpias

const API_BASE_URL = "http://localhost:8080";

// DOM Elements
const curriculumForm = document.getElementById("curriculumForm");
const loadCurriculumsBtn = document.getElementById("loadCurriculums");
const curriculumsContainer = document.getElementById("curriculumsContainer");
const updateModal = document.getElementById("updateModal");
const patchModal = document.getElementById("patchModal");
const updateCurriculumForm = document.getElementById("updateCurriculumForm");
const patchCurriculumForm = document.getElementById("patchCurriculumForm");
const closeButtons = document.querySelectorAll(".close");

document.addEventListener("DOMContentLoaded", () => {
  loadCurriculums();
  setupEventListeners();
});

function setupEventListeners() {
  curriculumForm.addEventListener("submit", handleAddCurriculum);
  loadCurriculumsBtn.addEventListener("click", loadCurriculums);
  updateCurriculumForm.addEventListener("submit", handleUpdateCurriculum);
  patchCurriculumForm.addEventListener("submit", handlePatchCurriculum);
  document.getElementById("searchForm").addEventListener("submit", handleSearchCurriculum);
  closeButtons.forEach(btn => btn.addEventListener("click", closeModals));
  window.addEventListener("click", (event) => {
    if (event.target === updateModal || event.target === patchModal) {
      closeModals();
    }
  });
}

function closeModals() {
  updateModal.style.display = "none";
  patchModal.style.display = "none";
}

function openUpdateModal(id, curriculum) {
  document.getElementById("updateCurriculumId").value = id;
  document.getElementById("updateSoftSkills").value = curriculum.softSkills?.join(", ") || "";
  document.getElementById("updateTechnicalSkill").value = curriculum.technicalSkill?.join(", ") || "";
  document.getElementById("updateCertifications").value = curriculum.certifications?.join(", ") || "";
  document.getElementById("updateTitles").value = curriculum.titles?.join(", ") || "";
  updateModal.style.display = "block";
}

function openPatchModal(id, curriculum) {
  document.getElementById("patchCurriculumId").value = id;
  document.getElementById("patchSoftSkills").value = "";
  document.getElementById("patchTechnicalSkill").value = "";
  document.getElementById("patchCertifications").value = "";
  document.getElementById("patchTitles").value = "";
  patchModal.style.display = "block";
}

// Descargar Currículum como archivo TXT
function downloadCurriculum(id, curriculumData) {
  const curriculum = typeof curriculumData === "string" ? JSON.parse(curriculumData) : curriculumData;

  const content = `
CURRÍCULUM PROFESIONAL
======================

ID: ${id}
Fecha de generación: ${new Date().toLocaleDateString()}

HABILIDADES BLANDAS:
${curriculum.softSkills ? curriculum.softSkills.map((skill) => `• ${skill}`).join("\n") : "• Sin habilidades registradas"}

HABILIDADES TÉCNICAS:
${curriculum.technicalSkill ? curriculum.technicalSkill.map((skill) => `• ${skill}`).join("\n") : "• Sin habilidades registradas"}

CERTIFICACIONES:
${curriculum.certifications && curriculum.certifications.length > 0 ? curriculum.certifications.map((cert) => `• ${cert}`).join("\n") : "• Sin certificaciones registradas"}

TÍTULOS ACADÉMICOS:
${curriculum.titles ? curriculum.titles.map((title) => `• ${title}`).join("\n") : "• Sin títulos registrados"}

======================
Generado por LinkEDU
  `.trim();

  const blob = new Blob([content], { type: "text/plain" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `curriculum_${id}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);

  showMessage("Currículum descargado correctamente", "success");
}


async function handleAddCurriculum(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  setLoading(submitBtn, true);
  const formData = new FormData(curriculumForm);
  const curriculumData = buildCurriculumData(formData);
  const errors = validateCurriculumData(curriculumData);
  if (errors.length > 0) {
    showMessage(errors.join(", "), "error");
    setLoading(submitBtn, false);
    return;
  }
  try {
    await apiRequest("/curriculum", "POST", curriculumData);
    showMessage("Currículum creado correctamente", "success");
    curriculumForm.reset();
    loadCurriculums();
  } catch (error) {
    showMessage("Error al crear el currículum: " + error.message, "error");
  } finally {
    setLoading(submitBtn, false);
  }
}

async function handlePatchCurriculum(e) {
  e.preventDefault();
  const id = document.getElementById("patchCurriculumId").value;
  const formData = new FormData(patchCurriculumForm);
  const data = buildCurriculumPatchData(formData);
  try {
    await apiRequest(`/curriculum/${id}`, "PATCH", data);
    showFrameMessage("Currículum editado correctamente");
    closeModals();
    loadCurriculums();
  } catch (err) {
    showFrameMessage("Error al editar: " + err.message, "error");
  }
}

async function handleUpdateCurriculum(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  setLoading(submitBtn, true);
  const id = document.getElementById("updateCurriculumId").value;
  const formData = new FormData(updateCurriculumForm);
  const curriculumData = buildCurriculumData(formData);
  try {
    await apiRequest(`/curriculum/${id}`, "PUT", curriculumData);
    showMessage("Currículum actualizado correctamente", "success");
    closeModals();
    loadCurriculums();
  } catch (error) {
    showMessage("Error al actualizar: " + error.message, "error");
  } finally {
    setLoading(submitBtn, false);
  }
}

async function loadCurriculums() {
  setLoading(loadCurriculumsBtn, true);
  try {
    const curriculums = await apiRequest("/curriculum");
    displayCurriculums(curriculums);
  } catch (error) {
    showMessage("Error al cargar currículums: " + error.message, "error");
    curriculumsContainer.innerHTML = "<p>Error al cargar los datos</p>";
  } finally {
    setLoading(loadCurriculumsBtn, false);
  }
}

function displayCurriculums(curriculums) {
  if (!curriculums || curriculums.length === 0) {
    curriculumsContainer.innerHTML = "<p>No hay currículums registrados</p>";
    return;
  }
  curriculumsContainer.innerHTML = curriculums.map(c => `
    <div class="curriculum-card">
      <h3 class="curriculum-title">Currículum #${c.id}</h3>
      <p><strong>Habilidades Blandas:</strong> ${c.softSkills?.join(", ") || "Ninguna"}</p>
      <p><strong>Habilidades Técnicas:</strong> ${c.technicalSkill?.join(", ") || "Ninguna"}</p>
      <p><strong>Certificaciones:</strong> ${c.certifications?.join(", ") || "Ninguna"}</p>
      <p><strong>Títulos:</strong> ${c.titles?.join(", ") || "Ninguno"}</p>
      <div class="curriculum-actions">
        <button class="btn purple" onclick='openPatchModal(${c.id}, ${JSON.stringify(c).replace(/"/g, "&quot;")})'>Editar</button>
        <button class="btn gray" onclick='openUpdateModal(${c.id}, ${JSON.stringify(c).replace(/"/g, "&quot;")})'>Actualizar</button>
        <button class="btn red" onclick="deleteCurriculum(${c.id})">Eliminar</button>
        <button class="btn green" onclick='downloadCurriculum(${c.id}, ${JSON.stringify(c).replace(/"/g, "&quot;")})'>Descargar</button>
      </div>
    </div>`).join("");
}

function buildCurriculumData(formData) {
  return {
    softSkills: formData.get("softSkills")?.split(",").map(s => s.trim()).filter(Boolean),
    technicalSkill: formData.get("technicalSkill")?.split(",").map(s => s.trim()).filter(Boolean),
    certifications: formData.get("certifications")?.split(",").map(s => s.trim()).filter(Boolean),
    titles: formData.get("titles")?.split(",").map(s => s.trim()).filter(Boolean),
  };
}

function buildCurriculumPatchData(formData) {
  const data = {};
  if (formData.get("softSkills")) data.softSkills = formData.get("softSkills").split(",").map(s => s.trim()).filter(Boolean);
  if (formData.get("technicalSkill")) data.technicalSkill = formData.get("technicalSkill").split(",").map(s => s.trim()).filter(Boolean);
  if (formData.get("certifications")) data.certifications = formData.get("certifications").split(",").map(s => s.trim()).filter(Boolean);
  if (formData.get("titles")) data.titles = formData.get("titles").split(",").map(s => s.trim()).filter(Boolean);
  return data;
}

function validateCurriculumData(data) {
  const errors = [];
  if (!data.softSkills?.length) errors.push("Debe agregar al menos una habilidad blanda");
  if (!data.technicalSkill?.length) errors.push("Debe agregar al menos una habilidad técnica");
  if (!data.titles?.length) errors.push("Debe agregar al menos un título académico");
  return errors;
}

async function apiRequest(endpoint, method = "GET", data = null) {
  const config = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };
  if (data) config.body = JSON.stringify(data);
  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
}

function setLoading(element, isLoading) {
  if (isLoading) {
    element.disabled = true;
    element.innerHTML = '<span class="loading"></span> Cargando...';
  } else {
    element.disabled = false;
    element.innerHTML = element.getAttribute("data-original-text") || "Obtener Cambios";
  }
}

function showMessage(message, type = "success") {
  const msg = document.createElement("div");
  msg.className = `message ${type}`;
  msg.textContent = message;
  const container = document.querySelector(".main-content .container");
  if (container) {
    container.insertBefore(msg, container.firstChild);
    setTimeout(() => msg.remove(), 5000);
  }
}


function showFrameMessage(message, type = "success") {
  const frame = document.createElement("div");
  frame.className = `frame-message ${type}`;
  frame.textContent = message;
  document.body.appendChild(frame);
  setTimeout(() => frame.classList.add("show"), 10);
  setTimeout(() => {
    frame.classList.remove("show");
    setTimeout(() => frame.remove(), 500);
  }, 4000);
}

async function deleteCurriculum(id) {
  if (!confirm("¿Estás seguro de que deseas eliminar este currículum?")) {
    return
  }

  try {
    await apiRequest(`/curriculum/${id}`, "DELETE")
    showMessage("Currículum eliminado correctamente", "success")

    // Espera un pequeño momento por si el backend tarda en reflejar cambios
    setTimeout(() => {
      loadCurriculums()
    }, 100)  // puedes aumentar a 200ms si sigue sin reflejarse de inmediato

  } catch (error) {
    showFrameMessage(`Tiene que eliminar el estudiante primero.`);
  }
}

async function handleSearchCurriculum(e) {
  e.preventDefault();
  const id = document.getElementById("searchId").value;
  const resultDiv = document.getElementById("searchResult");
  if (!id) {
    resultDiv.innerHTML = "<p class='error-message'>Debe ingresar un ID válido</p>";
    return;
  }
  try {
    const curriculum = await apiRequest(`/curriculum/${id}`);
    resultDiv.innerHTML = `
      <div class="card">
        <h3>Currículum #${curriculum.id}</h3>
        <p><strong>Habilidades Blandas:</strong> ${curriculum.softSkills?.join(", ")}</p>
        <p><strong>Habilidades Técnicas:</strong> ${curriculum.technicalSkill?.join(", ")}</p>
        <p><strong>Certificaciones:</strong> ${curriculum.certifications?.join(", ")}</p>
        <p><strong>Títulos:</strong> ${curriculum.titles?.join(", ")}</p>
      </div>`;
    showFrameMessage(`Currículum #${id} encontrado con éxito`);
  } catch (error) {
    resultDiv.innerHTML = `<p class='error-message'>No se encontró el currículum con ID ${id}</p>`;
  }
}
