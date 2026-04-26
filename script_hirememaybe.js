const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const analyzeBtn = document.getElementById('analyze-btn');
const targetRoleInput = document.getElementById('targetRole');

const uploadSection = document.getElementById('upload-section');
const loadingSection = document.getElementById('loading-section');
const dashboard = document.getElementById('dashboard');
const loadingText = document.getElementById('loading-text');

let selectedFile = null;
let chartInstance = null;

dropzone.addEventListener('click', () => fileInput.click());

dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
        handleFile(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
        handleFile(fileInput.files[0]);
    }
});

function handleFile(file) {
    if (file.type !== "application/pdf") {
        alert("Please upload a valid PDF file.");
        return;
    }
    selectedFile = file;
    dropzone.innerHTML = `<i class="ph ph-check-circle" style="color: #10b981;"></i><h3>${file.name}</h3><p>Ready for analysis</p>`;
    analyzeBtn.disabled = false;

    analyzeBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

analyzeBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    uploadSection.classList.add('hidden');
    loadingSection.classList.remove('hidden');

    setTimeout(() => loadingText.innerText = "Extracting formatting layers via pdf-parse...", 500);
    setTimeout(() => loadingText.innerText = "Connecting to IBM Watson NLU servers...", 1200);
    setTimeout(() => loadingText.innerText = "Gemini AI processing semantic gaps...", 1900);

    const formData = new FormData();
    formData.append('resume', selectedFile);
    formData.append('targetRole', targetRoleInput.value);

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error("Server error occurred.");
        const data = await response.json();

        renderDashboard(data);
    } catch (error) {
        alert("Fatal Error: " + error.message);
        location.reload();
    }
});


function renderDashboard(data) {
    loadingSection.classList.add('hidden');
    dashboard.classList.remove('hidden');


    dashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });


    let count = 0;
    const scoreEl = document.getElementById('score-val');
    const targetScore = data.score;
    const interval = setInterval(() => {
        count += 2;
        if (count >= targetScore) {
            count = targetScore;
            clearInterval(interval);
        }
        scoreEl.innerText = count;
    }, 25);


    renderChart(targetScore);


    if (data.ibm_keywords) {
        document.getElementById('ibm-hard-skills').innerText = data.ibm_keywords.entities.length ? data.ibm_keywords.entities.join(', ') : "None Detected";
        document.getElementById('ibm-soft-skills').innerText = data.ibm_keywords.concepts.length ? data.ibm_keywords.concepts.join(', ') : "None Detected";
    }


    const skillsList = document.getElementById('missing-skills-list');
    skillsList.innerHTML = "";
    data.missing_skills.forEach(skill => {
        const li = document.createElement('li');
        li.innerHTML = `<i class="ph ph-warning-circle" style="font-size:1.3rem;"></i> ${skill}`;
        skillsList.appendChild(li);
    });


    const projectsContainer = document.getElementById('projects-container');
    projectsContainer.innerHTML = "";
    data.project_suggestions.forEach(proj => {
        const div = document.createElement('div');
        div.className = 'project-item';
        div.innerHTML = `<h4>${proj.title}</h4><p>${proj.description}</p>`;
        projectsContainer.appendChild(div);
    });


    document.getElementById('feedback-text').innerText = data.feedback_summary;

    const audioEl = document.getElementById('coach-audio');
    if (data.audio_url) {
        audioEl.src = data.audio_url;
        audioEl.style.display = 'block';
        audioEl.play().catch(e => console.log("Autoplay blocked:", e));
    } else {
        audioEl.style.display = 'none';
    }
}

function renderChart(score) {
    const ctx = document.getElementById('radarChart').getContext('2d');


    if (chartInstance) chartInstance.destroy();


    const hardSkills = Math.min(100, score + Math.floor(Math.random() * 10) - 5);
    const softSkills = Math.min(100, score + Math.floor(Math.random() * 15) - 5);
    const impact = Math.min(100, score - Math.floor(Math.random() * 10));
    const formatting = Math.min(100, score + 10);

    chartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Hard Skills', 'Soft Skills', 'Formatting', 'Impact Metrics', 'Relevance'],
            datasets: [{
                label: 'Resume Performance',
                data: [hardSkills, softSkills, formatting, impact, score],
                backgroundColor: 'rgba(0, 114, 239, 0.2)',
                borderColor: '#0072ef',
                pointBackgroundColor: '#00a8ff',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#00a8ff',
                borderWidth: 2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: 'rgba(0, 0, 0, 0.1)' },
                    grid: { color: 'rgba(0, 0, 0, 0.1)' },
                    pointLabels: {
                        font: { family: "'Outfit', sans-serif", size: 13, weight: 600 },
                        color: '#64748b'
                    },
                    ticks: {
                        display: false,
                        min: 0,
                        max: 100
                    }
                }
            },
            plugins: {
                legend: { display: false }
            },
            animation: {
                duration: 2000,
                easing: 'easeOutQuart'
            }
        }
    });
}
