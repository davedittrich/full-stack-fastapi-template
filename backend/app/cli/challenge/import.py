"""
Import challenges command.
"""

import json
import sys
from pathlib import Path

import requests
from cliff.command import Command


class CmdChallengeImport(Command):
    """Import challenges from JSON file."""

    def get_parser(self, prog_name):
        parser = super().get_parser(prog_name)
        parser.add_argument(
            'file',
            help='Path to JSON file containing challenges to import'
        )
        parser.add_argument(
            '--api-url',
            default='http://localhost:8000/api/v1',
            help='API base URL'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be imported without actually importing'
        )
        parser.add_argument(
            '--skip-existing',
            action='store_true',
            help='Skip challenges that already exist (based on title)'
        )
        return parser

    def take_action(self, parsed_args):
        file_path = Path(parsed_args.file)
        
        if not file_path.exists():
            self.app.stderr.write(f"[-] File not found: {file_path}\n")
            sys.exit(1)

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                challenges_data = json.load(f)
        except json.JSONDecodeError as e:
            self.app.stderr.write(f"[-] Invalid JSON file: {e}\n")
            sys.exit(1)
        except Exception as e:
            self.app.stderr.write(f"[-] Error reading file: {e}\n")
            sys.exit(1)

        if not isinstance(challenges_data, list):
            self.app.stderr.write("[-] JSON file must contain an array of challenges\n")
            sys.exit(1)

        self.app.stdout.write(f"[+] Found {len(challenges_data)} challenges to import\n")

        if parsed_args.dry_run:
            self.app.stdout.write("\n[DRY RUN] Would import the following challenges:\n")
            for i, challenge in enumerate(challenges_data, 1):
                title = challenge.get('title', 'No title')
                author = challenge.get('author', 'No author')
                self.app.stdout.write(f"  {i}. {title} by {author}\n")
            return

        existing_challenges = {}
        if parsed_args.skip_existing:
            # Get existing challenges to check for duplicates
            response = requests.get(
                f"{parsed_args.api_url}/challenges/",
                params={'limit': 1000},
                timeout=30
            )
            if response.status_code == 200:
                existing_data = response.json()
                existing_challenges = {
                    challenge['title'].lower(): challenge['id'] 
                    for challenge in existing_data.get('data', [])
                }

        imported_count = 0
        skipped_count = 0
        failed_count = 0

        for i, challenge_data in enumerate(challenges_data, 1):
            title = challenge_data.get('title', f'Imported Challenge {i}')
            
            # Check if challenge already exists
            if parsed_args.skip_existing and title.lower() in existing_challenges:
                self.app.stdout.write(f"  [{i}] Skipping existing challenge: {title}\n")
                skipped_count += 1
                continue

            # Prepare challenge data for API
            api_data = {
                'title': title,
                'author': challenge_data.get('author', 'Unknown'),
                'description': challenge_data.get('description', 'No description provided'),
                'url': challenge_data.get('url'),
                'date_posted': challenge_data.get('date_posted'),
            }

            # Remove None values
            api_data = {k: v for k, v in api_data.items() if v is not None}

            try:
                response = requests.post(
                    f"{parsed_args.api_url}/challenges/",
                    json=api_data,
                    timeout=30
                )

                if response.status_code == 200:
                    self.app.stdout.write(f"  [{i}] Imported: {title}\n")
                    imported_count += 1
                else:
                    error_detail = "Unknown error"
                    try:
                        error_data = response.json()
                        error_detail = error_data.get('detail', str(response.status_code))
                    except:
                        error_detail = f"HTTP {response.status_code}"
                    
                    self.app.stderr.write(f"  [{i}] Failed to import '{title}': {error_detail}\n")
                    failed_count += 1

            except requests.RequestException as e:
                self.app.stderr.write(f"  [{i}] Network error importing '{title}': {e}\n")
                failed_count += 1
            except Exception as e:
                self.app.stderr.write(f"  [{i}] Error importing '{title}': {e}\n")
                failed_count += 1

        # Summary
        self.app.stdout.write(f"\n[+] Import completed:\n")
        self.app.stdout.write(f"    Imported: {imported_count}\n")
        if skipped_count > 0:
            self.app.stdout.write(f"    Skipped:  {skipped_count}\n")
        if failed_count > 0:
            self.app.stdout.write(f"    Failed:   {failed_count}\n")