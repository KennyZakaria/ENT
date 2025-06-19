// Variables globales
let currentConfig = null;
let ollamaModels = [];

// Initialisation
document.addEventListener("DOMContentLoaded", function () {
  initTabs();
  loadDocuments();
  setupUploadForm();
  initLLMConfig();
});

// === GESTION DES ONGLETS ===
function initTabs() {
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabId = button.id.replace("tab-", "");

      // Réinitialiser tous les onglets
      tabButtons.forEach((btn) => {
        btn.className =
          "tab-button py-4 px-2 font-medium text-sm transition-colors text-gray-500 hover:text-gray-700";
      });

      tabContents.forEach((content) => {
        content.classList.add("hidden");
      });

      // Activer l'onglet sélectionné
      button.className =
        "tab-button py-4 px-2 font-medium text-sm transition-colors border-b-2 border-blue-500 text-blue-600";
      document.getElementById(`content-${tabId}`).classList.remove("hidden");

      // Charger les données si nécessaire
      if (tabId === "llm") {
        loadLLMConfig();
      }
    });
  });
}

// === GESTION LLM ===
async function initLLMConfig() {
  await loadLLMConfig();
  await loadOllamaModels();
  setupLLMEventListeners();
}

async function loadLLMConfig() {
  try {
    console.log("Chargement de la config LLM...");
    const response = await fetch("/api/llm/config");
    const data = await response.json();

    if (data.status === "success") {
      currentConfig = data.config;
      console.log("Config LLM chargée:", currentConfig);

      // Charger les modèles Ollama depuis la config
      if (currentConfig.ollama_models) {
        ollamaModels = currentConfig.ollama_models;
      }

      updateLLMDisplay();
      updateOllamaModelSelector();
    } else {
      console.error("Erreur lors du chargement de la config LLM:", data);
    }
  } catch (error) {
    console.error("Erreur de connexion:", error);
  }
}
async function loadOllamaModels() {
  try {
    const response = await fetch("/api/llm/ollama/models");
    const data = await response.json();

    if (data.status === "success") {
      ollamaModels = data.models;
      updateOllamaModelSelector();
    }
  } catch (error) {
    console.error("Erreur lors du chargement des modèles Ollama:", error);
  }
}

function updateLLMDisplay() {
  if (!currentConfig) return;

  console.log("Mise à jour de l'affichage LLM:", currentConfig);

  // Mettre à jour le statut actuel
  document.getElementById("current-provider").textContent =
    currentConfig.provider.replace("_", " ").toUpperCase();
  document.getElementById(
    "current-model"
  ).textContent = `Modèle: ${currentConfig.model}`;

  // Mettre à jour le statut de disponibilité
  const readyStatus = document.getElementById("llm-ready-status");
  if (currentConfig.is_ready) {
    readyStatus.className =
      "px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800";
    readyStatus.textContent = "✅ Prêt";
  } else {
    readyStatus.className =
      "px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800";
    readyStatus.textContent = "❌ Non prêt";
  }

  // Mettre à jour les status des providers
  const togetherStatus = document.getElementById("together-status");
  if (currentConfig.together_api_configured) {
    togetherStatus.className = "text-sm mt-1 text-green-600";
    togetherStatus.textContent = "✅ API configurée";
  } else {
    togetherStatus.className = "text-sm mt-1 text-red-600";
    togetherStatus.textContent = "❌ Clé API manquante";
  }

  const ollamaStatus = document.getElementById("ollama-status");
  const modelCount = currentConfig.ollama_models
    ? currentConfig.ollama_models.length
    : ollamaModels.length;
  if (currentConfig.ollama_available) {
    ollamaStatus.className = "text-sm mt-1 text-green-600";
    ollamaStatus.textContent = `✅ Connecté (${modelCount} modèles)`;
  } else {
    ollamaStatus.className = "text-sm mt-1 text-red-600";
    ollamaStatus.textContent = "❌ Non accessible";
  }

  // Sélectionner le provider actuel dans les radio buttons
  const providerRadio = document.querySelector(
    `input[value="${currentConfig.provider}"]`
  );
  if (providerRadio) {
    providerRadio.checked = true;
    console.log("Radio sélectionné pour:", currentConfig.provider);
  }

  // Afficher/cacher le sélecteur de modèle Ollama
  if (currentConfig.provider === "ollama") {
    document.getElementById("ollama-model-selector").classList.remove("hidden");
  } else {
    document.getElementById("ollama-model-selector").classList.add("hidden");
  }

  // Mettre à jour l'affichage des cartes
  updateProviderCards();

  // Mettre à jour les infos de debug
  document.getElementById("debug-info").textContent = JSON.stringify(
    currentConfig,
    null,
    2
  );
}
function updateOllamaModelSelector() {
  const selector = document.getElementById("ollama-model-select");
  selector.innerHTML = "";

  // Utiliser les modèles de la config si disponibles, sinon ollamaModels
  const models = currentConfig?.ollama_models || ollamaModels;

  console.log("Modèles Ollama disponibles:", models);

  if (models.length === 0) {
    selector.innerHTML = '<option value="">Aucun modèle disponible</option>';
    return;
  }

  // Ajouter l'option par défaut
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Sélectionnez un modèle";
  selector.appendChild(defaultOption);

  models.forEach((model) => {
    const option = document.createElement("option");
    option.value = model;
    option.textContent = model;
    if (
      currentConfig &&
      currentConfig.model === model &&
      currentConfig.provider === "ollama"
    ) {
      option.selected = true;
    }
    selector.appendChild(option);
  });

  // Mettre à jour les cartes après changement des modèles
  updateProviderCards();
}

function setupLLMEventListeners() {
  // Écouteurs pour les boutons radio
  document.querySelectorAll('input[name="provider"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      console.log("Radio changé:", e.target.value);
      updateProviderCards();
    });
  });

  // Écouteur pour le sélecteur de modèle Ollama
  document
    .getElementById("ollama-model-select")
    .addEventListener("change", () => {
      console.log("Modèle Ollama changé");
      updateProviderCards();
    });

  // Écouteur pour le bouton d'application
  document
    .getElementById("apply-llm-config")
    .addEventListener("click", applyLLMConfig);

  // Écouteurs pour cliquer sur les cartes
  document.getElementById("card-together").addEventListener("click", () => {
    document.getElementById("provider-together").checked = true;
    updateProviderCards();
  });

  document.getElementById("card-ollama").addEventListener("click", () => {
    document.getElementById("provider-ollama").checked = true;
    updateProviderCards();
  });
}

function updateProviderCards() {
  const selectedProvider = document.querySelector(
    'input[name="provider"]:checked'
  )?.value;

  console.log("Provider sélectionné:", selectedProvider);
  console.log("Config actuelle:", currentConfig);

  // Réinitialiser les cartes
  document.querySelectorAll(".provider-card").forEach((card) => {
    card.className =
      "provider-card border-2 rounded-lg p-4 cursor-pointer transition-all border-gray-200 hover:border-gray-300";
  });

  // Mettre en évidence la carte sélectionnée
  if (selectedProvider === "together_ai") {
    document.getElementById("card-together").className =
      "provider-card border-2 rounded-lg p-4 cursor-pointer transition-all border-blue-500 bg-blue-50";
    document.getElementById("ollama-model-selector").classList.add("hidden");
  } else if (selectedProvider === "ollama") {
    document.getElementById("card-ollama").className =
      "provider-card border-2 rounded-lg p-4 cursor-pointer transition-all border-green-500 bg-green-50";
    document.getElementById("ollama-model-selector").classList.remove("hidden");
  }

  // Logique du bouton d'application
  const applyButton = document.getElementById("apply-llm-config");

  if (!selectedProvider) {
    applyButton.disabled = true;
    applyButton.textContent = "Sélectionnez un provider";
    return;
  }

  // Vérifications spécifiques par provider
  if (selectedProvider === "ollama") {
    console.log(
      "Vérification Ollama - disponible:",
      currentConfig?.ollama_available
    );

    if (!currentConfig || !currentConfig.ollama_available) {
      applyButton.disabled = true;
      applyButton.textContent = "Ollama non disponible";
      applyButton.className =
        "w-full py-3 px-4 rounded-lg font-medium transition-colors bg-red-400 text-white cursor-not-allowed";
    } else {
      // Vérifier qu'un modèle est sélectionné
      const selectedModel = document.getElementById(
        "ollama-model-select"
      ).value;
      if (!selectedModel) {
        applyButton.disabled = true;
        applyButton.textContent = "Sélectionnez un modèle Ollama";
        applyButton.className =
          "w-full py-3 px-4 rounded-lg font-medium transition-colors bg-yellow-400 text-white cursor-not-allowed";
      } else {
        applyButton.disabled = false;
        applyButton.textContent = "Appliquer la configuration";
        applyButton.className =
          "w-full py-3 px-4 rounded-lg font-medium transition-colors bg-green-600 hover:bg-green-700 text-white";
      }
    }
  } else if (selectedProvider === "together_ai") {
    console.log(
      "Vérification Together AI - configuré:",
      currentConfig?.together_api_configured
    );

    if (!currentConfig || !currentConfig.together_api_configured) {
      applyButton.disabled = true;
      applyButton.textContent = "Clé API Together AI manquante";
      applyButton.className =
        "w-full py-3 px-4 rounded-lg font-medium transition-colors bg-red-400 text-white cursor-not-allowed";
    } else {
      applyButton.disabled = false;
      applyButton.textContent = "Appliquer la configuration";
      applyButton.className =
        "w-full py-3 px-4 rounded-lg font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white";
    }
  }
}

async function applyLLMConfig() {
  const selectedProvider = document.querySelector(
    'input[name="provider"]:checked'
  )?.value;
  const selectedModel =
    selectedProvider === "ollama"
      ? document.getElementById("ollama-model-select").value
      : null;

  if (!selectedProvider) {
    alert("Veuillez sélectionner un provider");
    return;
  }

  const applyButton = document.getElementById("apply-llm-config");
  const originalText = applyButton.textContent;

  try {
    applyButton.disabled = true;
    applyButton.textContent = "Application en cours...";

    const response = await fetch("/api/llm/switch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        provider: selectedProvider,
        model: selectedModel,
      }),
    });

    const data = await response.json();

    if (data.status === "success") {
      alert(`Basculé vers ${selectedProvider} avec succès!`);
      await loadLLMConfig();
    } else {
      alert("Erreur lors du changement de provider");
    }
  } catch (error) {
    console.error("Erreur:", error);
    alert("Erreur de connexion");
  } finally {
    applyButton.disabled = false;
    applyButton.textContent = originalText;
  }
}

// === GESTION DES DOCUMENTS (votre code existant) ===
async function loadDocuments() {
  try {
    const response = await fetch("/api/admin/documents");
    const data = await response.json();

    const documentsList = document.getElementById("documentsList");

    if (data.documents && data.documents.length > 0) {
      documentsList.innerHTML = data.documents
        .map(
          (doc) => `
                <div class="border border-gray-200 rounded-lg p-4 mb-4">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="font-semibold">${doc.filename}</h3>
                            <p class="text-sm text-gray-600">Ajouté le: ${new Date(
                              doc.ingested_at
                            ).toLocaleDateString()}</p>
                            <p class="text-sm text-gray-600">Chunks: ${
                              doc.chunk_count
                            }</p>
                            <p class="text-sm text-gray-600">Taille: ${(
                              doc.file_size / 1024
                            ).toFixed(1)} KB</p>
                        </div>
                        <button onclick="deleteDocument('${doc.id}')" 
                                class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">
                            Supprimer
                        </button>
                    </div>
                </div>
            `
        )
        .join("");
    } else {
      documentsList.innerHTML = '<p class="text-gray-500">Aucun document</p>';
    }
  } catch (error) {
    console.error("Erreur lors du chargement:", error);
    document.getElementById("documentsList").innerHTML =
      '<p class="text-red-500">Erreur de chargement</p>';
  }
}

function setupUploadForm() {
  document
    .getElementById("uploadForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const fileInput = document.getElementById("fileInput");
      const file = fileInput.files[0];

      if (!file) {
        alert("Veuillez sélectionner un fichier");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      const progressDiv = document.getElementById("uploadProgress");
      const progressBar = document.getElementById("progressBar");
      const progressText = document.getElementById("progressText");

      progressDiv.classList.remove("hidden");
      progressBar.style.width = "0%";
      progressText.textContent = "Téléchargement...";

      try {
        // Simuler la progression pendant l'upload
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += Math.random() * 30;
          if (progress > 90) progress = 90;
          progressBar.style.width = progress + "%";
        }, 500);

        const response = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);
        progressBar.style.width = "100%";

        const data = await response.json();

        if (data.status === "success") {
          progressText.textContent = "Document traité avec succès!";
          setTimeout(() => {
            progressDiv.classList.add("hidden");
            fileInput.value = "";
            loadDocuments();
          }, 2000);
        } else {
          progressText.textContent = "Erreur: " + data.message;
          progressText.className = "text-sm text-red-600 mt-2";
        }
      } catch (error) {
        console.error("Erreur:", error);
        progressText.textContent = "Erreur de connexion";
        progressText.className = "text-sm text-red-600 mt-2";
      }
    });
}

async function deleteDocument(docId) {
  if (!confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) {
    return;
  }

  try {
    const response = await fetch(`/api/admin/documents/${docId}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (data.status === "success") {
      loadDocuments();
    } else {
      alert("Erreur lors de la suppression");
    }
  } catch (error) {
    console.error("Erreur:", error);
    alert("Erreur de connexion");
  }
}
