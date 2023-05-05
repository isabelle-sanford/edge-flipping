
// todo: get input from user
// const tri4 = [[0, 0], [0, 100],  [200,100], [50, 60]];
// const delau4 = d3.Delaunay.from(tri4);

const expoints = [[40,40], [200,40], [200, 200], [40, 180], [300,160], [100,400], [100,140], [60, 220]]
// const delau = d3.Delaunay.from(points)

let POINTS = [];
let DELAU;
let HULLPTS;
let TRIANGLES;
let SPLITTRIANGLES = [];
let TPATHS = [];
let POINTSGROUP;
let MODE = "flip";
let selectedInput = [];

let EDGES = []; // [[neightbors of pt 0], [neighbors of pt 1], ...]

// Define SVG area dimensions
const svgWidth = 500;
const svgHeight = 500;

// Define the chart's margins as an object
const margin = {
  top: 20,
  right: 20,
  bottom: 20,
  left: 20,
};

const chartWidth = svgWidth - margin.left - margin.right;
const chartHeight = svgHeight - margin.top - margin.bottom;


let svg = d3
  .select("#svg-area")
  .append("svg")
  .attr("height", svgHeight)
  .attr("width", svgWidth)
  //.attr("style", "background-color:lightblue")


let chartGroup = svg.append("g")
  .attr("transform", `translate(${margin.left}, +${margin.top})`);

  // does this get used
let background = chartGroup
            .append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("style", "fill:lightblue")

let ptsGroup = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);
POINTSGROUP = ptsGroup.selectAll("circle")


// note: only does 3 pts to make a triangle
function getPath(pts) {
    let path = d3.path()
    path.moveTo(POINTS[pts[0]][0], POINTS[pts[0]][1]) // 
    path.lineTo(POINTS[pts[1]][0], POINTS[pts[1]][1])
    path.lineTo(POINTS[pts[2]][0], POINTS[pts[2]][1])
    path.closePath()

    return path.toString()
}

// DELAUNAY - not used(?)
function delauTriangulation(pts) {
    console.log("calculating triangulation...");
    chartGroup.selectAll("path").remove();
    ptsGroup.selectAll("circle").remove();

    // TODO check if <3 pts

    DELAU = d3.Delaunay.from(pts)
    POINTS = pts // is this ok? 
    HULLPTS = DELAU.hull
    TRIANGLES = DELAU.triangles

    console.log("given triangles: ", TRIANGLES)

    SPLITTRIANGLES = []

    for (let j = 0; j < TRIANGLES.length; j += 3) {
        let coord = TRIANGLES.slice(j, j+3)
        //console.log("adding triangle", coord)
        SPLITTRIANGLES.push(coord)
        //console.log("curr ST after push: ", SPLITTRIANGLES)
    }

    console.log("ending triangles:", SPLITTRIANGLES)

    // each triangle gets a corresponding path drawn for it 
    let tp = []
    SPLITTRIANGLES.forEach((t, i) => {
        //console.log("appending triangle ", t)
        let p = getPath(t)
        tp.push(p)

        chartGroup.append("path")
        .attr("d", p)
        .attr("id", "path" + i) // ????

    })


    // draw points
    POINTSGROUP = ptsGroup.selectAll("circle")
        .data(POINTS)
        .enter()
        .append("circle")
        .attr("cx", p => p[0])
        .attr("cy", p => p[1])
        .attr("r", 7)
        .attr("ptloc", (p, i) => i)

    TPATHS = tp
    //console.log("hull points: ", HULLPTS)

}

// triangulate with triangle-splitting algorithm
function splitTriangulation(pts) {
    console.log("triangulating via triangle-splitting...")
    chartGroup.selectAll("path").remove();
    ptsGroup.selectAll("circle").remove();
    

    DELAU = d3.Delaunay.from(pts)
    POINTS = pts // is this ok? 
    HULLPTS = DELAU.hull
    selectedInput = [];
    //TRIANGLES = DELAU.triangles

    EDGES = []
    SPLITTRIANGLES = []
    
    for (i = 1; i < HULLPTS.length - 1; i++) { // ! check bounds
        let nextT = [HULLPTS[0], HULLPTS[i], HULLPTS[i+1]];
        SPLITTRIANGLES.push(nextT);
        
    }

    console.log("hull triangulation: ", SPLITTRIANGLES)
    
    POINTS.forEach((p,i) => { // p = [x,y], i = 4
        EDGES.push([]) // to make sure EDGES is length of # of points
        if (HULLPTS.includes(i)) {return}

        let inT; // which triangle point p is inside
        let inTidx;
        SPLITTRIANGLES.forEach((t,idx) => { // t = [1, 2, 3]
            if (tContainsPt(t, i)) {
                inT = t;
                inTidx = idx;
            }
        })
        
        // remove original triangle and add three with two points of original plus new pt
        SPLITTRIANGLES.splice(inTidx, 1, [i, inT[0], inT[1]], [i, inT[1], inT[2]], [i, inT[0], inT[2]])

    })

    console.log("triangulation after splitting: ", SPLITTRIANGLES);

    // same as delaunay after this ----

    // each triangle gets a corresponding path drawn for it 
    let tp = []
    SPLITTRIANGLES.forEach((t, i) => { // [1, 2, 3], i (path #)
        //console.log("appending triangle ", t)
        let p = getPath(t)
        tp.push(p)

        chartGroup.append("path")
        .attr("d", p)
        .attr("id", "path" + i) // ????


        // if edge is not recorded in EDGES, record it
        // this is questionable but works
        if (!EDGES[t[0]].includes(t[1])) {EDGES[t[0]].push(t[1])}
        if (!EDGES[t[0]].includes(t[2])) {EDGES[t[0]].push(t[2])}
        if (!EDGES[t[1]].includes(t[0])) {EDGES[t[1]].push(t[0])}
        if (!EDGES[t[1]].includes(t[2])) {EDGES[t[1]].push(t[2])}
        if (!EDGES[t[2]].includes(t[0])) {EDGES[t[2]].push(t[0])}
        if (!EDGES[t[2]].includes(t[1])) {EDGES[t[2]].push(t[1])}

    })

    console.log("edges recorded:", EDGES);


    // draw points
    POINTSGROUP = ptsGroup.selectAll("circle")
        .data(POINTS)
        .enter()
        .append("circle")
        .attr("cx", p => p[0])
        .attr("cy", p => p[1])
        .attr("r", 10)
        //.attr("text", (p, i) => i)


        // note: breaks on deletion
    // ptsGroup.selectAll("text")
    //     .data(POINTS)
    //     .enter()
    //     .append("text")
    //     .attr("x", p => p[0])
    //     .attr("y", p => p[1])
    //     .html((p, i) => i)
    //     .attr("fill", "lightgreen")
    //     .attr("font-weight", "bold")
    //     .attr("text-anchor", "middle")
    //     .attr("dominant-baseline", "middle")
    //     .attr("font-size", 12)

    TPATHS = tp


    // maybe split this bit into its own small function (bc also used at end of flipEdge)
    let delauText = d3.select("#delaunay-indicator")
    if (isDelau()) {
        delauText.html("<p>This is a Delaunay triangulation!<p>");
    } else {
        delauText.html("")
    }

}


splitTriangulation(expoints);


function tContainsPt(triangle, pt) {
    let convertedT = [POINTS[triangle[0]], POINTS[triangle[1]], POINTS[triangle[2]]]
    let convertedpt = POINTS[pt]

    //console.log("converted triangle pts: ", convertedT, "and interior pt: ", convertedpt)

    return d3.polygonContains(convertedT, convertedpt)
}

// func for flipping an edge
function flipEdge(edge) {
    //console.log(HULLPTS)
    console.log("attempting to flip edge ", edge)

    // CHECK IF EDGE ACTUALLY EXISTS LOL

    // check if edge is on convex hull // OK
    let onhull = true 
    
    HULLPTS.forEach((pt, i) => {
        if (pt === edge[0]) {
            if (HULLPTS[i+1] === edge[1]) {
                console.log("edge is on hull")
                onhull = false
            }
            if (i > 0 && HULLPTS[i-1] === edge[1]) {
                console.log("edge is on hull")
                onhull = false // might need to return again outside this?
            }
            // ! need one for beginning to end of list wraparound
        }}
    )

    if (!onhull) {
        console.log("on hull", onhull)
        return null
    }

    // quad is tirangles [a, e0, e1], [b, e0, e1]
    let adjPoints = [] // [a,b] 
    let adjTindices = [] // indices of triangles within splittriangles //  rename this?
    SPLITTRIANGLES.forEach((t, i) => {
        if (t.includes(edge[0]) && t.includes(edge[1])) {

            let newpt = t.filter(pt => pt !== edge[0] && pt !== edge[1]) // [a]

            adjPoints.push(newpt[0]) // a
            adjTindices.push(i)
        }
    })

    // [a, b, e0], [a, b, e1]
    let newTs = [
        [adjPoints[0], adjPoints[1], edge[0]], 
        [adjPoints[0], adjPoints[1], edge[1]]
    ]

    console.log("new triangles: ", newTs)

    // test if edge is legal 
    if (tContainsPt(newTs[0], edge[1]) || tContainsPt(newTs[1], edge[0]) ) {
        console.log("quad is reflex")
        return null
    }

    // switch old triangles for new
    SPLITTRIANGLES.splice(adjTindices[0], 1, newTs[0])
    SPLITTRIANGLES.splice(adjTindices[1], 1, newTs[1])

    //console.log("old paths: ", TPATHS)

    // switch old paths for new
    TPATHS.splice(adjTindices[0], 1, getPath(newTs[0]))
    TPATHS.splice(adjTindices[1], 1, getPath(newTs[1]))

    // can i do this? 

    //console.log("paths now changed to:", TPATHS)

    d3.select("#path" + adjTindices[0]).attr("d", TPATHS[adjTindices[0]])
    d3.select("#path" + adjTindices[1]).attr("d", TPATHS[adjTindices[1]])

    // remove edge[1] from list of edges for edge[0] and vice versa
    EDGES[edge[0]].splice(EDGES[edge[0]].indexOf(edge[1]), 1)
    EDGES[edge[1]].splice(EDGES[edge[1]].indexOf(edge[0]), 1)

    // add new pts to each other's neighbor list
    EDGES[adjPoints[0]].push(adjPoints[1])
    EDGES[adjPoints[1]].push(adjPoints[0])

    console.log("edges once flipped:", EDGES)

    console.log("isDelau:", isDelau());

    let delauText = d3.select("#delaunay-indicator")
    if (isDelau()) {
        delauText.html("<p>This is a Delaunay triangulation!<p>");
    } else {
        delauText.html("")
    }
}


function isDelau() {
    TRIANGLES = DELAU.triangles

    delEdges = []
    POINTS.forEach(p => {delEdges.push([])}) // i guess

    // console.log("delEdges initially", delEdges)

    if (POINTS.length < 3) {
        return false;
    }

    for (let j = 0; j < TRIANGLES.length; j+= 3) {
        if (!delEdges[TRIANGLES[j]].includes(TRIANGLES[j+1])) {
            delEdges[TRIANGLES[j]].push(TRIANGLES[j+1])
            delEdges[TRIANGLES[j+1]].push(TRIANGLES[j]) // shouldn't need second check for this right?
        }
        if (!delEdges[TRIANGLES[j]].includes(TRIANGLES[j+2])) {
            delEdges[TRIANGLES[j]].push(TRIANGLES[j+2])
            delEdges[TRIANGLES[j+2]].push(TRIANGLES[j]) 
        }
        if (!delEdges[TRIANGLES[j+1]].includes(TRIANGLES[j+2])) {
            delEdges[TRIANGLES[j+1]].push(TRIANGLES[j+2])
            delEdges[TRIANGLES[j+2]].push(TRIANGLES[j+1]) 
        }
    }

    console.log("del triangles:", TRIANGLES)
    console.log("del edges:", delEdges)

    for (let p = 0; p < POINTS.length; p++) {
        let curr = EDGES[p]
        //console.log("checking point", p, "'s edges, ", curr)
        
        let allFound = true;
        curr.forEach(e => {
            let delIdx = delEdges[p].indexOf(e)
            if (delIdx < 0) { // edge not present
                allFound = false; // does this return from whole isDelau?
            }
            delEdges[p].splice(delIdx, 1)
        })

        if (!allFound) {return false}

    }

    return true;

}


d3.select("#addmode").on("click", (d) => MODE = "add")
d3.select("#deletemode").on("click", (d) => MODE = "del")
d3.select("#flip").on("click", (d) => MODE = "flip")




POINTSGROUP.on("click", (d, i) => clickPoint(d,i) )// => {
//     console.log("clicked point ", d, i)

//     if (MODE === "add") {
//         return;
//     }

//     if (MODE === "del") {
//         POINTS.splice(i, 1)
//         console.log("deleting point ", d)
//         console.log("new points", POINTS)
//         showTriangulation(POINTS)
//         return;
//     }


//     selectedInput.push(i)
    
//     if (selectedInput.length > 1) {
//         console.log("received points ", selectedInput)
//         // should probs check that the edge actually exists
//         flipEdge(selectedInput)
//         // change color black
//         selectedInput = []
//         ptsGroup.selectAll(".rectan").remove()
//     } else {
//         console.log("selected input is", selectedInput)
//         ptsGroup
//             .append("rect")
//             .attr("x", d[0] - 3)
//             .attr("y", d[1] - 3)
//             .attr("width", 6)
//             .attr("height", 6)
//             .attr("fill", "red")
//             .classed("rectan", true)
//     }
// })

function clickPoint(d, i) {
    console.log("clicked point ", d, i, MODE)

    if (MODE === "add") {
        console.log("add mode");
        return;
    }

    if (MODE === "del") {
        console.log("del mode");
        deletePoint(d,i)
        return;
    }

    console.log("flip mode");

    selectedInput.push(i)
    
    if (selectedInput.length > 1) {
        //console.log("received points ", selectedInput)
        // should probs check that the edge actually exists
        flipEdge(selectedInput)
        // change color black
        selectedInput = []
        ptsGroup.selectAll(".rectan").remove()
    } else {
        //console.log("selected input is", selectedInput)
        ptsGroup
            .append("rect")
            .attr("x", d[0] - 3)
            .attr("y", d[1] - 3)
            .attr("width", 6)
            .attr("height", 6)
            .attr("fill", "red")
            .classed("rectan", true)
    }
}

function deletePoint(d, i) {
    //console.log("pointsgroup before deletion: ", POINTSGROUP)
    POINTS.splice(i, 1)
    console.log("deleting point ", d)
    //console.log("new points", POINTS)
    splitTriangulation(POINTS)
    //console.log("pointsgroup after deletion: ", POINTSGROUP)

    POINTSGROUP.on("click", (d, i) => clickPoint(d,i) )
    return;
}

d3.select("#addmode").on("click", (d) => {
    MODE = "add"
    console.log("mode changed to add ", MODE)
}) 
d3.select("#deletemode").on("click", (d) => {
    MODE = "del"
    console.log("mode changed to del ", MODE)
})
d3.select("#flipmode").on("click", (d) => {
    MODE = "flip"
    console.log("mode changed to flip ", MODE)
})


// todo: some special stuff about adding triangles to the outside of the hull without retriangulating anything


chartGroup.on("click", function() {

    let loc = d3.mouse(this)
    console.log("location", loc)

    let roundLoc = [Math.round(loc[0]), Math.round(loc[1])]

    if (MODE !== "add") {
        
        console.log(POINTSGROUP)
        return null
    }

    console.log("adding ", roundLoc, " to points ", POINTS)
    POINTS.push(roundLoc)
    console.log("adding point to triangulation")
    splitTriangulation(POINTS)

    //POINTSGROUP = ptsGroup.selectAll("circle")
    //POINTSGROUP.attr
    POINTSGROUP.on("click", (d, i) => clickPoint(d,i) )

})




//const inputedge = [0,2]

//flipEdge(inputedge)




