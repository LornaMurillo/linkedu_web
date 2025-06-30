// Company module JavaScript

const API_BASE_URL = "http://localhost:8080"

// DOM Elements
const companyForm = document.getElementById("companyForm")
const loadCompaniesBtn = document.getElementById("loadCompanies")
const companiesContainer = document.getElementById("companiesContainer")
const editModal = document.getElementById("editModal")
const editCompanyForm = document.getElementById("editCompanyForm")
const closeModal = document.querySelector(".close")

// Variables globales para mantener los valores actuales al editar parcialmente
let currentBusinessName = "";
let currentOffers = [];
// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadCompanies()
  setupEventListeners()
})

function setupEventListeners() {
  companyForm.addEventListener("submit", handleAddCompany)
  loadCompaniesBtn.addEventListener("click", loadCompanies)
  editCompanyForm.addEventListener("submit", handleEditCompany)
  closeModal.addEventListener("click", closeEditModal)
  document.getElementById("searchCompanyForm").addEventListener("submit", handleSearchCompany);
  document.getElementById("patchCompanyForm").addEventListener("submit", handlePatchCompany)


  window.addEventListener("click", (event) => {
    if (event.target === editModal) {
      closeEditModal()
    }
  })
}

async function handleSearchCompany(e) {
  e.preventDefault();
  const id = document.getElementById("searchCompanyId").value;
  const resultDiv = document.getElementById("searchCompanyResult");

  if (!id) {
    resultDiv.innerHTML = "<p class='error-message'>Debe ingresar un ID válido</p>";
    return;
  }

  try {
    const company = await apiRequest(`/company/${id}`);
    resultDiv.innerHTML = `
      <div class="card">
        <h3>Empresa #${company.id}</h3>
        <p><strong>Nombre:</strong> ${company.businessName}</p>
        <p><strong>Ofertas:</strong> ${company.offers?.join(", ") || "Ninguna"}</p>
      </div>`;
    showFrameMessage(`Empresa #${id} encontrada con éxito`);
  } catch (error) {
    resultDiv.innerHTML = `<p class='error-message'>No se encontró la empresa con ID ${id}</p>`;
  }
}

// Add Company
async function handleAddCompany(e) {
  e.preventDefault()

  const submitBtn = e.target.querySelector('button[type="submit"]')
  setLoading(submitBtn, true)

  const formData = new FormData(companyForm)
  const offersText = formData.get("offers")
  const offersArray = offersText
    .split(",")
    .map((offer) => offer.trim())
    .filter((offer) => offer)

  const companyData = {
    businessName: formData.get("businessName"),
    offers: offersArray,
  }
  console.log(companyData)
  // Validate form
  const errors = validateForm(companyData, ["businessName"])
  if (errors.length > 0) {
    showMessage(errors.join(", "), "error")
    setLoading(submitBtn, false)
    return
  }

  if (offersArray.length === 0) {
    showMessage("Debe agregar al menos una oferta de trabajo", "error")
    setLoading(submitBtn, false)
    return
  }

  try {
    await apiRequest("/company", "POST", companyData)
    showMessage("Empresa agregada correctamente", "success")
    companyForm.reset()
    loadCompanies()
  } catch (error) {
    showFrameMessage(`Tiene que eliminar la pasantía primero.`);
  } finally {
    setLoading(submitBtn, false)
  }
}

// Load Companies
async function loadCompanies() {
  const loadBtn = loadCompaniesBtn
  setLoading(loadBtn, true)

  try {
    const companies = await apiRequest("/company")
    displayCompanies(companies)
  } catch (error) {
    showMessage("Error al cargar empresas: " + error.message, "error")
    companiesContainer.innerHTML = "<p>Error al cargar los datos</p>"
  } finally {
    setLoading(loadBtn, false)
  }
}

function editCompanyPatch(id, businessName, offers) {
  // Guardamos los datos actuales
  currentBusinessName = businessName;
  currentOffers = Array.isArray(offers) ? offers : [];

  // Mostramos campos vacíos para edición parcial
  document.getElementById("patchCompanyId").value = id;
  document.getElementById("patchBusinessName").value = "";
  document.getElementById("patchOffers").value = "";

  document.getElementById("patchCompanyModal").style.display = "block";
}


function closePatchModal() {
  document.getElementById("patchCompanyModal").style.display = "none";
}

// Display Companies
function displayCompanies(companies) {
  if (!companies || companies.length === 0) {
    companiesContainer.innerHTML = "<p>No hay empresas registradas</p>"
    return
  }

  companiesContainer.innerHTML = companies
    .map(
      (company) => `
        <div class="card">
            <h3>${company.businessName}</h3>
            <p><strong>ID:</strong> ${company.id || "N/A"}</p>
            <div class="offers-section">
                <p><strong>Ofertas de Trabajo:</strong></p>
                <div class="tags">
                    ${company.offers ? company.offers.map((offer) => `<span class="tag">${offer}</span>`).join("") : '<span class="tag">Sin ofertas</span>'}
                </div>
            </div>
            <div class="card-actions">
                <button class="btn btn-secondary" onclick="editCompany(${company.id || 0}, '${company.businessName}', ${JSON.stringify(company.offers || []).replace(/"/g, "&quot;")})">
                Actualizar
                </button>

                <button class="btn btn-danger" onclick="deleteCompany(${company.id || 0})">
                    Eliminar
                </button>
                <button class="btn btn-outline" onclick="editCompanyPatch(${company.id || 0}, '${company.businessName}', ${JSON.stringify(company.offers || []).replace(/"/g, "&quot;")})">
                    Editar
                </button>
            </div>
        </div>
    `,
    )
    .join("")
}

// Edit Company
function editCompany(id, businessName, offers) {
  document.getElementById("editCompanyId").value = id
  document.getElementById("editBusinessName").value = businessName
  document.getElementById("editOffers").value = Array.isArray(offers) ? offers.join(", ") : ""
  editModal.style.display = "block"
}

async function handleEditCompany(e) {
  e.preventDefault()

  const submitBtn = e.target.querySelector('button[type="submit"]')
  setLoading(submitBtn, true)

  const id = document.getElementById("editCompanyId").value
  console.log("Editando empresa con ID:", id);
  if (!id) {
  showMessage("ID de empresa no encontrado. No se puede actualizar.", "error");
  setLoading(submitBtn, false);
  return;
}
  const formData = new FormData(editCompanyForm)
  const offersText = formData.get("offers")
  const offersArray = offersText
    .split(",")
    .map((offer) => offer.trim())
    .filter((offer) => offer)

  const companyData = {
    id: Number(id),
    businessName: formData.get("businessName"),
    offers: offersArray,
  }

  try {
    await apiRequest(`/company`, "PUT", companyData)
    showMessage("Empresa actualizada correctamente", "success")
    closeEditModal()
    loadCompanies()
  } catch (error) {
    showMessage("Error al actualizar la empresa: " + error.message, "error")
  } finally {
    setLoading(submitBtn, false)
  }
}

async function handlePatchCompany(e) {
  e.preventDefault();

  const id = document.getElementById("patchCompanyId").value;
  const businessNameInput = document.getElementById("patchBusinessName").value.trim();
  const offersRaw = document.getElementById("patchOffers").value.trim();

  const data = {
    id: Number(id),
    businessName: businessNameInput || currentBusinessName,
    offers: offersRaw ? offersRaw.split(",").map(o => o.trim()).filter(Boolean) : currentOffers
  };

  try {
    await fetch(`${API_BASE_URL}/company`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    showMessage("Empresa actualizada correctamente (PATCH)", "success");
    closePatchModal();
    loadCompanies();
  } catch (err) {
    showMessage("Error al actualizar empresa", "error");
  }
}



// Delete Company
async function deleteCompany(id) {
  if (!confirm("¿Estás seguro de que deseas eliminar esta empresa?")) {
    return
  }

  try {
    await apiRequest(`/company/${id}`, "DELETE")
    showMessage("Empresa eliminada correctamente", "success")
    loadCompanies()
  } catch (error) {

    showFrameMessage(`Tiene que eliminar la pasantía.`);

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
    console.log(JSON.stringify(data))
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
