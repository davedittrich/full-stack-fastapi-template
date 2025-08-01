"""
List users command.
"""

from cliff.lister import Lister


class CmdUserList(Lister):
    """List users."""

    def get_parser(self, prog_name):
        parser = super().get_parser(prog_name)
        parser.add_argument(
            '--limit',
            type=int,
            default=100,
            help='Maximum number of users to list'
        )
        return parser

    def take_action(self, parsed_args):
        # Placeholder implementation
        columns = ('Email', 'Full Name', 'Active', 'Superuser')
        rows = [
            ('admin@example.com', 'Administrator', 'Yes', 'Yes'),
            ('user@example.com', 'Regular User', 'Yes', 'No'),
        ]
        return (columns, rows)