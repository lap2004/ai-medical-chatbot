from pydantic import BaseModel, EmailStr, Field

class AdminSignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    signup_token: str

class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class MeResponse(BaseModel):
    email: EmailStr
    is_admin: bool
