# tmux-gpu

A tmux nVIDIA gpu monitor.
Inspired from [rainbarf](https://github.com/creaktive/rainbarf).

![tmux-gpu](https://github.com/alexge233/tmux-gpu/blob/master/tmux-gpu.png?raw=true)

The script will obtain and display:
- `GPU usage` which is averaged for multiple GPUs (left, green bars).
- `PCIe bandwidth usage` also averaged (second from left, cyan bars).
- `Core temperature` also averaged (third from left, red bar).
- `RAM usage` also averaged (fourth from left, organge bars).

## Dependencies

- `nvidia-settings` check how your distro packages it, or use nVidia's binaries.
- `Node.js` installed and configured
- [tmux-colors](https://github.com/alexge233/tmux-temp) which you can install with `npm install tmux-colors`

## Install

Download the script in your `.tmux/` directory:

```
mkdir .tmux/
wget https://raw.githubusercontent.com/alexge233/tmux-gpu/master/gpu.js ~/.tmux/gpu.js
```

I use [vim-airline](https://github.com/vim-airline/vim-airline) and
[tmuxline](https://github.com/edkolev/tmuxline.vim), so setting it is done
by doing:

- `vim .vimrc` and then edit it so that you load the monitor:

```
let g:tmuxline_preset = {
      \'a'    : '#S', 
      \'b'    : '#(node .tmux/gpu.js)',
      \'c'    : '',
      \'win'  : '#W #I',
      \'cwin' : '#W #I',
      \'x'    : '⇑ %R',
      \'y'    : '',
      \'z'    : '#H'}
```

- run `Tmuxline` from within vim (this should update your tmux)
- export the current *look* to a theme, by running `TmuxlineSnapshot ~/.tmux/theme`
- finally, edit your `.tmux.conf` so that it loads your new theme:

```
source "~/.tmux/theme"
```

The script uses *unicode* boxes to plot the graph, thus make sure your terminal supports them.
Feel free to hack into it.
I have not tested it under OSX, only linux.
