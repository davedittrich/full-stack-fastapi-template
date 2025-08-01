"""
Tanzanite CLI main entry point.
"""

import sys
from pathlib import Path

from cliff.app import App
from cliff.commandmanager import CommandManager


class TanzaniteApp(App):
    """The Tanzanite CLI application."""

    def __init__(self):
        super().__init__(
            description="Tanzanite CLI for managing challenges, questions, and users",
            version="0.1.0",
            command_manager=CommandManager(
                namespace='tanzanite'
            ),
            deferred_help=True,
        )

    def initialize_app(self, argv):
        """Initialize the application."""
        self.LOG.debug('[*] initialize_app')

    def prepare_to_run_command(self, cmd):
        """Prepare to run a command."""
        self.LOG.debug('[+] command line: %s', " ".join([arg for arg in sys.argv]))

    def clean_up(self, cmd, result, err):
        """Clean up after running a command."""
        self.LOG.debug('[*] clean_up %s', cmd.__class__.__name__)


def main(argv=sys.argv[1:]):
    """
    Command line interface for the Tanzanite CLI.
    """
    try:
        app = TanzaniteApp()
        result = app.run(argv)
    except KeyboardInterrupt:
        sys.stderr.write("\nReceived keyboard interrupt: exiting\n")
        result = 1
    return result


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))