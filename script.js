/* script.js
   Auto-fetch GitHub repos for username and render glass cards with badges + filters.
   Edit `GITHUB_USERNAME` to your username if needed.
*/

const GITHUB_USERNAME = "Shiv-Moze";
const MAX_REPOS = 12; // how many repos to show

// simple mapping from language -> badge icon (devicon or fallback)
const LANG_ICON_MAP = {
  "Python": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
  "Jupyter Notebook": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jupyter/jupyter-original-wordmark.svg",
  "JavaScript": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg",
  "TypeScript": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg",
  "HTML": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg",
  "CSS": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg",
  "Jupyter": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jupyter/jupyter-original-wordmark.svg",
  "R": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/r/r-original.svg",
  "Go": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg",
  "Shell": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-original.svg",
  // add more if you want
};

document.getElementById("year").innerText = new Date().getFullYear();

// Helpers
function chooseCategory(repo){
  const name = (repo.name || "").toLowerCase();
  const desc = (repo.description || "").toLowerCase();

  // Keyword-based heuristic
  const isGenAI = /gpt|llama|transformer|generative|genai|diffusion|stable|stable-diffusion|huggingface|hugging face|prompt|instruct|chat|flan|llm|rag|openai|hf/i.test(name + " " + desc);
  const isDash = /dash|dashboard|streamlit|gradio|shiny|flask|fastapi|react|dashboards|plotly|stream/i.test(name + " " + desc);
  const isML = /ml|model|classification|regression|neural|cnn|rnn|pytorch|tensorflow|sklearn|scikit|xgboost|lightgbm|catboost|training|fine-tune/i.test(name + " " + desc);

  if(isGenAI) return "genai";
  if(isDash) return "dash";
  if(isML) return "ml";
  // fallback: prefer GitHub language hint
  if(repo.language && /python|jupyter/i.test(repo.language)) return "ml";
  return "ml";
}

function chooseThumbUrl(repo){
  // Prefer repo.owner avatar for a nice thumbnail, else homepage if available, else placeholder with repo name
  if(repo.homepage) return repo.homepage;
  if(repo.owner && repo.owner.avatar_url) return repo.owner.avatar_url;
  // placeholder with repo name
  const text = encodeURIComponent(repo.name || "project");
  return `https://via.placeholder.com/720x380.png?text=${text}`;
}

function badgeForLang(lang){
  if(!lang) return null;
  if(LANG_ICON_MAP[lang]) return LANG_ICON_MAP[lang];
  // try to match partial
  for(const key of Object.keys(LANG_ICON_MAP)){
    if(lang.toLowerCase().includes(key.toLowerCase())) return LANG_ICON_MAP[key];
  }
  return null;
}

async function fetchRepos(){
  const api = `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100`;
  try{
    const res = await fetch(api);
    if(!res.ok) throw new Error("GitHub API error: " + res.status);
    const data = await res.json();
    return data;
  }catch(err){
    console.error(err);
    return [];
  }
}

function renderRepos(repos){
  const grid = document.getElementById("project-grid");
  const empty = document.getElementById("projects-empty");
  grid.innerHTML = "";

  if(!repos || repos.length === 0){
    empty.hidden = false;
    return;
  } else {
    empty.hidden = true;
  }

  // sort by updated_at desc and take top MAX_REPOS
  repos.sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at));
  repos.slice(0, MAX_REPOS).forEach(repo => {
    const category = chooseCategory(repo);
    const thumb = chooseThumbUrl(repo);
    const langBadge = badgeForLang(repo.language);

    const card = document.createElement("article");
    card.className = "project-card";
    card.setAttribute("data-category", category);
    card.innerHTML = `
      <div class="project-thumb">
        <img loading="lazy" src="${thumb}" alt="${repo.name} thumbnail" onerror="this.onerror=null;this.src='https://via.placeholder.com/720x380.png?text=${encodeURIComponent(repo.name)}'">
      </div>
      <div class="project-body">
        <div>
          <div class="project-title">${repo.name}</div>
          <div class="project-desc">${repo.description ? repo.description : "<i>No description</i>"}</div>
        </div>

        <div class="meta-row">
          <div class="badges">
            ${ repo.language ? `<span class="badge"><img src="${langBadge || 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg'}" alt="lang"> ${repo.language}</span>` : '' }
            <span class="badge">★ ${repo.stargazers_count}</span>
            <span class="badge">Forks: ${repo.forks_count}</span>
          </div>

          <div class="actions">
            <a class="btn" href="${repo.html_url}" target="_blank" rel="noopener">View</a>
            ${repo.homepage ? `<a class="btn secondary" href="${repo.homepage}" target="_blank" rel="noopener">Demo</a>` : ''}
          </div>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

// filter handling
function initFilters(){
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.dataset.filter;
      applyFilter(filter);
    });
  });
}

function applyFilter(filter){
  const cards = document.querySelectorAll(".project-card");
  cards.forEach(card => {
    const cat = card.dataset.category || "ml";
    if(filter === "all" || filter === cat){
      card.style.display = ""; // show
    } else {
      card.style.display = "none";
    }
  });
}

(async function init(){
  initFilters();
  const repos = await fetchRepos();
  renderRepos(repos);
})();
