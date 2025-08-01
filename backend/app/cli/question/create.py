"""
Create question command.
"""

import json
import sys

import requests
from cliff.command import Command


class CmdQuestionCreate(Command):
    """Create a new question."""

    def get_parser(self, prog_name):
        parser = super().get_parser(prog_name)
        parser.add_argument(
            'question_text',
            help='The question text'
        )
        parser.add_argument(
            '--type',
            default='short_answer',
            choices=[
                'multiple_choice', 'short_answer', 'essay', 'coding',
                'flag_capture', 'forensics', 'reverse_engineering',
                'web_security', 'cryptography', 'network_security', 'other'
            ],
            help='Question type'
        )
        parser.add_argument(
            '--points',
            type=int,
            default=10,
            help='Points awarded for correct answer'
        )
        parser.add_argument(
            '--challenge-id',
            help='ID of associated challenge'
        )
        parser.add_argument(
            '--answer',
            help='Answer text'
        )
        parser.add_argument(
            '--hint',
            help='Hint text'
        )
        parser.add_argument(
            '--flag-format',
            help='Expected flag format (e.g., flag{...})'
        )
        parser.add_argument(
            '--assigned-to',
            help='Username or email to assign question to'
        )
        parser.add_argument(
            '--api-url',
            default='http://localhost:8000/api/v1',
            help='API base URL'
        )
        return parser

    def take_action(self, parsed_args):
        question_data = {
            'question_text': parsed_args.question_text,
            'question_type': parsed_args.type,
            'points': parsed_args.points,
        }

        # Add optional fields
        if parsed_args.challenge_id:
            question_data['challenge_id'] = parsed_args.challenge_id
        if parsed_args.answer:
            question_data['answer_text'] = parsed_args.answer
        if parsed_args.hint:
            question_data['hint_text'] = parsed_args.hint
        if parsed_args.flag_format:
            question_data['flag_format'] = parsed_args.flag_format
        if parsed_args.assigned_to:
            question_data['assigned_to'] = parsed_args.assigned_to

        try:
            response = requests.post(
                f"{parsed_args.api_url}/questions/",
                json=question_data,
                timeout=30
            )

            if response.status_code == 200:
                question = response.json()
                self.app.stdout.write(f"[+] Question created successfully\n")
                self.app.stdout.write(f"    ID: {question['id']}\n")
                self.app.stdout.write(f"    Text: {question['question_text']}\n")
                self.app.stdout.write(f"    Type: {question['question_type']}\n")
                self.app.stdout.write(f"    Points: {question['points']}\n")
            else:
                error_detail = "Unknown error"
                try:
                    error_data = response.json()
                    error_detail = error_data.get('detail', str(response.status_code))
                except:
                    error_detail = f"HTTP {response.status_code}"
                
                self.app.stderr.write(f"[-] Failed to create question: {error_detail}\n")
                sys.exit(1)

        except requests.RequestException as e:
            self.app.stderr.write(f"[-] Network error: {e}\n")
            sys.exit(1)
        except Exception as e:
            self.app.stderr.write(f"[-] Error creating question: {e}\n")
            sys.exit(1)