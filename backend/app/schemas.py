from pydantic import BaseModel, EmailStr, Field


class QuizAnswerBody(BaseModel):
    question_id: int
    option_id: int


class LoginBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class RegisterBody(BaseModel):
    full_name: str = Field(min_length=1)
    age: int | None = None
    gender: str | None = None
    phone: str = Field(min_length=1)
    email: EmailStr
    full_address: str = Field(min_length=1)
    city: str = Field(min_length=1)
    state: str = Field(min_length=1)
    pincode: str
    location: str = Field(min_length=1)
    marital_status: str | None = None
    education: str | None = None
    occupation: str | None = None
    referred_by: str | None = None
    password: str = Field(min_length=6)
    confirm_password: str
    consent_accepted: bool = False
