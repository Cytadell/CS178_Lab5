function draw_svg(container_id, margin, width, height){
    svg = d3.select("#"+container_id)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("background-color", "#dbdad7")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    return svg
}

function draw_xaxis(plot_name, svg, height, scale){
    svg.append("g")
        .attr('class', plot_name + "-xaxis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(scale).tickSize(0))
}

function draw_yaxis(plot_name, svg, scale){
    svg.append("g")
        .attr('class', plot_name + "-yaxis")
        .call(d3.axisLeft(scale));
}

function draw_axis(plot_name, axis, svg, height, domain, range, discrete){
    if (discrete){
        var scale = d3.scaleBand()
            .domain(domain)
            .range(range)
            .padding([0.2])
    } else {
        var scale = d3.scaleLinear()
            .domain(domain)
            .range(range);
    }
    if (axis=='x'){
        draw_xaxis(plot_name, svg, height, scale)
    } else if (axis=='y'){
        draw_yaxis(plot_name, svg, scale)
    }
    return scale
}

function draw_axes(plot_name, svg, width, height, domainx, domainy, x_discrete){
    var x_scale = draw_axis(plot_name, 'x', svg, height, domainx, [0, width], x_discrete)
    var y_scale = draw_axis(plot_name, 'y', svg, height, domainy, [height, 0], false)
    
    //print x_scale, y_scale

    return {'x': x_scale, 'y': y_scale}
}

function draw_slider(column, min, max, scatter_svg, bar_svg, scatter_scale, bar_scale){
    
    slider = document.getElementById(column+'-slider')
    
    noUiSlider.create(slider, {
      start: [min, max],
      connect: false,
          tooltips: true,
      step: 1,
      range: {'min': min, 'max': max}
    });
    
    slider.noUiSlider.on('change', function(){
        update(scatter_svg, bar_svg, scatter_scale, bar_scale)
    });
}

// TODO: Write a function that draws the scatterplot
function draw_scatter(data, svg, scale) {
    // console.log(data);

    //scatter_ranges = [min_x,max_x,min_y,max_y]
    xScale_scatter = scale['x']
    yScale_scatter = scale['y']

    // Add dots to the scatterplot
    let dots = svg
        .append("g")
        .selectAll(".dot")
        .data(data)
        .join("circle")
        .attr("class", "dot")
        .attr("cx", (d) => xScale_scatter(d["X"]))
        .attr("cy", (d) => yScale_scatter(d["Y"]))
        .attr("r", 3)      
        .attr("stroke", "Black")
        .attr("stroke-width", 1)
        .attr("fill", "red")
    
}

function draw_bar(data, svg, scale) {

    // Extract scales
    let xScale_bar = scale['x'];
    let yScale_bar = scale['y'];

    // Draw bars
    svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale_bar(d["month"]))
        .attr("y", d => yScale_bar(d["count(X)"]))
        .attr("width", xScale_bar.bandwidth())
        .attr("height", d => height - yScale_bar(d["count(X)"]))
        .attr("fill", "steelblue") 
        .attr("stroke", "black")
        .attr("stroke-width", 1);
}


// Function to update the selectedDays array
function updateSelectedDays() {
    var day = []

    var checkedBoxes = d3.selectAll('input[type="checkbox"]:checked');

    checkedBoxes.each(function() {        
        // console.log(this.value);
        day.push(this.value);
    });

    // console.log("Selected Days:", day);
    return day;
}


// COMPLETED: Write a function that extracts the selected days and minimum/maximum values for each slider
function get_params(){
    
    var day = []
    var humidity = [0, 0]
    var temp = [0, 0]
    var wind = [0, 0]

    // extract and update the selected days
    day = updateSelectedDays();
    d3.selectAll(".checkboxDays")
        .on("change", updateSelectedDays);

    // extract and update the minimum and maximum values for each slider
    const hum_slider = document.getElementById('humidity-slider').noUiSlider;
    humidity = [hum_slider.get()[0], hum_slider.get()[1]];

    const temp_slider = document.getElementById('temp-slider').noUiSlider;
    temp = [temp_slider.get()[0], temp_slider.get()[1]];

    const wind_slider = document.getElementById('wind-slider').noUiSlider;
    wind = [wind_slider.get()[0], wind_slider.get()[1]];

    //console.log("Humidity:", humidity);
    //console.log("Temp:", temp);
    //console.log("Wind:", wind);

    return {'day': day, 'humidity': humidity, 'temp': temp, 'wind': wind}
}

// TODO: Write a function that removes the old data points and redraws the scatterplot
function update_scatter(data, svg, scale){
    // removes the old data points
    svg.selectAll(".dot").remove();
    draw_scatter(data, svg, scale)
}

// COMPLETED: Write a function that updates the y-axis, removes the old bars, and redraws the bars
function update_bar(data, max_count, svg, scale){
    svg.selectAll(".bar").remove();
    draw_bar(data, svg, scale)
}

function update(scatter_svg, bar_svg, scatter_scale, bar_scale){
    params = get_params()
    fetch('/update', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(params),
        cache: 'no-cache',
        headers: new Headers({
            'content-type': 'application/json'
        })
    }).then(async function(response){
        var results = JSON.parse(JSON.stringify((await response.json())))
        update_scatter(results['scatter_data'], scatter_svg, scatter_scale)
        update_bar(results['bar_data'], results['max_count'], bar_svg, bar_scale)
    })
}