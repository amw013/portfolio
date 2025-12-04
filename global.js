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

        article.innerHTML = `
            <${headingTag}>${project.title || 'Untitled Project'}</${headingTag}>
            <img src="${imagePath || ''}" alt="${project.title || 'Project Image'}">
            <div class="project-info">
                <p>${project.description || 'No description provided.'}</p>
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
        hatState = (hatState + 1) % 3; 

        hatA.style.display = "none";
        hatB.style.display = "none";

        if (hatState === 1) {
            hatA.style.display = "block";
            launchConfetti();
        } else if (hatState === 2) {
            hatB.style.display = "block";
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
