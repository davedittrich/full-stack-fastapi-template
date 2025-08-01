"""
Login command.
"""

import getpass
import requests
from cliff.command import Command


class CmdLogin(Command):
    """Login to get access token."""

    def get_parser(self, prog_name):
        parser = super().get_parser(prog_name)
        parser.add_argument(
            '--username',
            help='Username (email)'
        )
        parser.add_argument(
            '--api-url',
            default='http://localhost:8000/api/v1',
            help='API base URL'
        )
        return parser

    def take_action(self, parsed_args):
        username = parsed_args.username or input('Username (email): ')
        password = getpass.getpass('Password: ')

        login_data = {
            'username': username,
            'password': password
        }

        try:
            response = requests.post(
                f"{parsed_args.api_url}/login/access-token",
                data=login_data,
                timeout=30
            )

            if response.status_code == 200:
                token_data = response.json()
                self.app.stdout.write(f"[+] Login successful\n")
                self.app.stdout.write(f"[+] Access token: {token_data.get('access_token')[:20]}...\n")
                # TODO: Save token securely for future use
            else:
                self.app.stderr.write(f"[-] Login failed: {response.status_code}\n")

        except requests.RequestException as e:
            self.app.stderr.write(f"[-] Connection error: {e}\n")