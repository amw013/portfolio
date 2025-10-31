import { fetchJSON, renderProjects } from '../global.js';
const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');

const projectsTitle = document.querySelector('.projects-title');

projectsTitle.textContent = `${projects.length} Projects`;


renderProjects(projects, projectsContainer, 'h2');

import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

function updatePieChart(projects) {
  d3.select('#projects-pie-plot').selectAll('*').remove();
  d3.select('.legend').selectAll('*').remove();

    const rolledData = d3.rollups(
    projects,
    v => v.length,  
    d => d.year    
    );

    const data = rolledData.map(([year, count]) => ({ value: count, label: year }));

    const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    const sliceGenerator = d3.pie().value(d => d.value);
    const arcData = sliceGenerator(data);   
    const arcs = arcData.map(d => arcGenerator(d));
    
    let colors = d3.scaleOrdinal(d3.schemeTableau10);

    arcs.forEach((arc, idx) => {
    d3.select('#projects-pie-plot')
        .append('path')
        .attr('d', arc)       
        .attr('fill', colors(idx));
    });

    const legend = d3.select('.legend');
    data.forEach((d, idx) => {
    legend
        .append('li')
        .attr('style', `--color:${colors(idx)}`)
        .attr('class', 'legend-item')
        .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
    });

    

}


let query = '';
const searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
    query = event.target.value.toLowerCase();

    const filteredProjects = projects.filter((project) => {
        let values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query);
    });

    renderProjects(filteredProjects, projectsContainer, 'h2');
    updatePieChart(filteredProjects);
});

renderProjects(projects, projectsContainer, 'h2');
updatePieChart(projects);