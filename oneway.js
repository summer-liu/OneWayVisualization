
var width = 1250, height = 480,centered;

var projection = d3.geo.albersUsa()
					.translate([width/2-100, height/2])
					.scale([1000]);


var path = d3.geo.path()
				.projection(projection);

var svg = d3.select("body").append("svg").attr("width",width).attr("height",height);

svg.append("rect")
	.attr("class","background")
	.attr("width",width)
	.attr("height",height)
	.attr("fill","none")
	.on("click",clicked);

var g = svg.append("g");

var stateGroup = g.append("g");
var lineGroup = g.append("g");
var cityGroup = g.append("g");
var imageGroup = g.append("g");
var textGroup = g.append("g");

var state = ["California","Nevada","Utah","Colorado","Kansas","Missouri","Illinois","Kentucky","Virginia","DC"];

d3.json("us-states-topo.json", function(err,us){
	if (err) console.error(err);

	for (var i=0; i < topojson.feature(us,us.objects.states).features.length; i++){

		var jsonState = topojson.feature(us,us.objects.states).features[i].properties.name;
		//console.log(jsonState);
		 if (state.indexOf(jsonState)>-1){
		 	topojson.feature(us,us.objects.states).features[i].properties.weRide = 1;
		 	console.log(topojson.feature(us,us.objects.states).features[i].properties.name);
		 }
	}
	
	stateGroup.append("g")
		.attr("id","states")
		.selectAll("path")
		.data(topojson.feature(us,us.objects.states).features)
		.enter()
		.append("path")
		.attr("d",path)
		.style("fill",function(d){
			if(d.properties.weRide){
				return "#9AFF9A"
			}else{
				return "#ccc"
			}
		})
		.on("click",clicked);


    stateGroup.append("path")
      .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
      .attr("id", "state-borders")
      .attr("d", path);

	stateGroup.selectAll(".state-name")
		.data(topojson.feature(us,us.objects.states).features)
		.enter()
		.append("text")
		.attr("class", "state-name")
		.attr("transform",function(d){return "translate(" + path.centroid(d) + ")";})
		.attr("dx", function (d) { return d.properties.dx || "0"; })
        .attr("dy", function (d) { return d.properties.dy || "0.35em"; })		
        .text(function(d){return d.properties.name;})
        .style("pointer-events", "none")


	d3.tsv("oneway-data.tsv",function(err,data){
		if (err) console.error(err);

		var tip1 = d3.tip()
		  .attr('class', 'd3-tip t1')
		  .offset([0, 5])
		  .direction('ne')
		  .html(function(d) {
		  return "<p><strong>"+d.city+"</strong></p>"+"<p><strong>Population:</strong> " + d.population + "</p>";
		  });

		cityGroup.call(tip1);

		
		cityGroup.selectAll("circle")
		.data(data)
		.enter()
		.append("circle")
		.attr("class","city")
		.attr("cx",function(d){return projection([d.lon,d.lat])[0];})
		.attr("cy",function(d){return projection([d.lon,d.lat])[1];})
		.attr("r",function(d,i){
			if(i == 0 || i == (data.length-1)) return 3.5;
			else return 1.6;})//var population = d.population.replace(/,/g,"");//return Math.log(parseInt(population)*0.005);
	    .on('mouseover',tip1.show)
	    .on('mouseout',tip1.hide)

	    cityGroup.selectAll('.city-label')
	    	.data(data)
	    	.enter()
	    	.append("text")
	    	.attr("class","city-label")
	    	.attr("transform",function(d){return "translate("+projection([d.lon,d.lat])+")";})
	    	.attr("dx",function(d){
	    			    if (d.city == "Sonora") return "1.3em"
	    			   	else return ".5em"

	    	})
	    	//.attr("dy",function(d,i){if(i%2) {return "0.9em";} else {return "-0.8em";} })
	    	.attr("dy",function(d,i){
	    		if (d.city == "Sonora") return ".5em"
	    		if(i==data.length-1) return "0em" 
	    		else if(projection([d.lon,d.lat])[1] < projection([data[i+1].lon,data[i+1].lat])[1] ){return "-1.0em"}
	    		else return "1.0em" })
	    	.text(function(d){return d.city})
	    	//.style("pointer-events", "none")
	    	.on('mouseover',tip1.show)
	    	.on('mouseout',tip1.hide)




	    var links = [];
	    for (var i = 0; i < data.length-1; i++){
	    	links.push({
	    		type : "LineString",
	    		start_city: data[i].city,
	    		end_city: data[i+1].city,
	    		distance: data[i+1].distance,
	    		elevation: data[i+1].elevation,
	    		coordinates:[
	    			[data[i].lon,data[i].lat],
	    			[data[i+1].lon,data[i+1].lat]
	    		]
	    	})
	    }
	    console.log(links[1].coordinates[0][0])

	      var tip2 = d3.tip()
		  .attr('class', 'd3-tip t2')
		  .offset([0, 5])
		  .direction('n')
		  .html(function(d,i) {
		  return "<p><strong>Riding Day "+(i+1)+" : "+d.start_city+"--"+d.end_city+"</strong></p>"+"<p><strong>Distance:</strong> " + d.distance + " miles</p>"+"<p><strong>Elevation:</strong> " + d.elevation + " feet</p>";
		  });

		lineGroup.call(tip2);


	    lineGroup.selectAll(".line")
	    			.data(links)
	    			.enter()
	    			.append("path")
	    			.attr({'class':'line'})
	    			.attr({d:path})
	    			.attr("id", function(d,i){return 'line'+i})
				    .on('mouseover',tip2.show)
				    .on('mouseout',tip2.hide)	

	    var linelabels = lineGroup.selectAll(".linelabel")
	    			.data(links)
	    			.enter()
	    			.append("text")
	    			.attr("class","linelabel")
	    			.attr("id",function(d,i) {return 'linelabel'+i})
	    			.attr("dx",function(d,i){
	    				if(i==1) return 2;
	    				if(i==2) return 5;
	    				if (i==11) return 5;
	    				if(i==19) return 5;
	    				var midx = (parseFloat(d.coordinates[1][0])+parseFloat(d.coordinates[0][0]))/2;
	    				var midy = (parseFloat(d.coordinates[1][1])+parseFloat(d.coordinates[0][1]))/2;
	    				//console.log(midx)
	    				var midpoint = [midx,midy];
	    				// console.log(midpoint);
	    				var mid = projection(midpoint)[0];
	    				var ori = projection(d.coordinates[0])[0];
	    				var aug = mid - ori;
	    				console.log(aug)
	    				return aug-1;})
	    			//.attr("dx",function(d){console.log(d.coordinates[0][0]); return 0;})

	    			//.attr('transform',function(d){return "translate("+projection([(d.coordinates[0][0]+d.coordinates[1][0])/2,(d.coordinates[1][0]+d.coordinates[1][1])/2])[0] + ","+"0)"})
	    			//.attr("dx",function(d){return (d.coordinates[0][0]+d.coordinates[1][0])/2  })
	    			.attr("dy",-0.6)
	    linelabels.append('textPath')
	    			.attr('xlink:href',function(d,i){return '#line'+i})		
	    			.text(function(d,i){return d.distance})
        			//.style("pointer-events", "none")
        			 .on('mouseover',tip2.show)
				    .on('mouseout',tip2.hide)	
		// lineGroup.selectAll('.line-label')
	 //    	.data(links)
	 //    	.enter()
	 //    	.append("text")
	 //    	.attr("class","line-label")
	 //    	.attr("transform",function(d){return "translate("+path.centroid(d)+")";})
	 //    	.attr("transform",function(d){return "rotate(0)"})
	 //    	.attr("dx",function(d){return "0em"})
	 //    	//.attr("dy",function(d,i){if(i%2) {return "0.9em";} else {return "-0.8em";} })
	 //    	.attr("dy",function(d,i){return "-.35em"})
	 //    	.text(function(d){return d.distance});
		
	})



	imageGroup.selectAll(".image").data([0])
		.enter()
		.append("svg:image")
	    .attr("xlink:href", "../images/bike.jpeg")
	    .attr("width", "50")
	    .attr("height", "50")
	    .attr("x",110 )
	    .attr("y", 180);

	textGroup.selectAll(".text").data([0])
		.enter()
		.append("text")
		.text("Total Riding Distance ")
		.style("font-weight","bold")
		.attr("x",1000)
		.attr("y",50)

	textGroup.selectAll(".text").data([0])
		.enter()
		.append("text")
		.text("3,804 miles ")
		.style("text-anchor","center")
		.style("font-weight","bold")
		.style("font-size","25px")
		.attr("x",1020)
		.attr("y",80)

	textGroup.selectAll(".text").data([0])
		.enter()
		.append("text")
		.text(" 1 * ")
		.style("text-anchor","center")
		//.style("font-weight","bold")
		.style("font-size","20px")
		.attr("x",950)
		.attr("y",150)

	imageGroup.selectAll(".image").data([0])
		.enter()
		.append("svg:image")
	    .attr("xlink:href", "../images/radius2.jpg")
	    .attr("width", "70")
	    .attr("height", "70")
	    .attr("x",1000 )
	    .attr("y", 100);
	textGroup.selectAll(".text").data([0])
		.enter()
		.append("text")
		.text(" Earth Radius ")
		.style("text-anchor","center")
		//.style("font-weight","bold")
		.style("font-size","15px")
		.attr("x",1100)
		.attr("y",150)

	textGroup.selectAll(".text").data([0])
		.enter()
		.append("text")
		.text(" 1/6 * ")
		.style("text-anchor","center")
		//.style("font-weight","bold")
		.style("font-size","20px")
		.attr("x",950)
		.attr("y",215)

	imageGroup.selectAll(".image").data([0])
		.enter()
		.append("svg:image")
	    .attr("xlink:href", "../images/equator.jpg")
	    .attr("width", "70")
	    .attr("height", "70")
	    .attr("x",1000 )
	    .attr("y", 170);
	textGroup.selectAll(".text").data([0])
		.enter()
		.append("text")
		.text(" Equatorial Circumference  ")
		.style("text-anchor","center")
		//.style("font-weight","bold")
		.style("font-size","15px")
		.attr("x",1080)
		.attr("y",210);






	textGroup.selectAll(".text").data([0])
		.enter()
		.append("text")
		.text("Total Elevation Gain ")
		.style("font-weight","bold")
		.attr("x",990)
		.attr("y",300)

	textGroup.selectAll(".text").data([0])
		.enter()
		.append("text")
		.text("203,421 feet ")
		.style("text-anchor","center")
		.style("font-weight","bold")
		.style("font-size","25px")
		.attr("x",1000)
		.attr("y",330)

	textGroup.selectAll(".text").data([0])
		.enter()
		.append("text")
		.text(" 7 * ")
		.style("text-anchor","center")
		//.style("font-weight","bold")
		.style("font-size","20px")
		.attr("x",950)
		.attr("y",380)

	imageGroup.selectAll(".image").data([0])
		.enter()
		.append("svg:image")
	    .attr("xlink:href", "../images/mount.jpeg")
	    .attr("width", "70")
	    .attr("height", "70")
	    .attr("x",1000 )
	    .attr("y", 340);
	textGroup.selectAll(".text").data([0])
		.enter()
		.append("text")
		.text(" Mount Everest ")
		.style("text-anchor","center")
		//.style("font-weight","bold")
		.style("font-size","15px")
		.attr("x",1100)
		.attr("y",380)

	textGroup.selectAll(".text").data([0])
		.enter()
		.append("text")
		.text(" 227 * ")
		.style("text-anchor","center")
		//.style("font-weight","bold")
		.style("font-size","20px")
		.attr("x",950)
		.attr("y",450)

	imageGroup.selectAll(".image").data([0])
		.enter()
		.append("svg:image")
	    .attr("xlink:href", "../images/eiffel.jpeg")
	    .attr("width", "70")
	    .attr("height", "70")
	    .attr("x",1000 )
	    .attr("y", 400);
	textGroup.selectAll(".text").data([0])
		.enter()
		.append("text")
		.text(" Eiffel Tower ")
		.style("text-anchor","center")
		//.style("font-weight","bold")
		.style("font-size","15px")
		.attr("x",1100)
		.attr("y",440);


})

function clicked(d) {
  var x, y, k;

  if (d && centered !== d) {
    var centroid = path.centroid(d);
    x = centroid[0];
    y = centroid[1];
    k = 4;
    centered = d;
  } else {
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;
  }

  g.selectAll("path")
      .classed("active", centered && function(d) { return d === centered; });

  g.transition()
      .duration(750)
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
      .style("stroke-width", 1.5 / k + "px");
}

