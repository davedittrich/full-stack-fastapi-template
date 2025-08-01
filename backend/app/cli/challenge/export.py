"""
Export challenges command.
"""

import json
import sys
from pathlib import Path

import requests
from cliff.command import Command


class CmdChallengeExport(Command):
    """Export challenges to JSON file."""

    def get_parser(self, prog_name):
        parser = super().get_parser(prog_name)
        parser.add_argument(
            'file',
            help='Path to output JSON file'
        )
        parser.add_argument(
            '--api-url',
            default='http://localhost:8000/api/v1',
            help='API base URL'
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=1000,
            help='Maximum number of challenges to export'
        )
        parser.add_argument(
            '--include-questions',
            action='store_true',
            help='Include associated questions in the export'
        )
        parser.add_argument(
            '--pretty',
            action='store_true',
            help='Pretty-print JSON with indentation'
        )
        return parser

    def take_action(self, parsed_args):
        file_path = Path(parsed_args.file)
        
        # Create parent directory if it doesn't exist
        file_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            # Fetch challenges from API
            response = requests.get(
                f"{parsed_args.api_url}/challenges/",
                params={'limit': parsed_args.limit},
                timeout=30
            )

            if response.status_code != 200:
                self.app.stderr.write(f"[-] Failed to fetch challenges: {response.status_code}\n")
                sys.exit(1)

            data = response.json()
            challenges = data.get('data', [])

            if not challenges:
                self.app.stdout.write("[!] No challenges found to export\n")
                return

            export_data = []

            for challenge in challenges:
                challenge_data = {
                    'title': challenge['title'],
                    'author': challenge['author'],
                    'description': challenge['description'],
                    'url': challenge.get('url'),
                    'date_posted': challenge['date_posted'],
                }

                # Remove None values
                challenge_data = {k: v for k, v in challenge_data.items() if v is not None}

                # Include questions if requested
                if parsed_args.include_questions:
                    try:
                        questions_response = requests.get(
                            f"{parsed_args.api_url}/questions/",
                            params={'challenge_id': challenge['id'], 'limit': 1000},
                            timeout=30
                        )
                        
                        if questions_response.status_code == 200:
                            questions_data = questions_response.json()
                            questions = questions_data.get('data', [])
                            
                            if questions:
                                challenge_data['questions'] = []
                                for question in questions:
                                    question_data = {
                                        'question_text': question['question_text'],
                                        'question_type': question['question_type'],
                                        'points': question['points'],
                                        'answer_text': question.get('answer_text'),
                                        'hint_text': question.get('hint_text'),
                                        'flag_format': question.get('flag_format'),
                                        'assigned_to': question.get('assigned_to'),
                                    }
                                    # Remove None values
                                    question_data = {k: v for k, v in question_data.items() if v is not None}
                                    challenge_data['questions'].append(question_data)
                    
                    except requests.RequestException:
                        # Continue without questions if API call fails
                        pass

                export_data.append(challenge_data)

            # Write to file
            with open(file_path, 'w', encoding='utf-8') as f:
                if parsed_args.pretty:
                    json.dump(export_data, f, indent=2, ensure_ascii=False)
                else:
                    json.dump(export_data, f, ensure_ascii=False)

            question_info = ""
            if parsed_args.include_questions:
                total_questions = sum(len(c.get('questions', [])) for c in export_data)
                question_info = f" (with {total_questions} questions)"

            self.app.stdout.write(f"[+] Exported {len(export_data)} challenges{question_info} to: {file_path}\n")

        except Exception as e:
            self.app.stderr.write(f"[-] Error exporting challenges: {e}\n")
            sys.exit(1)