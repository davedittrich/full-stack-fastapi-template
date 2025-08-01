"""
List questions command.
"""

import requests
from cliff.lister import Lister


class CmdQuestionList(Lister):
    """List questions."""

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
            help='Maximum number of questions to list'
        )
        parser.add_argument(
            '--challenge-id',
            help='Filter by challenge ID'
        )
        return parser

    def take_action(self, parsed_args):
        params = {'limit': parsed_args.limit}
        if parsed_args.challenge_id:
            params['challenge_id'] = parsed_args.challenge_id

        response = requests.get(
            f"{parsed_args.api_url}/questions/",
            params=params,
            timeout=30
        )

        if response.status_code != 200:
            self.app.stderr.write(f"[-] Failed to list questions: {response.status_code}\n")
            return ((), [])

        data = response.json()
        questions = data.get('data', [])

        columns = ('ID', 'Question Text', 'Type', 'Points', 'Challenge', 'Assigned To')
        rows = []

        for question in questions:
            challenge_title = 'None'
            if question.get('challenge'):
                challenge_title = question['challenge']['title'][:30] + '...' if len(question['challenge']['title']) > 30 else question['challenge']['title']
            
            question_text = question['question_text'][:40] + '...' if len(question['question_text']) > 40 else question['question_text']
            
            rows.append((
                str(question['id'])[:8] + '...',
                question_text,
                question['question_type'],
                str(question['points']),
                challenge_title,
                question.get('assigned_to', 'Unassigned')
            ))

        return (columns, rows)