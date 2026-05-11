from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db_name: str = "lasdpc"
    jwt_secret: str = "change-this-to-a-long-random-string"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480
    cors_origins: str = "http://localhost:8080"
    backend_port: int = 8000
    admin_bootstrap_token: str = ""
    admin_email: str = ""
    admin_password: str = ""
    admin_name: str = "Admin LASDPC"

    minio_endpoint: str = "http://localhost:9000"
    minio_public_url: str = "http://localhost:9000/lasdpc-media"
    minio_root_user: str = ""
    minio_root_password: str = ""
    minio_bucket: str = "lasdpc-media"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
