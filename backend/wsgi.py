from app import app, db, seed_users

with app.app_context():
    db.create_all()
    seed_users()