<h1 align="center">REYNEP-DOCS</h1>
<div align="center">

> [if you dont wanna build] Install ***CMake by twxs*** in vscode... Swap-out the `package.json` & `syntaxes` folder from here </br>
> Or you can download the RELEASED ***ReynepModv0.1Beta*** & copy-paste that to your *vscode extensions folder.* </br>
> if the Release is behind the latest commits, Swap-out the `package.json` & `syntaxes` folder after cloning

</div>
</br>
<div align="right">

###### _TWXS stuffs below_

</div>

# CMake For VisualStudio Code
[![Join the chat at https://gitter.im/twxs/vs.language.cmake](https://badges.gitter.im/twxs/vs.language.cmake.svg)](https://gitter.im/twxs/vs.language.cmake?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

This extension provides support for [CMake](http://www.cmake.org/) in [Visual Studio Code](https://code.visualstudio.com/).

![screencast](images/cmake1.gif)

## Features

- Colorization
- Completion Lists 

![completion](images/cmake2.gif)

- Code comments

![comment](images/cmake3.gif)

- Snippets

![find_package](images/cmake5.gif)

![include](images/cmake6.gif)

- Quick Help

![tooltip](images/cmake4.gif)

- Access To Online Help


## Options

The following Visual Studio Code settings are available for the Cmake extension. These can be set in user preferences (cmd+,) or workspace settings (.vscode/settings.json).

```json
{
    "cmake.cmakePath": "/path/to/cmake"
}
```

## Commands

- `CMake: Online Help` to go to the CMake online documentation (according to the current cmake version). 

## Acknowledgements

This extension based on the TextMate Syntax from [this project](https://github.com/zyxar/Sublime-CMakeLists).


## Contributors

- [Stanislav Ionascu](https://github.com/stanionascu)
- [Rostislav Kondratenko](https://github.com/rkondratenko)

Feel free to contribute...

## License

[MIT](LICENSE)
