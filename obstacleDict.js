import * as COLOR from '/colors.js' 
let obstacleDict = [
  [0, -1, 0, 10, 1, 10, 986880],
  [1, 0.65, 4, 0.3, 1.3, 0.3, 255],
  [-2, 0.5, -3, 1, 1, 1, 16711680],
  [3, 0.5, -2, 1, 1, 1, 65280],
  [4.595486970931373, 0.9379999999999997, -4.677860688614583, 2, 1, 1.7, 16711680],
  [6.198566454425788, 2.633599999999999, -6.084452436610026, 1, 1.5, 1, 255],
  [8.37786955404272, 3.449799999999997, -8.263755536226956, 1, 0.4, 1, 32896],
  [10.604548807999185, 3.787999999999996, -10.490434790183421, 0.5, 0.5, 1, 16711680],
  [13.968255766103633, -9.686799999999998, -13.85414174828787, 0.5, 0.5, 0.5, 16753920],
  [15.594243612708805, 1.7033999999999931, -12.916625732678593, 2, 0.3, 2, 65280],
  [18.52563015059579, -0.7916000000000094, -13.580755769847121, 1, 1, 1, 16711680],
  [20.788673551933716, -0.635600000000011, -15.672969564768843, 1, 1, 1, 65280],
  [23.346896527359196, -1.0850000000000133, -18.038080811202015, 1, 1, 1, 16776960],
  [24.375353652773164, -0.4118000000000146, -15.247810942321072, 1, 1, 1, 16776960],
  [24.687225302111102, 1.4553999999999854, -13.528725117139802, 1, 1, 1, 16738740],
  [24.755941190449473, 1.6113999999999833, -10.404475067185627, 1, 1, 1, COLOR.pink],
  [24.798949155142395, 0.354165286122605, -8.29234403245902, 1, 1, 1, COLOR.green],
  [25.231753787474133, 1.0273652861226035, -5.4093640634279225, 1, 1, 1, COLOR.lime],
  [25.44892754272679, 1.1833652861226018, -2.186690293018705, 1, 1, 1, COLOR.orange],
  [25.677540250678014, 2.406707232525009, 1.2218667159335017, 0.2, 1, 6, COLOR.magenta],
  [21.67, 4.5, 4.1, 6, 1, 0.2, COLOR.cyan],
  [18.22,7.5,7.6,6,1,0.2,COLOR.yellow],
  [19.5, 6.5, 4.07, 1, 1, 1, COLOR.red],
  [19.5, 8.8, 4.07, 1, 0.2, 1, COLOR.red],
  [15,8,10,2,0.2,2,COLOR.white] ,  [20, 11, 14, 2, 0.4, 2, COLOR.green],
  [23, 12.5, 16, 2, 0.4, 2, COLOR.orange],
  [26, 14, 18, 2, 0.4, 2, COLOR.pink],
  [29, 15, 20, 0.4, 0.4, 6, COLOR.yellow],
  [32, 16, 23, 6, 0.4, 0.4, COLOR.cyan],
  [36, 17.5, 25, 1, 0.3, 1, COLOR.red],
  [38, 18.5, 27, 1, 0.3, 1, COLOR.red],
  [40, 19.5, 29, 1, 0.3, 1, COLOR.red],
  [42, 21, 31, 0.5, 4, 0.5, COLOR.white],
  [45, 21, 33, 0.5, 4, 0.5, COLOR.white],
  [48, 21, 35, 0.5, 4, 0.5, COLOR.white],
  [52, 22, 38, 6, 0.6, 6, COLOR.lime],
  [20,12.5,16,1,0.3,1,COLOR.blue]
];  //obstacles are a 7d tuple: x,y,z, xsize ysize zsize, color. you can interact with them

let sphereObstacleDict = [
    [14.5, 9, 12, 0.5, COLOR.orange],
    [41,16,33,0.5,COLOR.yellow],
    [25,15,20,0.4,COLOR.purple],
    [17,10,12,0.6,COLOR.lime],
    [18.5,9.5,13,0.7, COLOR.blue],
    [23,16,16,2,COLOR.yellow]
]  //sphere obstacles are a 5d tuple, x, y, z, r, color
//be careful with radius is bigger than it appears

let spawnDict = [
    [0, 5,0,5,5,5],
    [15,8,10,2,2,2]
] //spawns are a 6d tuple: x,y,z, xsize ysize zsize. they are invisible but if u touch them you respawn there

function checkSpawnCollision(sphereCenter, spawn) {
    if (Math.abs(sphereCenter.x - spawn[0]) <= (spawn[3] / 2) &&
        Math.abs(sphereCenter.y - spawn[1]) <= (spawn[4] / 2) &&
        Math.abs(sphereCenter.z - spawn[2]) <= (spawn[5] / 2)) {
        return true;
    }
    return false;
}

function checkAllSpawnCollisions(sphereCenter) {
    for (let i = 0; i < spawnDict.length; i++) {
        if (checkSpawnCollision(sphereCenter, spawnDict[i])) {
            return i; // return the index of the spawn point collided with
        }
    }
    return 0; // no collision
}

export {spawnDict, obstacleDict, checkSpawnCollision, checkAllSpawnCollisions, sphereObstacleDict};

//Use WASD or Arrow keys to move

//Space to jump

//Drag mouse to rotate camera

//Scroll to zoom.

//Sphere Position: 14.45, 8.60, 10.7
