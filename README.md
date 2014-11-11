# ToDue [![Build Status](https://secure.travis-ci.org/sukima/todue-txt.png?branch=master)](https://travis-ci.org/sukima/todue-txt)

Scan your [todo.txt](http://todotxt.com/) finding any due tasks and sends those
tasks to [Prowl][].

This is meant to be used from a cron job but could easily be used in other
ways. It was written in [node](http://nodejs.org/) as an exercise in using text
streams. It is very likely this could have been easily done in a shell script.

## Project Setup

Node.js Version 0.10+

This tool requires a valid [Prowl API key](http://www.prowlapp.com/api.php).

    $ npm install -g todue-txt
    $ todue --help

The `todue` command takes a file name as an argument or can read from STDIN
(aka "-" as the file name).

#### Arguments

| Argument         | Description                                |
|------------------|--------------------------------------------|
|`--api`, `-a`     | Set the [Prowl][] service API key          |
|`--dry-run`, `-n` | Don't actually submit to [Prowl][] service |
|`--version`, `-v` | Show version number                        |
|`--help`, `-h`    | Show help                                  |

#### Environment Variables

The following environment variables can be set in lieu of the above command
line arguments:

| Variable        | Description                   |
|-----------------|-------------------------------|
| `PROWL_API_KEY` | The [Prowl][] service API key |
| `TODO_FILE`     | The todo.txt file to parse    |

#### Examples

    $ todue -a 12345 -                # Read STDIN for todo list.
    $ todue -a 12345 ~/todo/todo.txt  # Use ~/todo/todo.txt for list of todos.

## Testing

Tests are written for [Mocha](http://mochajs.org/):

    $ mocha

## Contributing changes

- Fork
- Code
- Check that tests pass (you did code specs right?)
- Send a [Pull Requests](https://guides.github.com/activities/contributing-to-open-source/#contributing)
- Have a :beer:

## License

[MIT](http://choosealicense.com/licenses/mit/)

[Prowl]: http://www.prowlapp.com/
