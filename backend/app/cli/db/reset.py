"""
Reset database command.
"""

from cliff.command import Command


class CmdDbReset(Command):
    """Reset the database."""

    def get_parser(self, prog_name):
        parser = super().get_parser(prog_name)
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force reset without confirmation'
        )
        return parser

    def take_action(self, parsed_args):
        if not parsed_args.force:
            response = input("This will delete all data. Are you sure? (y/N): ")
            if response.lower() != 'y':
                self.app.stdout.write("[*] Database reset cancelled\n")
                return

        self.app.stdout.write("[*] Would reset database\n")
        self.app.stdout.write("[-] Not implemented yet\n")