"""
Show challenge command.
"""

from cliff.show import ShowOne


class CmdChallengeShow(ShowOne):
    """Show challenge details."""

    def get_parser(self, prog_name):
        parser = super().get_parser(prog_name)
        parser.add_argument(
            'challenge_id',
            help='Challenge ID to show'
        )
        return parser

    def take_action(self, parsed_args):
        # Placeholder implementation
        columns = ('Field', 'Value')
        data = [
            ('ID', parsed_args.challenge_id),
            ('Status', 'Not implemented'),
        ]
        return (columns, data)