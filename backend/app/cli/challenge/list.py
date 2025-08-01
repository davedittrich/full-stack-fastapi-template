"""
List challenges command.
"""

import requests
from cliff.lister import Lister


class CmdChallengeList(Lister):
    """List challenges."""

    def get_parser(self, prog_name):
        parser = super().get_parser(prog_name)
        parser.add_argument(
            '--api-url',
            default='http://localhost:8000/api/v1',
            help='API base URL'
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=100,
            help='Maximum number of challenges to list'
        )
        return parser

    def take_action(self, parsed_args):
        response = requests.get(
            f"{parsed_args.api_url}/challenges/",
            params={'limit': parsed_args.limit},
            timeout=30
        )

        if response.status_code != 200:
            self.app.stderr.write(f"[-] Failed to list challenges: {response.status_code}\n")
            return ((), [])

        data = response.json()
        challenges = data.get('data', [])

        columns = ('ID', 'Title', 'Author', 'Date Posted', 'Active')
        rows = []

        for challenge in challenges:
            rows.append((
                str(challenge['id'])[:8] + '...',
                challenge['title'],
                challenge['author'],
                challenge['date_posted'],
                'Yes' if challenge['is_active'] else 'No'
            ))

        return (columns, rows)