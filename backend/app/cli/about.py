"""
About command.
"""

from cliff.command import Command


class CmdAbout(Command):
    """Show information about Tanzanite."""

    def take_action(self, parsed_args):
        self.app.stdout.write("""
Tanzanite CLI
=============

Tanzanite is a platform for managing challenges and questions for
educational purposes, competitions, and training sessions.

Features:
- Challenge management (create, list, update, delete)
- Question management with assignment capabilities
- User management with role-based permissions
- RESTful API with FastAPI
- Comprehensive CLI interface

Version: 0.1.0
License: MIT

For more information, visit: https://github.com/davedittrich/tanzanite
""")