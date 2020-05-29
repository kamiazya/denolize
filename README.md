[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

# denolize

Transpile the package created for Node into the Deno module.

> Requires the `--unstable`, `--allow-read` and `--allow-write` flags.

## Installation

```bash
$ deno install  --unstable --allow-read --allow-write \
    -n denolize \
    https://raw.githubusercontent.com/kamiazya/denolize/master/cli/mod.ts
Download https://raw.githubusercontent.com/kamiazya/denolize/master/cli/mod.ts
Download https://deno.land/x/cliffy/command.ts
...
Compile https://raw.githubusercontent.com/kamiazya/denolize/master/cli/mod.ts
✅ Successfully installed denolize
~/.deno/bin/denolize
```

## Usage

```bash
$ denolize -h

  Usage:   denolize [rootDir:string] [outDir:string]
  Version: v0.0.2

  Description:

    Transpile the package created for Node into the Deno module.

  Options:

    -h, --help     [arg:boolean]  - Show this help.
    -V, --version  [arg:boolean]  - Show the version number for this program.

  Commands:

    help         [command:command]  - Show this help or the help of a sub-command.
    completions                     - Generate shell completions for zsh and bash.

# denolize the files under the src directory.
$ denolize src

# denolize the files under the src directory and output to the deno directory.
$ denolize src deno
```

## License

This software is released under the MIT License, see [LICENSE](./LICENSE).
