

const triangles = [0,2,1,0,3,2] //delau.triangles


console.log("given triangles: ", triangles)


let splitTriangles = []

for (let j = 0; j < triangles.length; j += 3) {
    //console.log(triangles[i], triangles[i+1], triangles[i+2])

    console.log("curr ST: ", splitTriangles)

    let coord = triangles.slice(j, j+3)
    console.log("adding triangle", coord)

    splitTriangles.push(coord)
    console.log("curr ST after push: ", splitTriangles)
    
}

console.log("ending triangles:", splitTriangles)