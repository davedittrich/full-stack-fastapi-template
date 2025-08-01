"""
Initialize database command.
"""

from cliff.command import Command


class CmdDbInit(Command):
    """Initialize the database."""

    def take_action(self, parsed_args):
        self.app.stdout.write("[*] Would initialize database\n")
        self.app.stdout.write("[-] Not implemented yet\n")
        self.app.stdout.write("[*] Use 'alembic upgrade head' manually for now\n")