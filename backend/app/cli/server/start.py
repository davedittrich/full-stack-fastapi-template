"""
Start server command.
"""

import subprocess
import sys
from cliff.command import Command


class CmdServerStart(Command):
    """Start the FastAPI server."""

    def get_parser(self, prog_name):
        parser = super().get_parser(prog_name)
        parser.add_argument(
            '--host',
            default='127.0.0.1',
            help='Host to bind to'
        )
        parser.add_argument(
            '--port',
            type=int,
            default=8000,
            help='Port to bind to'
        )
        parser.add_argument(
            '--reload',
            action='store_true',
            help='Enable auto-reload'
        )
        return parser

    def take_action(self, parsed_args):
        cmd = [
            sys.executable, '-m', 'uvicorn',
            'app.main:app',
            '--host', parsed_args.host,
            '--port', str(parsed_args.port)
        ]

        if parsed_args.reload:
            cmd.append('--reload')

        self.app.stdout.write(f"[+] Starting server at http://{parsed_args.host}:{parsed_args.port}\n")

        try:
            subprocess.run(cmd, check=True)
        except KeyboardInterrupt:
            self.app.stdout.write("\n[+] Server stopped\n")
        except subprocess.CalledProcessError as e:
            self.app.stderr.write(f"[-] Server failed to start: {e}\n")