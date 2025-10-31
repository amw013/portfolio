function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'contact/', title: 'Contact' },
    { url: 'resume/', title: 'Resume' },
    { url: 'https://github.com/amw013', title: 'GitHub' } 
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
    Theme:
    <select>
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
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
        // if (imagePath && imagePath.startsWith('../')) {
        //     imagePath = imagePath.replace('../', '');
        // }

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

