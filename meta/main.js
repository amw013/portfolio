import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: +row.line,
    depth: +row.depth,
    length: +row.length,
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));

  return data;
}


function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)  
    .map(([commit, lines]) => {
      let first = lines[0];  
      let { author, date, time, timezone, datetime } = first;

      let ret = {
        id: commit,
        url: 'https://github.com/YOUR_REPO/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };


      Object.defineProperty(ret, 'lines', {
        value: lines,
        writable: false,      
        configurable: false,  
        enumerable: false,    
      });

      return ret;
    });
}

function renderCommitInfo(data, commits) {
  // Clear previous content
  d3.select('#stats').selectAll('*').remove();

  // Card wrapper
  const card = d3.select('#stats')
    .append('div')
    .attr('class', 'stats-card');

  const dl = card.append('dl').attr('class', 'stats');

  // Helper function to ensure dt + dd stay together
  function addStat(label, value) {
    const stat = dl.append('div').attr('class', 'stat');
    stat.append('dt').html(label);
    stat.append('dd').text(value);
  }

  // --- Stats ---

  addStat(
    'Total Lines of Code',
    data.length
  );

  addStat('Total commits', commits.length);

  const numFiles = d3.groups(data, d => d.file).length;
  addStat('Number of files', numFiles);

  const fileLengths = d3.rollups(
    data,
    v => d3.max(v, d => d.line),
    d => d.file
  );
  const longestFile = d3.greatest(fileLengths, d => d[1])?.[0];
  addStat('Longest file', longestFile);

  const avgLineLength = d3.mean(data, d => d.length).toFixed(1);
  addStat('Average line length (chars)', avgLineLength);

  const workByPeriod = d3.rollups(
    data,
    v => v.length,
    d => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' })
  );
  const maxPeriod = d3.greatest(workByPeriod, d => d[1])?.[0];
  addStat('Most active time of day', maxPeriod);
}

function renderTooltipContent(commit) {
  if (!commit) return;

  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time');
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');

  link.href = commit.url;
  link.textContent = commit.id;

  date.textContent = commit.datetime?.toLocaleString('en', { dateStyle: 'full' });
  time.textContent = commit.datetime?.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
  author.textContent = commit.author;
  lines.textContent = commit.totalLines;
}



function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.display = isVisible ? 'grid' : 'none';
}




function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  const svg = document.querySelector('#chart svg');

  const [x, y] = d3.pointer(event, svg);

  const offsetX = 10;
  const offsetY = 10;

  const svgRect = svg.getBoundingClientRect();

  tooltip.style.left = `${svgRect.left + x + offsetX}px`;
  tooltip.style.top = `${svgRect.top + y + offsetY}px`;
}


function isCommitSelected(selection, commit, xScale, yScale) {
  if (!selection) return false;

  const [[x0, y0], [x1, y1]] = selection;
  const cx = xScale(commit.datetime);
  const cy = yScale(commit.hourFrac);

  return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
}

function renderSelectionCount(selection, commits, xScale, yScale) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d, xScale, yScale))
    : [];

  const countElement = document.querySelector('#selection-count');
  countElement.textContent = `${selectedCommits.length || 'No'} commits selected`;

  return selectedCommits;
}

function renderLanguageBreakdown(selection, commits, xScale, yScale) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d, xScale, yScale))
    : [];

  const container = document.getElementById('language-breakdown');
  container.innerHTML = ''; // Clear previous content

  if (selectedCommits.length === 0) return;

  const lines = selectedCommits.flatMap(d => d.lines);
  const breakdown = d3.rollup(
    lines,
    v => v.length,
    d => d.type
  );

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    container.innerHTML += `
      <div>
        <dt>${language}</dt>
        <dd>${count} lines (${formatted})</dd>
      </div>
    `;
  }
}



function brushed(event, xScale, yScale) {
  const selection = event.selection;

  d3.selectAll('circle')
    .classed('selected', (d) => isCommitSelected(selection, d, xScale, yScale));

  renderSelectionCount(selection, commits, xScale, yScale);
  renderLanguageBreakdown(selection, commits, xScale, yScale);
}

function onTimeSliderChange() {
  const slider = document.getElementById('commit-progress');
  commitProgress = +slider.value;

  commitMaxTime = timeScale.invert(commitProgress);

  const t = document.getElementById('commit-time');
  t.textContent = commitMaxTime.toLocaleString('en', {
    dateStyle: "long",
    timeStyle: "short",
  });

  console.log("Showing commits up to:", commitMaxTime);
}


function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 40, right: 40, bottom: 60, left: 80 };

  const [minLines, maxLines] = d3.extent(commits, d => d.totalLines);
  const rScale = d3.scaleSqrt()
    .domain([minLines, maxLines])
    .range([2, 30]);
  d3.select('#chart').selectAll('*').remove();

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  const yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  // Gridlines
  const gridlines = svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

  gridlines.call(
    d3.axisLeft(yScale)
      .tickFormat('')
      .tickSize(-usableArea.width)
  );

  const xAxis = d3.axisBottom(xScale).tickFormat(d3.timeFormat('%b %d'));
  const yAxis = d3.axisLeft(yScale)
    .tickFormat(d => String(d % 24).padStart(2, '0') + ':00');

  svg.append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis)
    .selectAll('text')
    .attr('transform', 'rotate(-45)')
    .style('text-anchor', 'end');

  svg.append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

  const dots = svg.append('g').attr('class', 'dots');

  const sortedCommits = commits.slice().sort((a, b) => b.totalLines - a.totalLines);

  const brush = d3.brush()
    .on('start brush end', (event) => brushed(event, xScale, yScale));

  svg.call(brush);

  dots.selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)  
    .on('mouseenter', (event, commit) => {
        d3.select(event.currentTarget).style('fill-opacity', 1); 
        renderTooltipContent(commit);
        updateTooltipVisibility(true);
        updateTooltipPosition(event);
    })
    .on('mousemove', (event) => updateTooltipPosition(event))
    .on('mouseleave', (event) => {
        d3.select(event.currentTarget).style('fill-opacity', 0.7); 
        updateTooltipVisibility(false);
    });

  
  svg.select('.dots').raise();


}





let data = await loadData();
let commits = processCommits(data);
let commitProgress = 100;

let timeScale = d3.scaleTime()
  .domain([
    d3.min(commits, d => d.datetime),
    d3.max(commits, d => d.datetime)
  ])
  .range([0, 100]);

let commitMaxTime = timeScale.invert(commitProgress);

renderCommitInfo(data, commits);

document.getElementById('commit-progress')
  .addEventListener('input', onTimeSliderChange);

onTimeSliderChange();

renderScatterPlot(data, commits);
