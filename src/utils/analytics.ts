import { supabase } from '../lib/supabase';

const SESSION_KEY = 'tina-session-id';

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export async function logImageView(
  projectId: string,
  imageId: string,
  imageFilename: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('tina_analytics')
    .insert({
      session_id: getSessionId(),
      project_id: projectId,
      image_id: imageId,
      image_filename: imageFilename,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to log view:', error);
    return null;
  }
  return data.id;
}

export async function updateViewDuration(
  analyticsId: string,
  durationSeconds: number
): Promise<void> {
  const { error } = await supabase
    .from('tina_analytics')
    .update({ duration_seconds: Math.round(durationSeconds) })
    .eq('id', analyticsId);

  if (error) {
    console.error('Failed to update duration:', error);
  }
}
