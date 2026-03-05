import os
import uuid
from supabase import create_client, Client
from fastapi import HTTPException


supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    raise Exception("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment")

supabase: Client = create_client(supabase_url, supabase_key)


async def upload_career_images(file):
    try:
        # Read file contents
        contents = await file.read()
        
        # Generate unique filename
        file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        unique_filename = f"{uuid.uuid4()}.{file_ext}"
        
        # Upload to Supabase storage
        result = supabase.storage.from_("career-insights-bucket").upload(
            path=unique_filename,
            file=contents,
            file_options={"content-type": file.content_type or "image/jpeg"}
        )
        
        # Get public URL
        public_url = supabase.storage.from_("career-insights-bucket").get_public_url(unique_filename)
        
        return {
            "url": public_url,
            "filename": unique_filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")