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
let barChartInstance = null;

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
        const allKeywords = [...data.ibm_keywords.entities, ...data.ibm_keywords.concepts];
        document.getElementById('ibm-extracted-info').innerText = allKeywords.length ? allKeywords.join(', ') : "None Detected";
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

    // New Features
    
    if(data.linkedin_optimization) {
        document.getElementById('linkedin-headline').innerText = data.linkedin_optimization.headline;
        document.getElementById('linkedin-about').innerText = data.linkedin_optimization.about;
    }

    const bulletsContainer = document.getElementById('bullets-container');
    bulletsContainer.innerHTML = "";
    if(data.bullet_point_improvements) {
        data.bullet_point_improvements.forEach(bullet => {
            const div = document.createElement('div');
            div.style.marginBottom = "12px";
            div.style.padding = "10px";
            div.style.background = "rgba(16, 185, 129, 0.05)";
            div.style.borderLeft = "3px solid #10b981";
            div.style.borderRadius = "4px";
            div.innerHTML = `
                <p style="font-size: 0.85rem; color: #ef4444; text-decoration: line-through; margin-bottom: 4px;">${bullet.original}</p>
                <p style="font-size: 0.95rem; color: #10b981; line-height: 1.4;">✨ ${bullet.improved}</p>
            `;
            bulletsContainer.appendChild(div);
        });
    }

    const interviewList = document.getElementById('interview-list');
    interviewList.innerHTML = "";
    if(data.mock_interview_questions) {
        data.mock_interview_questions.forEach(q => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="ph ph-question" style="color:var(--primary); margin-right:8px;"></i> ${q}`;
            li.style.marginBottom = "10px";
            interviewList.appendChild(li);
        });
    }

    const certContainer = document.getElementById('cert-container');
    certContainer.innerHTML = "";
    if(data.certifications) {
        data.certifications.forEach(cert => {
            const div = document.createElement('div');
            div.className = 'project-item';
            div.style.marginBottom = "15px";
            div.innerHTML = `<h4>${cert.name}</h4><p style="font-size:0.9rem;">${cert.reason}</p>`;
            certContainer.appendChild(div);
        });
    }

    if(data.market_demand_chart) {
        renderBarChart(data.market_demand_chart);
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

function renderBarChart(chartData) {
    const ctx = document.getElementById('barChart').getContext('2d');
    if (barChartInstance) barChartInstance.destroy();

    const labels = chartData.map(d => d.skill);
    const data = chartData.map(d => d.demand_score_out_of_100);

    barChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Market Demand (out of 100)',
                data: data,
                backgroundColor: 'rgba(0, 114, 239, 0.6)',
                borderColor: '#0072ef',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#64748b' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#64748b' }
                }
            },
            plugins: {
                legend: { display: false }
            },
            animation: {
                duration: 2000,
                easing: 'easeOutBounce'
            }
        }
    });
}

document.getElementById('export-btn').addEventListener('click', () => {
    const dashboardElement = document.getElementById('dashboard');
    const opt = {
      margin:       0.5,
      filename:     'HireMeMaybe_Report.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' },
      pagebreak:    { mode: 'avoid-all', before: '.page-break' }
    };

    // Temporarily hide the buttons before exporting
    const exportBtn = document.getElementById('export-btn');
    const analyzeAnotherBtn = document.querySelector('.secondary-btn[onclick="location.reload()"]');
    if(exportBtn) exportBtn.style.display = 'none';
    if(analyzeAnotherBtn) analyzeAnotherBtn.style.display = 'none';
    
    dashboardElement.classList.add('pdf-mode');

    html2pdf().set(opt).from(dashboardElement).save().then(() => {
        dashboardElement.classList.remove('pdf-mode');
        // Restore buttons
        if(exportBtn) exportBtn.style.display = 'inline-flex';
        if(analyzeAnotherBtn) analyzeAnotherBtn.style.display = 'inline-block';
    });
});
