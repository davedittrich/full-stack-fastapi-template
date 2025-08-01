"""
Configuration using python-secrets (psec) for secure secrets management.

This replaces the traditional .env file approach with a more secure
secrets management system that decouples secrets from the source code repository.
"""

import json
import os
import sys
import textwrap
import warnings
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from pydantic import AnyHttpUrl, BaseSettings, HttpUrl, PostgresDsn, validator

# Import psec with warning suppression for deprecation warnings
try:
    from psec.exceptions import InvalidBasedirError
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", category=DeprecationWarning)
        from psec.secrets_environment import SecretsEnvironment
    PSEC_AVAILABLE = True
except ImportError:
    PSEC_AVAILABLE = False


ENVIRONMENT_REQUIRED_MSG = textwrap.dedent(
    """\
    [-] This application requires a fully configured python-secrets (psec) environment
    [-] holding necessary settings and secrets for operation. Please ensure the
    [-] default environment is set (see `psec environments default --help`), the
    [-] environment variables `D2_ENVIRONMENT` and/or `D2_SECRETS_BASEDIR` are
    [-] set as needed, or create the environment and ensure it is correctly
    [-] populated before trying again.

    [-] To create a new environment:
    [-]   psec environments create <environment-name>
    [-]   psec secrets generate --from-options

    [-] To use with current .env file as fallback:
    [-]   Set TANZANITE_USE_ENV_FALLBACK=1 environment variable
    """
)


def get_secrets_environment():
    """Get the psec secrets environment or None if not available/configured."""
    if not PSEC_AVAILABLE:
        return None

    try:
        secrets_environment = SecretsEnvironment(
            environment=os.getenv('D2_ENVIRONMENT', None),
            export_env_vars=True
        )
        secrets_environment.requires_environment()
        secrets_environment.read_secrets_and_descriptions()
        return secrets_environment
    except (InvalidBasedirError, Exception):
        if os.getenv('TANZANITE_USE_ENV_FALLBACK') != '1':
            sys.stderr.write(ENVIRONMENT_REQUIRED_MSG)
        return None


def json_config_settings_source(
    settings: BaseSettings,
    secrets_environment: Optional[Any] = None
) -> Dict[str, Any]:
    """
    A settings source that loads variables from a JSON file
    in the project's python-secrets environment directory.
    """
    if not secrets_environment:
        return {}

    try:
        secrets_file_path = secrets_environment.get_secrets_file_path()
        return json.loads(Path(secrets_file_path).read_text(encoding='utf-8'))
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


class PsecSettings(BaseSettings):
    """
    Settings class using python-secrets (psec) for configuration.

    Falls back to environment variables if psec is not available or configured.
    """

    PROJECT_NAME: str = "Tanzanite"
    PROJECT_VERSION: str = "0.1.0"

    # Server configuration
    DOMAIN: str = "localhost"
    SERVER_HOST: str = "127.0.0.1"
    SERVER_PORT: int = 8000

    # API configuration
    API_VER: str = "v1"
    API_PATH: str = "api/v1"

    @validator("API_BASE_URL", pre=True, always=True, allow_reuse=True)
    def assemble_api_base_url(
        cls,
        v: Optional[str],
        values: Dict[str, Any],
    ) -> str:
        if isinstance(v, str) and v:
            return v
        server_host = values.get('SERVER_HOST', '127.0.0.1')
        server_port = values.get('SERVER_PORT', 8000)
        return f"http://{server_host}:{server_port}"

    API_BASE_URL: str = ""

    # CORS configuration
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @validator("BACKEND_CORS_ORIGINS", pre=True, always=True, allow_reuse=True)
    def assemble_cors_origins(
        cls,
        v: Union[str, List[str], List[AnyHttpUrl]],
        values: Dict[str, Any],
    ) -> List[str]:
        if isinstance(v, str):
            if v.startswith('['):
                # JSON string
                return json.loads(v)
            else:
                # Comma-separated string
                return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        return []

    # Security
    SECRET_KEY: str = "changethis"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    # Database configuration
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "changethis"
    POSTGRES_DB: str = "app"

    SQLALCHEMY_DATABASE_URI: Optional[PostgresDsn] = None

    @validator("SQLALCHEMY_DATABASE_URI", pre=True, allow_reuse=True)
    def assemble_db_connection(
        cls,
        v: Optional[str],
        values: Dict[str, Any]
    ) -> Any:
        if isinstance(v, str):
            return v
        return PostgresDsn.build(
            scheme="postgresql",
            user=values.get("POSTGRES_USER"),
            password=values.get("POSTGRES_PASSWORD"),
            host=values.get("POSTGRES_SERVER"),
            port=str(values.get("POSTGRES_PORT") or 5432),
            path=f"/{values.get('POSTGRES_DB') or ''}",
        )

    # Email configuration
    SMTP_TLS: bool = True
    SMTP_PORT: Optional[int] = None
    SMTP_HOST: Optional[str] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[str] = None
    EMAILS_FROM_NAME: Optional[str] = None

    @validator("EMAILS_FROM_NAME", pre=True, always=True, allow_reuse=True)
    def get_project_name(
        cls,
        v: Optional[str],
        values: Dict[str, Any],
    ) -> str:
        if not v:
            return values.get("PROJECT_NAME", "Tanzanite")
        return v

    EMAIL_RESET_TOKEN_EXPIRE_HOURS: int = 48
    EMAILS_ENABLED: bool = False

    @validator("EMAILS_ENABLED", pre=True, always=True, allow_reuse=True)
    def get_emails_enabled(
        cls,
        v: Optional[bool],
        values: Dict[str, Any],
    ) -> bool:
        return bool(
            values.get("SMTP_HOST")
            and values.get("SMTP_PORT")
            and values.get("EMAILS_FROM_EMAIL")
        )

    # User management
    USERS_OPEN_REGISTRATION: bool = False
    FIRST_SUPERUSER: str = "admin@example.com"
    FIRST_SUPERUSER_PASSWORD: str = "changethis"

    # Sentry (optional)
    SENTRY_DSN: Optional[HttpUrl] = None

    @validator("SENTRY_DSN", pre=True, allow_reuse=True)
    def sentry_dsn_can_be_blank(cls, v: str) -> Optional[str]:
        if len(v) == 0:
            return None
        return v

    # Environment
    ENVIRONMENT: str = "local"

    class Config:
        case_sensitive = True
        env_file_encoding = 'utf-8'
        extra = 'allow'

        @classmethod
        def customise_sources(
            cls,
            init_settings,
            env_settings,
            file_secret_settings,
        ):
            # Try to get psec settings first, fall back to env
            secrets_environment = get_secrets_environment()
            if secrets_environment:
                def psec_settings_source(settings):
                    return json_config_settings_source(settings, secrets_environment)

                return (
                    init_settings,
                    psec_settings_source,
                    env_settings,
                    file_secret_settings,
                )
            else:
                # Fall back to standard sources (including .env files)
                return (
                    init_settings,
                    env_settings,
                    file_secret_settings,
                )


# Create the settings instance
settings = PsecSettings()

# Export the secrets environment for CLI use
secrets_environment = get_secrets_environment() if PSEC_AVAILABLE else None