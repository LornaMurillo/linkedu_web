// Internship module JavaScript

const API_BASE_URL = "http://localhost:8080"

// DOM Elements
const internshipForm = document.getElementById("internshipForm")
const loadInternshipsBtn = document.getElementById("loadInternships")
const internshipsContainer = document.getElementById("internshipsContainer")
const editModal = document.getElementById("editModal")
const editInternshipForm = document.getElementById("editInternshipForm")
const closeModal = document.querySelector(".close")
const applyModal = document.getElementById("applyModal")
const closeApplyModal = document.querySelector(".close-apply")
const confirmApplyBtn = document.getElementById("confirmApply")
const cancelApplyBtn = document.getElementById("cancelApply")

let currentInternshipId = null

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadInternships()
  setupEventListeners()
})

function setupEventListeners() {
  internshipForm.addEventListener("submit", handleAddInternship)
  loadInternshipsBtn.addEventListener("click", loadInternships)
  editInternshipForm.addEventListener("submit", handleEditInternship)
  closeModal.addEventListener("click", closeEditModal)
  closeApplyModal.addEventListener("click", closeApplyModalFunc)
  confirmApplyBtn.addEventListener("click", confirmApplication)
  cancelApplyBtn.addEventListener("click", closeApplyModalFunc)
  document.getElementById("searchForm").addEventListener("submit", handleSearchIntership);

  window.addEventListener("click", (event) => {
    if (event.target === editModal) {
      closeEditModal()
    }
    if (event.target === applyModal) {
      closeApplyModalFunc()
    }
  })
}

// Add Internship
async function handleAddInternship(e) {
  e.preventDefault()

  const submitBtn = e.target.querySelector('button[type="submit"]')
  setLoading(submitBtn, true)

  const formData = new FormData(internshipForm)

  const internshipData = {
    description: formData.get("description"),
    durationWeeks: formData.get("durationWeeks"),
    hours: formData.get("hours"),
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
    certifications: formData.get("certifications") || "",
    idCompany: Number.parseInt(formData.get("idCompany")),
  }

  // Validate form
  const errors = []
  if (!internshipData.description) errors.push("La descripción es requerida")
  if (!internshipData.durationWeeks) errors.push("La duración es requerida")
  if (!internshipData.hours) errors.push("Las horas son requeridas")
  if (internshipData.softSkills.length === 0) errors.push("Debe agregar al menos una habilidad blanda")
  if (internshipData.technicalSkill.length === 0) errors.push("Debe agregar al menos una habilidad técnica")
  if (!internshipData.idCompany) errors.push("El ID de la empresa es requerido")

  if (errors.length > 0) {
    showMessage(errors.join(", "), "error")
    setLoading(submitBtn, false)
    return
  }
  console.log("Internship data:", internshipData);
  try {
    await apiRequest("/intership", "POST", internshipData)
    showMessage("Pasantía creada correctamente", "success")
    internshipForm.reset()
    loadInternships()
  } catch (error) {
    const mensaje = error.message.startsWith("La compañía") 
    ? error.message 
    : "No existe ese id, no se pudo crear la pasantía"

  showMessage(mensaje, "error")
} finally {
    setLoading(submitBtn, false)
  }
}

// Load Internships
async function loadInternships() {
  const loadBtn = loadInternshipsBtn
  setLoading(loadBtn, true)

  try {
    const internships = await apiRequest("/intership")
    displayInternships(internships)
  } catch (error) {
    showMessage("Error al cargar pasantías: " + error.message, "error")
    internshipsContainer.innerHTML = "<p>Error al cargar los datos</p>"
  } finally {
    setLoading(loadBtn, false)
  }
}

// Display Internships
function displayInternships(internships) {
  if (!internships || internships.length === 0) {
    internshipsContainer.innerHTML = "<p>No hay pasantías disponibles</p>"
    return
  }

  internshipsContainer.innerHTML = internships
    .map(
      (internship) => `
        <div class="card">
            <h3>${internship.description}</h3>
            <p><strong>ID:</strong> ${internship.id || "N/A"}</p>
            <p><strong>Duración:</strong> ${internship.durationWeeks}</p>
            <p><strong>Horas:</strong> ${internship.hours}</p>
            <p><strong>Empresa ID:</strong> ${internship.idCompany}</p>
            
            <div class="internship-section">
                <p><strong>Habilidades Blandas Requeridas:</strong></p>
                <div class="tags">
                    ${internship.softSkills ? internship.softSkills.map((skill) => `<span class="tag">${skill}</span>`).join("") : '<span class="tag">Sin requisitos</span>'}
                </div>
            </div>
            
            <div class="internship-section">
                <p><strong>Habilidades Técnicas Requeridas:</strong></p>
                <div class="tags">
                    ${internship.technicalSkill ? internship.technicalSkill.map((skill) => `<span class="tag">${skill}</span>`).join("") : '<span class="tag">Sin requisitos</span>'}
                </div>
            </div>
            
            ${
              internship.certifications
                ? `
                <div class="internship-section">
                    <p><strong>Certificaciones:</strong></p>
                    <div class="tags">
                        <span class="tag">${internship.certifications}</span>
                    </div>
                </div>
            `
                : ""
            }
            
            <div class="card-actions">
                <button class="btn btn-primary" onclick="applyToInternship(${internship.id || 0})">
                    Aplicar
                </button>
                <button class="btn btn-secondary" onclick="editInternship(${internship.id || 0}, ${JSON.stringify(internship).replace(/"/g, "&quot;")})">
                    Editar
                </button>
                <button class="btn btn-danger" onclick="deleteInternship(${internship.id || 0})">
                    Eliminar
                </button>
            </div>
        </div>
    `,
    )
    .join("")
}

// Apply to Internship
function applyToInternship(id) {
  currentInternshipId = id
  applyModal.style.display = "block"
}

function confirmApplication() {
  if (currentInternshipId) {
    showMessage(`Aplicación enviada correctamente para la pasantía ID: ${currentInternshipId}`, "success")
    closeApplyModalFunc()
    currentInternshipId = null
  }
}

function closeApplyModalFunc() {
  applyModal.style.display = "none"
  currentInternshipId = null
}

// Edit Internship
function editInternship(id, internshipData) {
  const internship = typeof internshipData === "string" ? JSON.parse(internshipData) : internshipData

  document.getElementById("editInternshipId").value = id
  document.getElementById("editDescription").value = internship.description || ""
  document.getElementById("editDurationWeeks").value = internship.durationWeeks || ""
  document.getElementById("editHours").value = internship.hours || ""
  document.getElementById("editSoftSkills").value = internship.softSkills ? internship.softSkills.join(", ") : ""
  document.getElementById("editTechnicalSkill").value = internship.technicalSkill
    ? internship.technicalSkill.join(", ")
    : ""
  document.getElementById("editCertifications").value = internship.certifications || ""
  document.getElementById("editIdCompany").value = internship.idCompany || ""
  editModal.style.display = "block"
}

async function handleEditInternship(e) {
  e.preventDefault()

  const submitBtn = e.target.querySelector('button[type="submit"]')
  setLoading(submitBtn, true)

  const id = document.getElementById("editInternshipId").value
  const formData = new FormData(editInternshipForm)

  const internshipData = {
    description: formData.get("description"),
    durationWeeks: formData.get("durationWeeks"),
    hours: formData.get("hours"),
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
    certifications: formData.get("certifications") || "",
    idCompany: Number.parseInt(formData.get("idCompany")),
  }

  try {
    await apiRequest(`/intership/${id}`, "PUT", internshipData)
    showMessage("Pasantía actualizada correctamente", "success")
    closeEditModal()
    loadInternships()
  } catch (error) {
    showMessage("Error al actualizar la pasantía: " + error.message, "error")
  } finally {
    setLoading(submitBtn, false)
  }
}

// Delete Internship
async function deleteInternship(id) {
  if (!confirm("¿Estás seguro de que deseas eliminar esta pasantía?")) {
    return
  }

  try {
    await apiRequest(`/intership/${id}`, "DELETE")
    showMessage("Pasantía eliminada correctamente", "success")
    loadInternships()
  } catch (error) {
    showMessage("Error al eliminar la pasantía: " + error.message, "error")
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

async function handleSearchIntership(e) {
  e.preventDefault();
  const id = document.getElementById("searchId").value;
  const resultDiv = document.getElementById("searchResult");
  if (!id) {
    resultDiv.innerHTML = "<p class='error-message'>Debe ingresar un ID válido</p>";
    return;
  }
  try {
    const intership = await apiRequest(`/intership/${id}`);
    resultDiv.innerHTML = `
      <div class="card">
        <h3>Internship #${intership.id}</h3>
        <p><strong>Descripción:</strong> ${intership.description || "N/A"}</p>
        <p><strong>Duración (semanas):</strong> ${intership.durationWeeks || "N/A"}</p>
        <p><strong>Horas:</strong> ${intership.hours || "N/A"}</p>
        <p><strong>Habilidades Blandas:</strong> ${intership.softSkills?.join(", ") || "N/A"}</p>
        <p><strong>Habilidades Técnicas:</strong> ${intership.technicalSkill?.join(", ") || "N/A"}</p>
        <p><strong>Certificaciones:</strong> ${intership.certifications?.join(", ") || "N/A"}</p>
        <p><strong>ID de Compañía:</strong> ${intership.idCompany || "N/A"}</p>
      </div>
      `;
    showFrameMessage(`Intership #${id} encontrado con éxito`);
  } catch (error) {
    resultDiv.innerHTML = `<p class='error-message'>No se encontró el intership con ID ${id}</p>`;
  }
}
