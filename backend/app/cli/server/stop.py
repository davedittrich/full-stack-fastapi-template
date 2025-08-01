"""
Stop server command.
"""

from cliff.command import Command


class CmdServerStop(Command):
    """Stop the FastAPI server."""

    def take_action(self, parsed_args):
        self.app.stdout.write("[-] Server stop not implemented yet\n")
        self.app.stdout.write("[*] Use Ctrl+C to stop the server\n")