#!/usr/bin/node
///
/// Node.js script which gets the nvidia GPU usage, free memory and temp
/// and displays it as in your tmux status bar.
///
const sp = require('child_process');
const colors = require('tmux-colors');
const fs = require('fs');

// width of GPU usage
const gpu_width = 20;
const pci_width = 3;
const temp_width = 1;
const ram_width = 3;

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

// [0] = gpu_use, [1] PCIe bandwidth, [2] Core temp, [3] ram use
var averages = [0, 0, 0, 0];
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
    //averages[1] += parseInt(ram_use);
    averages[1] += parseInt(pci_use);
    // query gpu temp
    var query = sp.spawnSync("/usr/bin/nvidia-settings", ["-t", "-q", id+"/GPUCoreTemp"]);
    out = query.stdout.toString();
    out = out.replace(/^\s+|\s+$/g, '');
    averages[2] += parseInt(out);
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
    averages[3] += parseInt(parseFloat(norm)*100);
    devices++;
});

// Average all values
averages.forEach(function(val){
    val /= devices;
});

// 8ths 
var bars = [ '\u2581','\u2582','\u2583','\u2584',
             '\u2585','\u2586','\u2587','\u2588'];

// all previous history
var history = {};
var contents;

// load previous averages from file
fs.access('.gpu.tmp', fs.F_OK, function(err) {
    if (!err) 
    {
        if (contents = fs.readFileSync('.gpu.tmp', 'utf8'))
        {
            history = JSON.parse(contents);
            print_graphs();
        }
    } 
    else {
        history[0] = [];
        history[1] = [];
        history[2] = [];
        history[3] = [];
        for (var i=0; i<gpu_width; i++)
            history[0][i] = 0;
        for (var i=0; i<pci_width; i++)
            history[1][i] = 0;
        for (var i=0; i<temp_width; i++)
            history[2][i] = 0;
        for (var i=0; i<ram_width; i++)
            history[3][i] = 0;

        print_graphs();
    }
});

function print_graphs()
{
    var text = ['','','',''];
    for (var i=0; i<averages.length; i++){
        history[i].shift();
        history[i].push(averages[i]);
        for (var k=0; k<history[i].length; k++){
            if (i !== 2){
                var x = parseInt((((history[i][k] - 0) * (8 - 1)) / (100 - 0)) + 1);
                text[i] +=  bars[x];
            }
            else {
                var x = parseInt((((history[i][k] - 30) * (8 - 1)) / (100 - 30)) + 1);
                text[i] +=  bars[x];
            }
        }
    }

    var output = colors('#[fg=green,bold]'+text[0]+'#[fg=cyan,bold]'+text[1]
                       +'#[fg=red,bold]'+text[2]+'#[fg=yellow,bold]'+text[3]
                       +'#[default]');
    process.stdout.write(output);

    // write computed averages to file
    fs.writeFile('.gpu.tmp', JSON.stringify(history), function (err){
        if (err){ console.error('cannot write tmp file');}
    });
}

//console.log(averages);
