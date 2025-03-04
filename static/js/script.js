document.addEventListener("DOMContentLoaded", () => {
  // Initialize tabs
  const tabs = document.querySelectorAll("nav a");
  const sections = document.querySelectorAll("section");

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      const targetSection = tab.getAttribute("data-section");

      // Remove active class from all tabs and sections
      tabs.forEach((t) => t.classList.remove("active"));
      sections.forEach((s) => s.classList.remove("active"));

      // Add active class to clicked tab and corresponding section
      tab.classList.add("active");
      document.getElementById(targetSection).classList.add("active");

      // Load data for the selected section
      loadData(targetSection);
    });
  });

  // Namespace selector
  const namespaceSelector = document.getElementById("namespace");
  namespaceSelector.addEventListener("change", () => {
    const activeSection = document.querySelector("section.active").id;
    loadData(activeSection);
  });

  // Load namespaces
  loadNamespaces();

  // Load initial data for the active section
  loadData("nodes");
});

// Load namespaces to populate the dropdown
async function loadNamespaces() {
  try {
    const response = await fetch("/api/namespaces");
    const data = await response.json();

    // Extract namespace names from the items array
    const namespaceSelector = document.getElementById("namespace");
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach((ns) => {
        const name = ns.metadata?.name;
        if (name) {
          const option = document.createElement("option");
          option.value = name;
          option.textContent = name;
          namespaceSelector.appendChild(option);
        }
      });
    }
  } catch (error) {
    console.error("Error loading namespaces:", error);
  }
}

// Load data for the selected section
async function loadData(section) {
  const namespace = document.getElementById("namespace").value;
  const url = namespace
    ? `/api/${section}?namespace=${namespace}`
    : `/api/${section}`;
  const container = document.getElementById(`${section}-container`);

  // Show loading indicator
  container.innerHTML = '<div class="loading">Loading...</div>';

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Clear container
    container.innerHTML = "";

    // Render the data based on the section
    switch (section) {
      case "nodes":
        renderNodes(data, container);
        break;
      case "pods":
        renderPods(data, container);
        break;
      case "deployments":
        renderDeployments(data, container);
        break;
      case "services":
        renderServices(data, container);
        break;
    }
  } catch (error) {
    console.error(`Error loading ${section}:`, error);
    container.innerHTML = `<div class="error">Error loading ${section}. Please try again later.</div>`;
  }
}

// Render nodes in the container
function renderNodes(data, container) {
  if (!data.items || data.items.length === 0) {
    container.innerHTML = '<div class="no-data">No nodes found.</div>';
    return;
  }

  data.items.forEach((node) => {
    const nodeReady = node.status?.conditions?.find(
      (condition) => condition.type === "Ready"
    );
    const isReady = nodeReady && nodeReady.status === "True";

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
            <h3>${node.metadata?.name || "Unknown"}</h3>
            <div class="card-status ${
              isReady ? "status-ready" : "status-error"
            }">
                ${isReady ? "Ready" : "Not Ready"}
            </div>
            <div class="card-details">
                <p>
                    OS: <span>${
                      node.status?.nodeInfo?.osImage || "Unknown"
                    }</span>
                </p>
                <p>
                    Kernel: <span>${
                      node.status?.nodeInfo?.kernelVersion || "Unknown"
                    }</span>
                </p>
                <p>
                    Container Runtime: <span>${
                      node.status?.nodeInfo?.containerRuntimeVersion ||
                      "Unknown"
                    }</span>
                </p>
                <p>
                    Kubelet: <span>${
                      node.status?.nodeInfo?.kubeletVersion || "Unknown"
                    }</span>
                </p>
            </div>
        `;
    container.appendChild(card);
  });
}

// Render pods in the container
function renderPods(data, container) {
  if (!data.items || data.items.length === 0) {
    container.innerHTML = '<div class="no-data">No pods found.</div>';
    return;
  }

  data.items.forEach((pod) => {
    const card = document.createElement("div");
    card.className = "card";

    // Determine pod status
    const phase = pod.status?.phase || "Unknown";
    let statusClass = "status-pending";
    if (phase === "Running") {
      statusClass = "status-running";
    } else if (phase === "Failed") {
      statusClass = "status-failed";
    }

    card.innerHTML = `
            <h3>${pod.metadata?.name || "Unknown"}</h3>
            <div class="card-status ${statusClass}">
                ${phase}
            </div>
            <div class="card-details">
                <p>
                    Namespace: <span>${
                      pod.metadata?.namespace || "Unknown"
                    }</span>
                </p>
                <p>
                    Node: <span>${pod.spec?.nodeName || "N/A"}</span>
                </p>
                <p>
                    IP: <span>${pod.status?.podIP || "N/A"}</span>
                </p>
                <p>
                    Created: <span>${
                      pod.metadata?.creationTimestamp
                        ? new Date(
                            pod.metadata.creationTimestamp
                          ).toLocaleString()
                        : "Unknown"
                    }</span>
                </p>
            </div>
        `;
    container.appendChild(card);
  });
}

// Render deployments in the container
function renderDeployments(data, container) {
  if (!data.items || data.items.length === 0) {
    container.innerHTML = '<div class="no-data">No deployments found.</div>';
    return;
  }

  data.items.forEach((deployment) => {
    const card = document.createElement("div");
    card.className = "card";

    const readyReplicas = deployment.status?.readyReplicas || 0;
    const desiredReplicas = deployment.spec?.replicas || 0;
    const isReady = readyReplicas === desiredReplicas && desiredReplicas > 0;

    card.innerHTML = `
            <h3>${deployment.metadata?.name || "Unknown"}</h3>
            <div class="card-status ${
              isReady ? "status-ready" : "status-pending"
            }">
                ${readyReplicas}/${desiredReplicas} Ready
            </div>
            <div class="card-details">
                <p>
                    Namespace: <span>${
                      deployment.metadata?.namespace || "Unknown"
                    }</span>
                </p>
                <p>
                    Created: <span>${
                      deployment.metadata?.creationTimestamp
                        ? new Date(
                            deployment.metadata.creationTimestamp
                          ).toLocaleString()
                        : "Unknown"
                    }</span>
                </p>
                <p>
                    Selector: <span>${
                      deployment.spec?.selector?.matchLabels
                        ? Object.entries(deployment.spec.selector.matchLabels)
                            .map(([k, v]) => `${k}=${v}`)
                            .join(", ")
                        : "N/A"
                    }</span>
                </p>
            </div>
        `;
    container.appendChild(card);
  });
}

// Render services in the container
function renderServices(data, container) {
  if (!data.items || data.items.length === 0) {
    container.innerHTML = '<div class="no-data">No services found.</div>';
    return;
  }

  data.items.forEach((service) => {
    const card = document.createElement("div");
    card.className = "card";

    const ports = service.spec?.ports
      ? service.spec.ports.map((port) => {
          return `${port.port}${port.targetPort ? ":" + port.targetPort : ""}/${
            port.protocol
          }`;
        })
      : "N/A";

    card.innerHTML = `
            <h3>${service.metadata?.name || "Unknown"}</h3>
            <div class="card-status status-ready">
                ${service.spec?.type || "Unknown"}
            </div>
            <div class="card-details">
                <p>
                    Namespace: <span>${
                      service.metadata?.namespace || "Unknown"
                    }</span>
                </p>
                <p>
                    Cluster IP: <span>${service.spec?.clusterIP || "N/A"}</span>
                </p>
                <p>
                    Ports: <span>${ports}</span>
                </p>
                <p>
                    Selector: <span>${
                      service.spec?.selector
                        ? Object.entries(service.spec.selector)
                            .map(([k, v]) => `${k}=${v}`)
                            .join(", ")
                        : "N/A"
                    }</span>
                </p>
            </div>
        `;
    container.appendChild(card);
  });
}
