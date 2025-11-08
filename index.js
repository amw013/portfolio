import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

function renderGitHubStats(githubData, container) {
  if (!container) return;

  container.innerHTML = '';

  const card = document.createElement('div');
  card.classList.add('stats-card');

  const dl = document.createElement('dl');
  dl.classList.add('stats');

  Object.entries(githubData).forEach(([key, value]) => {
    const label = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());

    const dt = document.createElement('dt');
    dt.textContent = label;

    const dd = document.createElement('dd');
    dd.textContent = value;

    dl.append(dt, dd);
  });

  card.appendChild(dl);
  container.appendChild(card);
}

async function main() {
  const projects = await fetchJSON('./lib/projects.json');
  const latestProjects = projects.slice(0, 3);
  const projectsContainer = document.querySelector('.projects');
  renderProjects(latestProjects, projectsContainer, 'h2');

  const githubData = await fetchGitHubData('amw013');
  const profileStats = document.querySelector('#profile-stats');

  renderGitHubStats(githubData, profileStats);
}

main();
