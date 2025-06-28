// Student module JavaScript

const API_BASE_URL = "http://localhost:8080"

// DOM Elements
const studentForm = document.getElementById("studentForm")
const loadStudentsBtn = document.getElementById("loadStudents")
const studentsContainer = document.getElementById("studentsContainer")
const editModal = document.getElementById("editModal")
const editStudentForm = document.getElementById("editStudentForm")
const closeModal = document.querySelector(".close")

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadStudents()
  setupEventListeners()
})

function setupEventListeners() {
  studentForm.addEventListener("submit", handleAddStudent)
  loadStudentsBtn.addEventListener("click", loadStudents)
  editStudentForm.addEventListener("submit", handleEditStudent)
  closeModal.addEventListener("click", closeEditModal)

  window.addEventListener("click", (event) => {
    if (event.target === editModal) {
      closeEditModal()
    }
  })
}

// Add Student
async function handleAddStudent(e) {
  e.preventDefault()

  const submitBtn = e.target.querySelector('button[type="submit"]')
  setLoading(submitBtn, true)

  const formData = new FormData(studentForm)
  const studentData = {
    name: formData.get("name"),
    idCurriculum: Number.parseInt(formData.get("idCurriculum")),
  }

  // Validate form
  const errors = validateForm(studentData, ["name", "idCurriculum"])
  if (errors.length > 0) {
    showMessage(errors.join(", "), "error")
    setLoading(submitBtn, false)
    return
  }

  try {
    await apiRequest("/student", "POST", studentData)
    showMessage("Estudiante registrado correctamente", "success")
    studentForm.reset()
    loadStudents()
  } catch (error) {
    showMessage("Error al registrar el estudiante: " + error.message, "error")
  } finally {
    setLoading(submitBtn, false)
  }
}

// Load Students
async function loadStudents() {
  const loadBtn = loadStudentsBtn
  setLoading(loadBtn, true)

  try {
    const students = await apiRequest("/student")
    displayStudents(students)
  } catch (error) {
    showMessage("Error al cargar estudiantes: " + error.message, "error")
    studentsContainer.innerHTML = "<p>Error al cargar los datos</p>"
  } finally {
    setLoading(loadBtn, false)
  }
}

// Display Students
function displayStudents(students) {
  if (!students || students.length === 0) {
    studentsContainer.innerHTML = "<p>No hay estudiantes registrados</p>"
    return
  }

  studentsContainer.innerHTML = students
    .map(
      (student) => `
        <div class="card">
            <h3>${student.name}</h3>
            <p><strong>ID:</strong> ${student.id || "N/A"}</p>
            <p><strong>ID Currículum:</strong> ${student.idCurriculum}</p>
            <div class="card-actions">
                <button class="btn btn-secondary" onclick="editStudent(${student.id || 0}, '${student.name}', ${student.idCurriculum})">
                    Editar
                </button>
                <button class="btn btn-danger" onclick="deleteStudent(${student.id || 0})">
                    Eliminar
                </button>
            </div>
        </div>
    `,
    )
    .join("")
}

// Edit Student
function editStudent(id, name, idCurriculum) {
  document.getElementById("editStudentId").value = id
  document.getElementById("editStudentName").value = name
  document.getElementById("editCurriculumId").value = idCurriculum
  editModal.style.display = "block"
}

async function handleEditStudent(e) {
  e.preventDefault()

  const submitBtn = e.target.querySelector('button[type="submit"]')
  setLoading(submitBtn, true)

  const id = document.getElementById("editStudentId").value
  const formData = new FormData(editStudentForm)
  const studentData = {
    name: formData.get("name"),
    idCurriculum: Number.parseInt(formData.get("idCurriculum")),
  }

  try {
    await apiRequest(`/student/${id}`, "PUT", studentData)
    showMessage("Estudiante actualizado correctamente", "success")
    closeEditModal()
    loadStudents()
  } catch (error) {
    showMessage("Error al actualizar el estudiante: " + error.message, "error")
  } finally {
    setLoading(submitBtn, false)
  }
}

// Delete Student
async function deleteStudent(id) {
  if (!confirm("¿Estás seguro de que deseas eliminar este estudiante?")) {
    return
  }

  try {
    await apiRequest(`/student/${id}`, "DELETE")
    showMessage("Estudiante eliminado correctamente", "success")
    loadStudents()
  } catch (error) {
    showMessage("Error al eliminar el estudiante: " + error.message, "error")
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
