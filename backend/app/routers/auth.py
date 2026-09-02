"""Authentication routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.user import (
    UserRegister, UserLogin, Token, UserResponse,
    FarmerProfileCreate, FarmerProfileResponse,
    ConsumerProfileCreate, ConsumerProfileResponse,
    UserUpdate,
)
from app.services.auth_service import (
    register_user, authenticate_user, create_access_token,
    get_current_user,
)
from app.models.user import User, FarmerProfile, ConsumerProfile

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=Token)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new farmer or consumer."""
    user = register_user(db, user_data)
    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return Token(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login with email and password."""
    user = authenticate_user(db, credentials.email, credentials.password)
    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return Token(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user."""
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
def update_me(update_data: UserUpdate, current_user: User = Depends(get_current_user),
              db: Session = Depends(get_db)):
    """Update current user profile."""
    if update_data.full_name:
        current_user.full_name = update_data.full_name
    if update_data.phone:
        current_user.phone = update_data.phone
    if update_data.avatar_url is not None:
        current_user.avatar_url = update_data.avatar_url
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.get("/farmer-profile", response_model=FarmerProfileResponse)
def get_farmer_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get farmer profile."""
    profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Farmer profile not found")
    return FarmerProfileResponse.model_validate(profile)


@router.put("/farmer-profile", response_model=FarmerProfileResponse)
def update_farmer_profile(profile_data: FarmerProfileCreate, 
                          current_user: User = Depends(get_current_user),
                          db: Session = Depends(get_db)):
    """Update farmer profile."""
    profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Farmer profile not found")
    
    update_data = profile_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
    
    db.commit()
    db.refresh(profile)
    return FarmerProfileResponse.model_validate(profile)


@router.get("/consumer-profile", response_model=ConsumerProfileResponse)
def get_consumer_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(ConsumerProfile).filter(ConsumerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Consumer profile not found")
    return ConsumerProfileResponse.model_validate(profile)


@router.put("/consumer-profile", response_model=ConsumerProfileResponse)
def update_consumer_profile(profile_data: ConsumerProfileCreate,
                            current_user: User = Depends(get_current_user),
                            db: Session = Depends(get_db)):
    profile = db.query(ConsumerProfile).filter(ConsumerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Consumer profile not found")
    
    update_data = profile_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
    
    db.commit()
    db.refresh(profile)
    return ConsumerProfileResponse.model_validate(profile)
