"""
Delete question command.
"""

import sys

import requests
from cliff.command import Command


class CmdQuestionDelete(Command):
    """Delete a question."""

    def get_parser(self, prog_name):
        parser = super().get_parser(prog_name)
        parser.add_argument(
            'question_id',
            help='Question ID to delete'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Delete without confirmation'
        )
        parser.add_argument(
            '--api-url',
            default='http://localhost:8000/api/v1',
            help='API base URL'
        )
        return parser

    def take_action(self, parsed_args):
        # Get question details first for confirmation
        if not parsed_args.force:
            try:
                response = requests.get(
                    f"{parsed_args.api_url}/questions/{parsed_args.question_id}",
                    timeout=30
                )
                
                if response.status_code == 200:
                    question = response.json()
                    self.app.stdout.write(f"Question to delete:\n")
                    self.app.stdout.write(f"  ID: {question['id']}\n")
                    self.app.stdout.write(f"  Text: {question['question_text']}\n")
                    self.app.stdout.write(f"  Type: {question['question_type']}\n")
                    
                    confirmation = input("Are you sure you want to delete this question? (y/N): ")
                    if confirmation.lower() not in ['y', 'yes']:
                        self.app.stdout.write("[-] Deletion cancelled\n")
                        return
                        
            except requests.RequestException:
                # Continue with deletion if we can't fetch details
                pass

        try:
            response = requests.delete(
                f"{parsed_args.api_url}/questions/{parsed_args.question_id}",
                timeout=30
            )

            if response.status_code == 200:
                self.app.stdout.write(f"[+] Question deleted successfully\n")
            else:
                error_detail = "Unknown error"
                try:
                    error_data = response.json()
                    error_detail = error_data.get('detail', str(response.status_code))
                except:
                    error_detail = f"HTTP {response.status_code}"
                
                self.app.stderr.write(f"[-] Failed to delete question: {error_detail}\n")
                sys.exit(1)

        except requests.RequestException as e:
            self.app.stderr.write(f"[-] Network error: {e}\n")
            sys.exit(1)
        except Exception as e:
            self.app.stderr.write(f"[-] Error deleting question: {e}\n")
            sys.exit(1)