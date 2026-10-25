from supabase import create_client

from .config import settings

# Service-role client: bypasses RLS, so every query MUST filter by user_id.
db = create_client(settings.supabase_url, settings.supabase_service_key)
