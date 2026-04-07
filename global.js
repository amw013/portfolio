function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let pages = [
    { url: '', title: 'home' },
    { url: 'projects/', title: 'projects' },
    // { url: 'contact/', title: 'Contact' },
    { url: 'resume/', title: 'resume' },
    // { url: 'meta/', title: 'Meta' }, 
    // { url: 'https://github.com/amw013', title: 'GitHub' } 
];

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"                  
  : "/portfolio/";       


let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
    let url = p.url.startsWith('http') ? p.url : BASE_PATH + p.url;

    let a = document.createElement('a');
    a.href = url;
    a.textContent = p.title;

    a.classList.toggle(
        'current',
        a.host === location.host && a.pathname === location.pathname
    );

    if (a.host !== location.host) {
        a.target = "_blank";
    }

    nav.append(a);
}

document.body.insertAdjacentHTML(
  'afterbegin',
  `
  <label class="color-scheme">
    theme:
    <select>
      <option value="light dark">automatic</option>
      <option value="light">light</option>
      <option value="dark">dark</option>
    </select>
  </label>
  `
);

const select = document.querySelector('label.color-scheme select');

select.addEventListener('input', function(event) {
    setColorScheme(event.target.value);
});

function setColorScheme(colorScheme) {
    document.documentElement.style.setProperty('color-scheme', colorScheme);

    select.value = colorScheme;

    localStorage.colorScheme = colorScheme;
}

if ('colorScheme' in localStorage) {
    setColorScheme(localStorage.colorScheme);
}

export async function fetchJSON(url) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    const data = await response.json();

    console.log(data);

    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
    if (!containerElement) {
        console.error('Container element is missing or invalid');
        return;
    }
    containerElement.innerHTML = '';

    for (const project of projects) {
        const article = document.createElement('article');

        let imagePath = project.image;
        
        if (imagePath && imagePath.startsWith('../') && location.pathname == '/portfolio/') {
          imagePath = imagePath.replace('../', '');
        }

        const headingTag = /^[hH][1-6]$/.test(headingLevel) ? headingLevel : 'h2';

        const tagsHTML = project.tags?.length
            ? `<div class="project-tags">${project.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>`
            : '';

        const githubHTML = project.github
            ? `<a class="github-link" href="${project.github}" target="_blank" rel="noopener noreferrer">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                GitHub
               </a>`
            : '';

        article.innerHTML = `
            <${headingTag}>${project.title || 'Untitled Project'}</${headingTag}>
            <img src="${imagePath || ''}" alt="${project.title || 'Project Image'}">
            <div class="project-info">
                ${githubHTML}
                <p>${project.description || 'No description provided.'}</p>
                ${tagsHTML}
                <p class="year">${project.year || ''}</p>
            </div>
        `;

        containerElement.appendChild(article);
    }
}


export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}


document.addEventListener("DOMContentLoaded", () => {
    const photo = document.querySelector(".profile-photo");
    const hatA = document.querySelector(".hat");
    const hatB = document.querySelector(".chef-hat");

    hatA.style.display = "none";
    hatB.style.display = "none";

    let hatState = 0; 

    photo.addEventListener("click", () => {
        hatState = (hatState + 1) % 2; 

        hatA.style.display = "none";
        //hatB.style.display = "none";

        if (hatState === 1) {
            hatA.style.display = "block";
            launchConfetti();
        // } else if (hatState === 2) {
        //     hatB.style.display = "block";
        }
    });
});

function launchConfetti() {
    const numParticles = 100; // how many confetti pieces
    for (let i = 0; i < numParticles; i++) {
        const confetto = document.createElement('div');
        confetto.classList.add('confetti');

        // Random starting horizontal position
        confetto.style.left = Math.random() * 100 + 'vw';
        confetto.style.backgroundColor = `hsl(${Math.random()*360}, 70%, 50%)`;
        confetto.style.animationDuration = 2 + Math.random() * 2 + 's'; // 2-4s
        confetto.style.opacity = Math.random() * 0.9 + 0.1;

        document.body.appendChild(confetto);

        // Remove after animation
        confetto.addEventListener('animationend', () => confetto.remove());
    }
}
