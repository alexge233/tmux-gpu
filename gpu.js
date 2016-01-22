#!/usr/bin/node
//
// query `nvidia-settings -t -q for the specific/correct gpu
// and get: usage, memory bandwidth, pci usage
// usage of gpuid (including quotes) "[gpu:0]"
//
// GPU ids: `nvidia-settings -t -q gpus`
// GPU usg: `nvidia-settings -t -q "gpuid"/GPUUtilization`
// GPU temp: `nvidia-settings -t -q "gpuid"/GPUCoreTemp`
// GPU mem: `nvidia-settings -t -q "gpuid"/TotalDedicatedGPUMemory`
// GPU mem: `nvidia-settings -t -q "gpuid"/UsedDedicatedGPUMemory`
//
// Example:
// usage: graphics=44 memory=41 video=9 PCIe=1
// core temp: 37 (degrees)
// total memory: 2048 (Mb)
// used memory:  399 (Mb)
//

///
/// Node.js script which gets the nvidia GPU usage, free memory and temp
/// and displays it as in your tmux status bar.
///
const sp = require('child_process');

// get the nvidia gpu ids installed
var gpus = sp.spawnSync("/usr/bin/nvidia-settings", ["-t", "-q", "gpus"]);
var output = gpus.stdout.toString();
output = output.replace(/^\s+|\s+$/g, '');
var lines = output.split("\n");
// find lines which contain the pattern [digit]
var search = [];
lines.forEach(function(str){
    if (/\[[0-9]+\]/.test(str))
        search.push(str);
});
// search for the actual gpu ids, e.g.: `[gpu:0]`
var gpu_ids = [];
search.forEach(function(str){
    var id = str.substring(str.lastIndexOf("["),str.lastIndexOf("]")+1);
    gpu_ids.push(id);
});

// [0] = gpu_use, [1] = ram bandwidth, [2] PCIe bandwidth, [3] Core temp, [4] ram use
var averages = [0, 0, 0, 0, 0];
var devices = 0;

// for each gpu installed we'll query usage, temp and memory usage
gpu_ids.forEach(function(id){
    // query gpu usage
    var query = sp.spawnSync("/usr/bin/nvidia-settings", ["-t", "-q", id+"/GPUUtilization"]);
    var out = query.stdout.toString();
    out = out.replace(/^\s+|\s+$/g, '');
    var gpu_use = (out.match(/graphics=\d?\d/g)[0]).replace('graphics=', '');
    var ram_use = (out.match(/memory=\d?\d/g)[0]).replace('memory=', '');
    var pci_use = (out.match(/PCIe=\d?\d/g)[0]).replace('PCIe=', '');
    averages[0] += parseInt(gpu_use);
    averages[1] += parseInt(ram_use);
    averages[2] += parseInt(pci_use);

    // query gpu temp
    var query = sp.spawnSync("/usr/bin/nvidia-settings", ["-t", "-q", id+"/GPUCoreTemp"]);
    out = query.stdout.toString();
    out = out.replace(/^\s+|\s+$/g, '');
    averages[3] += parseInt(out);

    // query gpu used memory
    var query = sp.spawnSync("/usr/bin/nvidia-settings", ["-t", "-q", id+"/UsedDedicatedGPUMemory"]);
    out = query.stdout.toString();
    var used_mem = out.replace(/^\s+|\s+$/g, '');

    // query gpu total memory
    var query = sp.spawnSync("/usr/bin/nvidia-settings", ["-t", "-q", id+"/TotalDedicatedGPUMemory"]);
    out = query.stdout.toString();
    var total_mem = out.replace(/^\s+|\s+$/g, '');
    // min-max norm ram usage
    var norm = (used_mem - 0) / (total_mem - 0);
    averages[4] += parseFloat(norm);
    devices++;
});

// Average all values
averages.forEach(function(val){
    val /= devices;
});

console.log(averages);

// TODO: at this point produce the graphs, one for GPU usage,
//       one for Memory Bandwidth
//       one for PCIe Bandwidth
//       one for Core temp
//       one for RAM usage
