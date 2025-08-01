"""
Show question command.
"""

import sys

import requests
from cliff.show import ShowOne


class CmdQuestionShow(ShowOne):
    """Show question details."""

    def get_parser(self, prog_name):
        parser = super().get_parser(prog_name)
        parser.add_argument(
            'question_id',
            help='Question ID to show'
        )
        parser.add_argument(
            '--api-url',
            default='http://localhost:8000/api/v1',
            help='API base URL'
        )
        return parser

    def take_action(self, parsed_args):
        response = requests.get(
            f"{parsed_args.api_url}/questions/{parsed_args.question_id}",
            timeout=30
        )

        if response.status_code != 200:
            error_detail = "Question not found"
            try:
                error_data = response.json()
                error_detail = error_data.get('detail', str(response.status_code))
            except:
                error_detail = f"HTTP {response.status_code}"
            
            self.app.stderr.write(f"[-] Failed to get question: {error_detail}\n")
            sys.exit(1)

        question = response.json()
        
        columns = ('Field', 'Value')
        data = [
            ('ID', question['id']),
            ('Question Text', question['question_text']),
            ('Type', question['question_type']),
            ('Points', str(question['points'])),
            ('Challenge', question['challenge']['title'] if question.get('challenge') else 'None'),
            ('Answer Text', question.get('answer_text', 'Not provided')),
            ('Hint Text', question.get('hint_text', 'Not provided')),
            ('Flag Format', question.get('flag_format', 'Not provided')),
            ('Assigned To', question.get('assigned_to', 'Unassigned')),
        ]

        return (columns, data)