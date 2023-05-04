
// todo: get input from user
// const tri4 = [[0, 0], [0, 100],  [200,100], [50, 60]];
// const delau4 = d3.Delaunay.from(tri4);

const expoints = [[10,10], [100,10], [100, 100], [10, 100], [150,80], [50,200], [50,70], [30, 110]]
// const delau = d3.Delaunay.from(points)

let POINTS = [];
let DELAU;
let HULLPTS;
let TRIANGLES;
let SPLITTRIANGLES = [];
let TPATHS = [];
let POINTSGROUP;
let MODE = "flip"


// Define SVG area dimensions
const svgWidth = 500;
const svgHeight = 500;

// Define the chart's margins as an object
const margin = {
  top: 30,
  right: 30,
  bottom: 30,
  left: 30,
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

let background = chartGroup
            .append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("style", "fill:aqua")

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

// DELAUNAY
function showTriangulation(pts) {
    console.log("calculating triangulation...");
    chartGroup.selectAll("path").remove();
    ptsGroup.selectAll("circle").remove();
    //POINTSGROUP.selectAll("circle").remove()

    // ! check if <3 pts

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

function triangleSplit(pts) {
    
}


showTriangulation(expoints);


function tContainsPt(triangle, pt) {
    let convertedT = [POINTS[triangle[0]], POINTS[triangle[1]], POINTS[triangle[2]]]
    let convertedpt = POINTS[pt]

    //console.log("converted triangle pts: ", convertedT, "and interior pt: ", convertedpt)

    return d3.polygonContains(convertedT, convertedpt)
}

// func for flipping an edge
function flipEdge(edge) {
    console.log("old paths: ", HULLPTS)
    console.log("attempting to flip edge ", edge)

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

    let adjTriangles = []
    let adjTindices = [] // rename this tbh
    SPLITTRIANGLES.forEach((t, i) => {
        if (t.includes(edge[0]) && t.includes(edge[1])) {

            // let delT = splitTriangles.splice(i, 1)
            // console.log("deleting triangle", delT)

            let newpt = t.filter(pt => pt !== edge[0] && pt !== edge[1])

            adjTriangles.push(newpt)
            adjTindices.push(i)
        }
    })
    console.log("adj points: ", adjTriangles)
    console.log("adj indices: ", adjTindices)

    let newTs = [
        [adjTriangles[0][0], adjTriangles[1][0], edge[0]], 
        [adjTriangles[0][0], adjTriangles[1][0], edge[1]]
    ]

    console.log("new triangles: ", newTs)

    // test if edge is legal 
    //console.log("testing if triangle ", newTs[0], " contains point ", edge[1], "returns ", tContainsPt(newTs[0], edge[1]))

    if (tContainsPt(newTs[0], edge[1]) || tContainsPt(newTs[1], edge[0]) ) {
        console.log("quad is reflex")
        return null
    }

    // switch old triangles for new
    SPLITTRIANGLES.splice(adjTindices[0], 1, newTs[0])
    SPLITTRIANGLES.splice(adjTindices[1], 1, newTs[1])

    console.log("old paths: ", TPATHS)

    console.log("new p0: ", getPath(newTs[0]))

    // switch old paths for new
    TPATHS.splice(adjTindices[0], 1, getPath(newTs[0]))
    TPATHS.splice(adjTindices[1], 1, getPath(newTs[1]))

    // can i do this? 

    console.log("paths now changed to:", TPATHS)

    d3.select("#path" + adjTindices[0]).attr("d", TPATHS[adjTindices[0]])
    d3.select("#path" + adjTindices[1]).attr("d", TPATHS[adjTindices[1]])

}


d3.select("#addmode").on("click", (d) => MODE = "add")
d3.select("#deletemode").on("click", (d) => MODE = "del")
d3.select("#flip").on("click", (d) => MODE = "flip")


let selectedInput = []

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
        delPoint(d,i)
        return;
    }

    console.log("flip mode");

    selectedInput.push(i)
    
    if (selectedInput.length > 1) {
        console.log("received points ", selectedInput)
        // should probs check that the edge actually exists
        flipEdge(selectedInput)
        // change color black
        selectedInput = []
        ptsGroup.selectAll(".rectan").remove()
    } else {
        console.log("selected input is", selectedInput)
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

function delPoint(d, i) {
    console.log("pointsgroup before deletion: ", POINTSGROUP)
    POINTS.splice(i, 1)
    console.log("deleting point ", d)
    console.log("new points", POINTS)
    showTriangulation(POINTS)
    console.log("pointsgroup after deletion: ", POINTSGROUP)

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
    showTriangulation(POINTS)

    //POINTSGROUP = ptsGroup.selectAll("circle")
    //POINTSGROUP.attr
    POINTSGROUP.on("click", (d, i) => clickPoint(d,i) )

})




//const inputedge = [0,2]

//flipEdge(inputedge)




