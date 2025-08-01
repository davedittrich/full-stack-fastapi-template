"""
Update challenge command.
"""

from cliff.command import Command


class CmdChallengeUpdate(Command):
    """Update a challenge."""

    def get_parser(self, prog_name):
        parser = super().get_parser(prog_name)
        parser.add_argument(
            'challenge_id',
            help='Challenge ID to update'
        )
        return parser

    def take_action(self, parsed_args):
        self.app.stdout.write(f"[*] Would update challenge: {parsed_args.challenge_id}\n")
        self.app.stdout.write("[-] Not implemented yet\n")