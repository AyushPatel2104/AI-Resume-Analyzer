import json

from app.database import SessionLocal, init_db
from app.models import Analysis, Job, Resume


def test_analysis_links_resume_and_job():
    init_db()
    db = SessionLocal()
    try:
        resume = Resume(
            user_id=None,
            name="test-resume",
            original_filename="resume.docx",
            file_type=".docx",
            file_size=100,
            stored_path=None,
            resume_text="Python developer",
            parsed_profile_json=json.dumps({"skills": []}),
        )
        job = Job(
            user_id=None,
            title="Engineer",
            company_name=None,
            source_url=None,
            job_description="Python role with FastAPI experience required.",
            normalized_requirements_json=None,
        )
        db.add(resume)
        db.add(job)
        db.flush()

        analysis = Analysis(
            user_id=None,
            resume_id=resume.id,
            job_id=job.id,
            overall_score=72.5,
            match_result_json=json.dumps({"overall_score": 72.5}),
        )
        db.add(analysis)
        db.commit()

        loaded = db.query(Analysis).filter(Analysis.id == analysis.id).one()
        assert loaded.resume.original_filename == "resume.docx"
        assert loaded.job.title == "Engineer"
        assert loaded.user_id is None
    finally:
        db.close()
