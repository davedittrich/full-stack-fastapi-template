"""
Create challenges command.
"""

import json
import sys
from typing import Any

from cliff.command import Command
import requests

from app.models import ChallengeCreate


class CmdChallengeCreate(Command):
    """Create challenges in the database."""

    def get_parser(self, prog_name):
        parser = super().get_parser(prog_name)
        parser.add_argument(
            'title',
            help='Challenge title'
        )
        parser.add_argument(
            '--author',
            required=True,
            help='Challenge author'
        )
        parser.add_argument(
            '--url',
            required=True,
            help='Challenge URL'
        )
        parser.add_argument(
            '--description',
            required=True,
            help='Challenge description'
        )
        parser.add_argument(
            '--date-posted',
            required=True,
            help='Date posted (YYYY-MM-DD format)'
        )
        parser.add_argument(
            '--inactive',
            action='store_true',
            help='Create challenge as inactive'
        )
        parser.add_argument(
            '--api-url',
            default='http://localhost:8000/api/v1',
            help='API base URL'
        )
        parser.add_argument(
            '--import-file',
            help='Import challenges from JSON file'
        )
        return parser

    def take_action(self, parsed_args):
        if parsed_args.import_file:
            self._import_from_file(parsed_args)
        else:
            self._create_single_challenge(parsed_args)

    def _create_single_challenge(self, parsed_args):
        """Create a single challenge."""
        challenge_data = {
            'title': parsed_args.title,
            'author': parsed_args.author,
            'url': parsed_args.url,
            'description': parsed_args.description,
            'date_posted': parsed_args.date_posted,
            'is_active': not parsed_args.inactive
        }

        try:
            challenge = ChallengeCreate(**challenge_data)
        except Exception as e:
            self.app.stderr.write(f"[-] Invalid challenge data: {e}\n")
            return 1

        response = requests.post(
            f"{parsed_args.api_url}/challenges/",
            json=challenge.model_dump(),
            timeout=30
        )

        if response.status_code == 201:
            self.app.stdout.write(f"[+] Created challenge: {parsed_args.title}\n")
        else:
            self.app.stderr.write(f"[-] Failed to create challenge: {response.status_code} {response.text}\n")
            return 1

    def _import_from_file(self, parsed_args):
        """Import challenges from JSON file."""
        try:
            with open(parsed_args.import_file, 'r') as f:
                challenges_data = json.load(f)
        except FileNotFoundError:
            self.app.stderr.write(f"[-] File not found: {parsed_args.import_file}\n")
            return 1
        except json.JSONDecodeError as e:
            self.app.stderr.write(f"[-] Invalid JSON: {e}\n")
            return 1

        if not isinstance(challenges_data, list):
            challenges_data = [challenges_data]

        for challenge_data in challenges_data:
            try:
                challenge = ChallengeCreate(**challenge_data)
                response = requests.post(
                    f"{parsed_args.api_url}/challenges/",
                    json=challenge.model_dump(),
                    timeout=30
                )

                if response.status_code == 201:
                    self.app.stdout.write(f"[+] Created challenge: {challenge_data['title']}\n")
                else:
                    self.app.stderr.write(f"[-] Failed to create challenge {challenge_data['title']}: {response.status_code}\n")
            except Exception as e:
                self.app.stderr.write(f"[-] Error processing challenge {challenge_data.get('title', 'unknown')}: {e}\n")