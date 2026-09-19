from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, emergency, hospitals, admin, dashboard, analytics, health, resources, prearrival
from database import engine
from models import Base
from contextlib import asynccontextmanager
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Lightweight SQLite compatibility migration for existing databases.
        if str(engine.url).startswith("sqlite"):
            from sqlalchemy import text
            cols = (await conn.execute(text("PRAGMA table_info(emergency_cases)"))).all()
            names = {row[1] for row in cols}
            if "voice_note_path" not in names:
                await conn.execute(text("ALTER TABLE emergency_cases ADD COLUMN voice_note_path VARCHAR"))
            if "voice_transcript" not in names:
                await conn.execute(text("ALTER TABLE emergency_cases ADD COLUMN voice_transcript TEXT"))

    # Local demo package: make the hospital network usable immediately.
    from sqlalchemy import select
    from models import Hospital
    from database import SessionLocal
    async with SessionLocal() as seed_db:
        existing = (await seed_db.execute(select(Hospital.id).limit(1))).first()
        if existing is None:
            demo_hospitals = [
                dict(name="SMS Hospital · Demo", address="Jawahar Lal Nehru Marg, Jaipur", latitude=26.9124, longitude=75.7873, estimated_emergency_cost=2500, available_icu=8, available_beds=34, capabilities="Emergency, Trauma, Cardiac, Neuro, Orthopedic, Pediatric, Maternity, Ventilator, ICU", contact_phone="+91 141 2560291"),
                dict(name="Fortis Hospital · Demo", address="Malviya Nagar, Jaipur", latitude=26.8540, longitude=75.8063, estimated_emergency_cost=3000, available_icu=6, available_beds=28, capabilities="Emergency, Trauma, Cardiac, Neuro, Orthopedic, Ventilator, ICU", contact_phone="+91 141 2547000"),
                dict(name="Narayana Hospital · Demo", address="Pratap Nagar, Jaipur", latitude=26.8065, longitude=75.8280, estimated_emergency_cost=3500, available_icu=7, available_beds=30, capabilities="Emergency, Trauma, Cardiac, Orthopedic, Pediatric, Ventilator, ICU", contact_phone="+91 141 7122222"),
                dict(name="Manipal Hospital · Demo", address="Sector 5, Vidhyadhar Nagar, Jaipur", latitude=26.9638, longitude=75.7788, estimated_emergency_cost=4200, available_icu=5, available_beds=24, capabilities="Emergency, Trauma, Cardiac, Neuro, Orthopedic, Ventilator, ICU", contact_phone="+91 141 5165000"),
                dict(name="Rukmani Birla Hospital · Demo", address="Durgapura, Jaipur", latitude=26.8567, longitude=75.7892, estimated_emergency_cost=3900, available_icu=5, available_beds=22, capabilities="Emergency, Trauma, Cardiac, Neuro, Maternity, Ventilator, ICU", contact_phone="+91 141 3528888"),
                dict(name="Mahaveer Cancer Hospital · Demo", address="Jagatpura, Jaipur", latitude=26.8356, longitude=75.8245, estimated_emergency_cost=4500, available_icu=4, available_beds=20, capabilities="Emergency, Oncology, ICU, Oxygen", contact_phone="+91 141 2771777"),
                dict(name="Eternal Hospital · Demo", address="Jawahar Lal Nehru Marg, Jaipur", latitude=26.8958, longitude=75.8061, estimated_emergency_cost=4800, available_icu=6, available_beds=26, capabilities="Emergency, Trauma, Cardiac, Neuro, Orthopedic, Maternity, Ventilator, ICU", contact_phone="+91 141 4410000"),
            ]
            seed_db.add_all([Hospital(verified=True, emergency_status="ONLINE", oxygen_available=True, trauma_capability=True, emergency_capacity=50, blood_units=40, **h) for h in demo_hospitals])
            await seed_db.commit()
    yield

app = FastAPI(
    title="EMEFast AI API",
    description="Real-Time Emergency Coordination & Hospital Allocation Platform (SIH 2026)",
    version="3.0.0",
    lifespan=lifespan
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[x.strip() for x in os.getenv("CORS_ORIGINS", "http://localhost:3001").split(",") if x.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core EMEFast Routers
app.include_router(auth.router)
app.include_router(emergency.router)
app.include_router(hospitals.router)
app.include_router(admin.router)

# Support & Secondary Routers
app.include_router(dashboard.router)
app.include_router(analytics.router)
app.include_router(health.router)
app.include_router(resources.router)
app.include_router(prearrival.router)

@app.get("/")
def root():
    return {
        "platform": "EMEFast AI",
        "status": "ONLINE",
        "description": "Emergency hospital recommendation and coordination platform. No ambulance dispatch.",
        "docs": "/docs"
    }
