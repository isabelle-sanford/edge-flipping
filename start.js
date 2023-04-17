
// todo: get input from user
// const tri4 = [[0, 0], [0, 100],  [200,100], [50, 60]];
// const delau4 = d3.Delaunay.from(tri4);

const points = [[0,0], [100,0], [100, 100], [0, 100], [150,80], [50,200], [50,70]]
const delau = d3.Delaunay.from(points)


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
  .attr("width", svgWidth);


let chartGroup = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);


const hullpts = delau.hull
const triangles = delau.triangles


console.log("given triangles: ", triangles)

let splitTriangles = []

for (let j = 0; j < triangles.length; j += 3) {
    let coord = triangles.slice(j, j+3)
    //console.log("adding triangle", coord)
    splitTriangles.push(coord)
    //console.log("curr ST after push: ", splitTriangles)
}

console.log("ending triangles:", splitTriangles)



// each triangle gets a corresponding path drawn for it 
let tPaths = []
splitTriangles.forEach((t, i) => {
    let p = getPath(t)
    tPaths.push(p)

    chartGroup.append("path")
     .attr("d", p)
     .attr("id", "path" + i) // ????

})

console.log("path list: ", tPaths)


// draw points
let pointsGroup = chartGroup.selectAll("circle")
    .data(points)
    .enter()
    .append("circle")
    .attr("cx", p => p[0])
    .attr("cy", p => p[1])
    .attr("r", 7)
    .attr("ptloc", (p, i) => i)


// note: only does 3 pts to make a triangle
function getPath(pts) {
    let path = d3.path()
    path.moveTo(points[pts[0]][0], points[pts[0]][1]) // 
    path.lineTo(points[pts[1]][0], points[pts[1]][1])
    path.lineTo(points[pts[2]][0], points[pts[2]][1])
    path.closePath()

    return path.toString()
}

// func for flipping an edge

console.log("hull points: ", hullpts)

function flipEdge(edge) {
    console.log("attempting to flip edge ", edge)

    // check if edge is on convex hull // OK
    let onhull = true 
    
    hullpts.forEach((pt, i) => {
        if (pt === edge[0]) {
            if (hullpts[i+1] === edge[1]) {
                console.log("edge is on hull")
                onhull = false
            }
            if (i > 0 && hullpts[i-1] === edge[1]) {
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
    splitTriangles.forEach((t, i) => {
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

    // switch old triangles for new
    splitTriangles.splice(adjTindices[0], 1, newTs[0])
    splitTriangles.splice(adjTindices[1], 1, newTs[1])

    console.log("old paths: ", tPaths)

    console.log("new p0: ", getPath(newTs[0]))

    // switch old paths for new
    tPaths.splice(adjTindices[0], 1, getPath(newTs[0]))
    tPaths.splice(adjTindices[1], 1, getPath(newTs[1]))

    // can i do this? 

    console.log("paths now changed to:", tPaths)

    d3.select("#path" + adjTindices[0]).attr("d", tPaths[adjTindices[0]])
    d3.select("#path" + adjTindices[1]).attr("d", tPaths[adjTindices[1]])


}


let selectedInput = []

pointsGroup.on("click", (d, i) => {
    console.log("clicked point ", d, i)
    selectedInput.push(i)
    
    if (selectedInput.length > 1) {
        console.log("received points ", selectedInput)
        // should probs check that the edge actually exists
        flipEdge(selectedInput)
        // change color black
        selectedInput = []
        chartGroup.selectAll(".rectan").remove()
    } else {
        chartGroup
            .append("rect")
            .attr("x", d[0] - 3)
            .attr("y", d[1] - 3)
            .attr("width", 6)
            .attr("height", 6)
            .attr("fill", "red")
            .classed("rectan", true)
    }
})




//const inputedge = [0,2]

//flipEdge(inputedge)




