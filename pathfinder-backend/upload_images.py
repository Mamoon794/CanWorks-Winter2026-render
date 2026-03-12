import os
import uuid
from dotenv import load_dotenv
from supabase import create_client, Client
from fastapi import HTTPException

load_dotenv()

_supabase_client: Client | None = None

def _get_supabase() -> Client:
    global _supabase_client
    if _supabase_client is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise HTTPException(status_code=500, detail="SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment")
        _supabase_client = create_client(url, key)
    return _supabase_client


async def upload_career_images(file):
    try:
        # Read file contents
        contents = await file.read()
        
        # Generate unique filename
        file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        unique_filename = f"{uuid.uuid4()}.{file_ext}"
        
        # Upload to Supabase storage
        client = _get_supabase()
        result = client.storage.from_("career-insights-bucket").upload(
            path=unique_filename,
            file=contents,
            file_options={"content-type": file.content_type or "image/jpeg"}
        )

        # Get public URL
        public_url = client.storage.from_("career-insights-bucket").get_public_url(unique_filename)
        
        return {
            "url": public_url,
            "filename": unique_filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")