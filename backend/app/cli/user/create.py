"""
Create user command.
"""

from cliff.command import Command


class CmdUserCreate(Command):
    """Create a new user."""

    def get_parser(self, prog_name):
        parser = super().get_parser(prog_name)
        parser.add_argument(
            'email',
            help='User email'
        )
        parser.add_argument(
            '--full-name',
            help='Full name'
        )
        parser.add_argument(
            '--password',
            help='Password (will prompt if not provided)'
        )
        parser.add_argument(
            '--superuser',
            action='store_true',
            help='Create as superuser'
        )
        return parser

    def take_action(self, parsed_args):
        self.app.stdout.write(f"[*] Would create user: {parsed_args.email}\n")
        self.app.stdout.write("[-] Not implemented yet\n")