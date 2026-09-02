"""Authentication service - JWT, password hashing, user creation."""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import get_settings
from app.database import get_db
from app.models.user import User, UserRole, FarmerProfile, ConsumerProfile
from app.schemas.user import UserRegister, TokenData

settings = get_settings()
security = HTTPBearer()

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        # In case the db stored passlib format ($2b$...), bcrypt checkpw usually handles it fine.
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> TokenData:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        print("DECODED PAYLOAD:", payload)
        user_id = payload.get("sub")
        role: str = payload.get("role")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return TokenData(user_id=int(user_id), role=role)
    except JWTError as e:
        print("JWT ERROR:", str(e))
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {str(e)}")


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    print("CREDENTIALS RECEIVED:", credentials.credentials[:10])
    token_data = decode_token(credentials.credentials)
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None or not user.is_active:
        print("USER NOT FOUND OR INACTIVE:", token_data.user_id)
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user


def require_farmer(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.FARMER:
        raise HTTPException(status_code=403, detail="Farmer access required")
    return current_user


def require_consumer(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.CONSUMER:
        raise HTTPException(status_code=403, detail="Consumer access required")
    return current_user


def register_user(db: Session, user_data: UserRegister) -> User:
    # Check if email exists
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check phone if provided
    if user_data.phone:
        existing_phone = db.query(User).filter(User.phone == user_data.phone).first()
        if existing_phone:
            raise HTTPException(status_code=400, detail="Phone number already registered")

    user = User(
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        full_name=user_data.full_name,
        phone=user_data.phone,
        role=UserRole(user_data.role),
    )
    db.add(user)
    db.flush()

    # Create role-specific profile
    if user_data.role == "farmer":
        profile = FarmerProfile(user_id=user.id)
        db.add(profile)
    else:
        profile = ConsumerProfile(user_id=user.id)
        db.add(profile)

    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    return user
