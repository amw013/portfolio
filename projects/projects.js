import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const projectsTitle = document.querySelector('.projects-title');
projectsTitle.textContent = `${projects.length} Projects`;

let query = '';
let selectedIndex = -1;
let pieData = []; 

function getFilteredProjects() {
  return projects.filter((p) => {
    const matchesQuery = Object.values(p).join('\n').toLowerCase().includes(query);
    const matchesYear = selectedIndex === -1 || p.year === pieData[selectedIndex].label;
    return matchesQuery && matchesYear;
  });
}

function renderPieChart(currentProjects) {
  const svg = d3.select('#projects-pie-plot');
  const legend = d3.select('.legend');
  svg.selectAll('*').remove();
  legend.selectAll('*').remove();

  const rolledData = d3.rollups(
    currentProjects,
    (v) => v.length,
    (d) => d.year
  );

  pieData = rolledData.map(([year, count]) => ({ value: count, label: year }));

  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  const sliceGenerator = d3.pie().value((d) => d.value);
  const arcs = sliceGenerator(pieData);
  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  arcs.forEach((arc, i) => {
    svg
      .append('path')
      .attr('d', arcGenerator(arc))
      .attr('fill', colors(i))
      .attr('class', i === selectedIndex ? 'selected' : '')
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;

        const filteredProjects = getFilteredProjects();
        renderProjects(filteredProjects, projectsContainer, 'h2');
        renderPieChart(filteredProjects);
      });
  });

  pieData.forEach((d, i) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(i)}`)
      .attr('class', i === selectedIndex ? 'legend-item selected' : 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;
        const filteredProjects = getFilteredProjects();
        renderProjects(filteredProjects, projectsContainer, 'h2');
        renderPieChart(filteredProjects);
      });
  });
}

renderProjects(projects, projectsContainer, 'h2');
renderPieChart(projects);

const searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('input', (event) => {
  query = event.target.value.toLowerCase();

  const filteredProjects = getFilteredProjects();
  renderProjects(filteredProjects, projectsContainer, 'h2');
  renderPieChart(filteredProjects);
});
