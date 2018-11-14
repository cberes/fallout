(function (w, d) {
  function range(maxExclusive) {
    return [...Array(maxExclusive).keys()];
  }

  function indexBy(arr, indexFunc) {
    return arr.reduce((acc, value) => {
      let index = indexFunc(value);
      let values = acc[index] || [];
      values.push(value);
      acc[index] = values;
      return acc;
    }, {});
  }

  function PlayerSelectionPerkSource() {
    this.getName = function () {
      return 'Player Selection';
    };

    this.getPerkCount = function () {
      return 1;
    };

    this.isAvailable = function (level) {
      return level >= 2;
    };
  }

  function PerkPackPerkSource() {
    this.getName = function () {
      return 'Perk Card Pack';
    };

    this.getPerkCount = function () {
      return 4;
    };

    this.isAvailable = function (level) {
      return (level >= 4 && level < 10 && level % 2 === 0) || (level >= 10 && level % 5 === 0);
    };
  }

  function PerkCounter (perkSources) {
    function getPerksGranted(maxLevelExclusive) {
      return range(maxLevelExclusive).flatMap(level => {
        return perkSources
          .filter(source => source.isAvailable(level))
          .map(source => {
            return {
              level: level,
              source: source.getName(),
              perks: source.getPerkCount()
            };
          });
      });
    }

    function getBasePerkSummary() {
      return perkSources.reduce((acc, source) => {
        acc['Perks via ' + source.getName()] = 0;
        return acc;
      }, {'Total Perks': 0});
    }

    function copyPerkLevel(lastLevel, currentLevel) {
      return Object.assign({}, lastLevel || getBasePerkSummary(), {level: currentLevel});
    }

    function addPerks(result, perks) {
      return perks.reduce((acc, perk) => {
        let value = perk.perks;
        acc['Perks via ' + perk.source] += value;
        acc['Total Perks'] += value;
        return acc;
      }, result);
    }

    this.getKeys = function () {
      return perkSources.reduce((acc, source) => {
        acc.push('Perks via ' + source.getName());
        return acc;
      }, ['Total Perks']);
    }

    this.getPerksByLevel = function (maxLevelExclusive) {
      let perksGranted = getPerksGranted(maxLevelExclusive);
      let perksGrantedByLevel = indexBy(perksGranted, grant => grant.level);
      let i, perks = [], currentLevel;

      for (i = 0; i < maxLevelExclusive; ++i) {
        currentLevel = copyPerkLevel(currentLevel, i);
        addPerks(currentLevel, perksGrantedByLevel[i] || []);
        perks.push(currentLevel);
      }
      return perks;
    };
  }

  function PerkChart(perks, keys) {
    function getLevels() {
      return perks.map(perk => perk.level);
    }

    function getSeries(name) {
      return {
        name: name,
        values: perks.map(level => level[name])
      };
    }

    function getAllSeries() {
      return keys.map(getSeries);
    }

    function getData() {
      return {
        y: 'Perks',
        series: getAllSeries(),
        levels: getLevels()
      };
    }

    this.render = function () {
      // I understand very little of the D3 code
      var data = getData();

      var line = d3.line()
        .defined(d => !isNaN(d))
        .x((d, i) => x(data.levels[i]))
        .y(d => y(d));

      var width = 1000;
      var height = 600;

      var margin = {top: 20, right: 20, bottom: 30, left: 40};

      var x = d3.scaleLinear()
        .domain(d3.extent(data.levels))
        .range([margin.left, width - margin.right]);

      var y = d3.scaleLinear()
        .domain([0, d3.max(data.series, d => d3.max(d.values))]).nice()
        .range([height - margin.bottom, margin.top]);

      var xAxis = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));

      var yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        .call(g => g.select(".domain").remove())
        .call(g => g.select(".tick:last-of-type text").clone()
        .attr("x", 3)
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text(data.y));

      var color = d3.scaleOrdinal(d3.schemeCategory10).domain(data.series.map(d => d.name));

      var legend = svg => {
        const g = svg
          .attr("font-family", "sans-serif")
          .attr("font-size", 10)
          .selectAll("g")
          .data(color.domain().slice().reverse())
          .enter().append("g")
          .attr("transform", (d, i) => `translate(0,${i * 20})`);
      
        g.append("rect")
            .attr("width", 19)
            .attr("height", 19)
            .attr("fill", color);
      
        g.append("text")
            .attr("x", 24)
            .attr("y", 9.5)
            .attr("dy", "0.35em")
            .text(d => d);
      };

      const svg = d3.select("#chart");

      svg.append("g")
        .call(xAxis);

      svg.append("g")
        .call(yAxis);

      svg.append("g")
        .attr("transform", `translate(${margin.left + 1},${margin.top + 10})`)
        .call(legend);

      svg.append("g")
        .attr("fill", "none")
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .selectAll("path")
        .data(data.series)
        .enter().append("path")
        .style("mix-blend-mode", "multiply")
        .attr("stroke", d => color(d.name))
        .attr("d", d => line(d.values));
    };
  }

  d.onreadystatechange = function () {
    if (d.readyState === 'interactive') {
      let sources = [new PlayerSelectionPerkSource(), new PerkPackPerkSource()];
      let calc = new PerkCounter(sources);
      let levels = calc.getPerksByLevel(61);
      let perkChart = new PerkChart(levels, calc.getKeys());
      perkChart.render();
    }
  };
}(window, document));
