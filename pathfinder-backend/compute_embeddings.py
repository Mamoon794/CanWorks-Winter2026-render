from sqlalchemy.orm import Session
from database import SessionLocal
from models import JobPosting
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')


def compute():
    db: Session = SessionLocal()
    try:
        jobs = db.query(JobPosting).all()
        count = 0
        for job in jobs:
            if not getattr(job, 'embedding', None):
                text_blob = ' '.join(filter(None, [str(job.title or ''), str(job.employer or ''), str(job.description or '')]))
                emb = model.encode(text_blob).tolist()
                job.embedding = emb
                db.add(job)
                count += 1
                if count % 50 == 0:
                    db.commit()
        db.commit()
        print(f"Updated embeddings for {count} jobs")
    finally:
        db.close()


if __name__ == '__main__':
    compute()
