[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

# denolize

Transpile the package created for Node into the Deno module.

> Requires the `--unstable`, `--allow-read` and `--allow-write` flags.

## Usage

```bash
$ deno run --unstable --allow-read --allow-write /path/to/denolize/cmd.ts -h

  Usage:   denolize [rootDir:string]
  Version: v0.0.1

  Description:

    Transpile the package created for Node into the Deno module.

  Options:

    -h, --help     [arg:boolean]  - Show this help.
    -V, --version  [arg:boolean]  - Show the version number for this program.
    -o, --outDir   [dir:string]   - Redirect output structure to the directory.

  Commands:

    help         [command:command]  - Show this help or the help of a sub-command.
    completions                     - Generate shell completions for zsh and bash.
```

## License

This software is released under the MIT License, see [LICENSE](./LICENSE).
