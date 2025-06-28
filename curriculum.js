// Curriculum module JavaScript

const API_BASE_URL = "http://localhost:8080"

// DOM Elements
const curriculumForm = document.getElementById("curriculumForm")
const loadCurriculumsBtn = document.getElementById("loadCurriculums")
const curriculumsContainer = document.getElementById("curriculumsContainer")
const editModal = document.getElementById("editModal")
const editCurriculumForm = document.getElementById("editCurriculumForm")
const closeModal = document.querySelector(".close")

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadCurriculums()
  setupEventListeners()
})

function setupEventListeners() {
  curriculumForm.addEventListener("submit", handleAddCurriculum)
  loadCurriculumsBtn.addEventListener("click", loadCurriculums)
  editCurriculumForm.addEventListener("submit", handleEditCurriculum)
  closeModal.addEventListener("click", closeEditModal)

  window.addEventListener("click", (event) => {
    if (event.target === editModal) {
      closeEditModal()
    }
  })
}

// Add Curriculum
async function handleAddCurriculum(e) {
  e.preventDefault()

  const submitBtn = e.target.querySelector('button[type="submit"]')
  setLoading(submitBtn, true)

  const formData = new FormData(curriculumForm)

  const curriculumData = {
    softSkills: formData
      .get("softSkills")
      .split(",")
      .map((skill) => skill.trim())
      .filter((skill) => skill),
    technicalSkill: formData
      .get("technicalSkill")
      .split(",")
      .map((skill) => skill.trim())
      .filter((skill) => skill),
    certifications: formData
      .get("certifications")
      .split(",")
      .map((cert) => cert.trim())
      .filter((cert) => cert),
    titles: formData
      .get("titles")
      .split(",")
      .map((title) => title.trim())
      .filter((title) => title),
  }

  // Validate form
  const errors = []
  if (curriculumData.softSkills.length === 0) errors.push("Debe agregar al menos una habilidad blanda")
  if (curriculumData.technicalSkill.length === 0) errors.push("Debe agregar al menos una habilidad técnica")
  if (curriculumData.titles.length === 0) errors.push("Debe agregar al menos un título académico")

  if (errors.length > 0) {
    showMessage(errors.join(", "), "error")
    setLoading(submitBtn, false)
    return
  }

  try {
    await apiRequest("/curriculum", "POST", curriculumData)
    showMessage("Currículum creado correctamente", "success")
    curriculumForm.reset()
    loadCurriculums()
  } catch (error) {
    showMessage("Error al crear el currículum: " + error.message, "error")
  } finally {
    setLoading(submitBtn, false)
  }
}

// Load Curriculums
async function loadCurriculums() {
  const loadBtn = loadCurriculumsBtn
  setLoading(loadBtn, true)

  try {
    const curriculums = await apiRequest("/curriculum")
    displayCurriculums(curriculums)
  } catch (error) {
    showMessage("Error al cargar currículums: " + error.message, "error")
    curriculumsContainer.innerHTML = "<p>Error al cargar los datos</p>"
  } finally {
    setLoading(loadBtn, false)
  }
}

// Display Curriculums
function displayCurriculums(curriculums) {
  if (!curriculums || curriculums.length === 0) {
    curriculumsContainer.innerHTML = "<p>No hay currículums registrados</p>"
    return
  }

  curriculumsContainer.innerHTML = curriculums
    .map(
      (curriculum) => `
        <div class="card">
            <h3>Currículum #${curriculum.id || "N/A"}</h3>
            
            <div class="curriculum-section">
                <p><strong>Habilidades Blandas:</strong></p>
                <div class="tags">
                    ${curriculum.softSkills ? curriculum.softSkills.map((skill) => `<span class="tag">${skill}</span>`).join("") : '<span class="tag">Sin habilidades</span>'}
                </div>
            </div>
            
            <div class="curriculum-section">
                <p><strong>Habilidades Técnicas:</strong></p>
                <div class="tags">
                    ${curriculum.technicalSkill ? curriculum.technicalSkill.map((skill) => `<span class="tag">${skill}</span>`).join("") : '<span class="tag">Sin habilidades</span>'}
                </div>
            </div>
            
            <div class="curriculum-section">
                <p><strong>Certificaciones:</strong></p>
                <div class="tags">
                    ${curriculum.certifications && curriculum.certifications.length > 0 ? curriculum.certifications.map((cert) => `<span class="tag">${cert}</span>`).join("") : '<span class="tag">Sin certificaciones</span>'}
                </div>
            </div>
            
            <div class="curriculum-section">
                <p><strong>Títulos Académicos:</strong></p>
                <div class="tags">
                    ${curriculum.titles ? curriculum.titles.map((title) => `<span class="tag">${title}</span>`).join("") : '<span class="tag">Sin títulos</span>'}
                </div>
            </div>
            
            <div class="card-actions">
                <button class="btn btn-primary" onclick="downloadCurriculum(${curriculum.id || 0}, ${JSON.stringify(curriculum).replace(/"/g, "&quot;")})">
                    Descargar TXT
                </button>
                <button class="btn btn-secondary" onclick="editCurriculum(${curriculum.id || 0}, ${JSON.stringify(curriculum).replace(/"/g, "&quot;")})">
                    Editar
                </button>
                <button class="btn btn-danger" onclick="deleteCurriculum(${curriculum.id || 0})">
                    Eliminar
                </button>
            </div>
        </div>
    `,
    )
    .join("")
}

// Download Curriculum as TXT
function downloadCurriculum(id, curriculumData) {
  const curriculum = typeof curriculumData === "string" ? JSON.parse(curriculumData) : curriculumData

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
    `.trim()

  const blob = new Blob([content], { type: "text/plain" })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `curriculum_${id}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)

  showMessage("Currículum descargado correctamente", "success")
}

// Edit Curriculum
function editCurriculum(id, curriculumData) {
  const curriculum = typeof curriculumData === "string" ? JSON.parse(curriculumData) : curriculumData

  document.getElementById("editCurriculumId").value = id
  document.getElementById("editSoftSkills").value = curriculum.softSkills ? curriculum.softSkills.join(", ") : ""
  document.getElementById("editTechnicalSkill").value = curriculum.technicalSkill
    ? curriculum.technicalSkill.join(", ")
    : ""
  document.getElementById("editCertifications").value = curriculum.certifications
    ? curriculum.certifications.join(", ")
    : ""
  document.getElementById("editTitles").value = curriculum.titles ? curriculum.titles.join(", ") : ""
  editModal.style.display = "block"
}

async function handleEditCurriculum(e) {
  e.preventDefault()

  const submitBtn = e.target.querySelector('button[type="submit"]')
  setLoading(submitBtn, true)

  const id = document.getElementById("editCurriculumId").value
  const formData = new FormData(editCurriculumForm)

  const curriculumData = {
    softSkills: formData
      .get("softSkills")
      .split(",")
      .map((skill) => skill.trim())
      .filter((skill) => skill),
    technicalSkill: formData
      .get("technicalSkill")
      .split(",")
      .map((skill) => skill.trim())
      .filter((skill) => skill),
    certifications: formData
      .get("certifications")
      .split(",")
      .map((cert) => cert.trim())
      .filter((cert) => cert),
    titles: formData
      .get("titles")
      .split(",")
      .map((title) => title.trim())
      .filter((title) => title),
  }

  try {
    await apiRequest(`/curriculum/${id}`, "PUT", curriculumData)
    showMessage("Currículum actualizado correctamente", "success")
    closeEditModal()
    loadCurriculums()
  } catch (error) {
    showMessage("Error al actualizar el currículum: " + error.message, "error")
  } finally {
    setLoading(submitBtn, false)
  }
}

// Delete Curriculum
async function deleteCurriculum(id) {
  if (!confirm("¿Estás seguro de que deseas eliminar este currículum?")) {
    return
  }

  try {
    await apiRequest(`/curriculum/${id}`, "DELETE")
    showMessage("Currículum eliminado correctamente", "success")
    loadCurriculums()
  } catch (error) {
    showMessage("Error al eliminar el currículum: " + error.message, "error")
  }
}

function closeEditModal() {
  editModal.style.display = "none"
}

// Utility functions
async function apiRequest(endpoint, method = "GET", data = null) {
  const config = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  }

  if (data) {
    config.body = JSON.stringify(data)
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("API request failed:", error)
    throw error
  }
}

function showMessage(message, type = "success") {
  const messageDiv = document.createElement("div")
  messageDiv.className = `message ${type}`
  messageDiv.textContent = message

  const container = document.querySelector(".main-content .container")
  if (container) {
    container.insertBefore(messageDiv, container.firstChild)

    setTimeout(() => {
      messageDiv.remove()
    }, 5000)
  }
}

function setLoading(element, isLoading) {
  if (isLoading) {
    element.disabled = true
    element.innerHTML = '<span class="loading"></span> Cargando...'
  } else {
    element.disabled = false
    element.innerHTML = element.getAttribute("data-original-text") || "Enviar"
  }
}

function validateForm(formData, requiredFields) {
  const errors = []

  requiredFields.forEach((field) => {
    if (!formData[field] || formData[field].toString().trim() === "") {
      errors.push(`El campo ${field} es requerido`)
    }
  })

  return errors
}
