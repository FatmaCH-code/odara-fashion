import { supabase, isSupabaseConfigured } from '../lib/supabase'

// Used by every "Subscribe"/"Join" form on the site.
export async function subscribeToNewsletter(email, source = 'unknown') {
  if (!isSupabaseConfigured) {
    throw new Error("Newsletter isn't connected yet.")
  }
  const { error } = await supabase.from('newsletter_subscribers').insert({ email, source })
  if (error) {
    if (error.code === '23505') {
      throw new Error("You're already subscribed!")
    }
    throw error
  }
}

export async function adminListSubscribers() {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet — see SETUP.md.')
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function adminDeleteSubscriber(id) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet — see SETUP.md.')
  const { error } = await supabase.from('newsletter_subscribers').delete().eq('id', id)
  if (error) throw error
}
