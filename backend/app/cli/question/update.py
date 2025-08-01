"""
Update question command.
"""

import sys

import requests
from cliff.command import Command


class CmdQuestionUpdate(Command):
    """Update an existing question."""

    def get_parser(self, prog_name):
        parser = super().get_parser(prog_name)
        parser.add_argument(
            'question_id',
            help='Question ID to update'
        )
        parser.add_argument(
            '--question-text',
            help='New question text'
        )
        parser.add_argument(
            '--type',
            choices=[
                'multiple_choice', 'short_answer', 'essay', 'coding',
                'flag_capture', 'forensics', 'reverse_engineering',
                'web_security', 'cryptography', 'network_security', 'other'
            ],
            help='New question type'
        )
        parser.add_argument(
            '--points',
            type=int,
            help='New points value'
        )
        parser.add_argument(
            '--challenge-id',
            help='New challenge ID'
        )
        parser.add_argument(
            '--answer',
            help='New answer text'
        )
        parser.add_argument(
            '--hint',
            help='New hint text'
        )
        parser.add_argument(
            '--flag-format',
            help='New flag format'
        )
        parser.add_argument(
            '--assigned-to',
            help='New assigned user'
        )
        parser.add_argument(
            '--api-url',
            default='http://localhost:8000/api/v1',
            help='API base URL'
        )
        return parser

    def take_action(self, parsed_args):
        # Build update data with only provided fields
        update_data = {}
        
        if parsed_args.question_text:
            update_data['question_text'] = parsed_args.question_text
        if parsed_args.type:
            update_data['question_type'] = parsed_args.type
        if parsed_args.points is not None:
            update_data['points'] = parsed_args.points
        if parsed_args.challenge_id:
            update_data['challenge_id'] = parsed_args.challenge_id
        if parsed_args.answer:
            update_data['answer_text'] = parsed_args.answer
        if parsed_args.hint:
            update_data['hint_text'] = parsed_args.hint
        if parsed_args.flag_format:
            update_data['flag_format'] = parsed_args.flag_format
        if parsed_args.assigned_to:
            update_data['assigned_to'] = parsed_args.assigned_to

        if not update_data:
            self.app.stderr.write("[-] No update fields provided\n")
            sys.exit(1)

        try:
            response = requests.put(
                f"{parsed_args.api_url}/questions/{parsed_args.question_id}",
                json=update_data,
                timeout=30
            )

            if response.status_code == 200:
                question = response.json()
                self.app.stdout.write(f"[+] Question updated successfully\n")
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
                
                self.app.stderr.write(f"[-] Failed to update question: {error_detail}\n")
                sys.exit(1)

        except requests.RequestException as e:
            self.app.stderr.write(f"[-] Network error: {e}\n")
            sys.exit(1)
        except Exception as e:
            self.app.stderr.write(f"[-] Error updating question: {e}\n")
            sys.exit(1)