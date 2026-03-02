from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import verify_password, create_access_token
from app.schemas.schemas import Token, LoginRequest
from app.models.models import User, Hospital

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")
    token = create_access_token({"sub": str(user.id), "role": user.role})
    hospital = db.query(Hospital).filter(Hospital.user_id == user.id).first()
    return Token(
        access_token=token,
        token_type="bearer",
        role=user.role,
        hospital_id=hospital.id if hospital else None,
        hospital_name=hospital.name if hospital else None
    )
