import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars not set. Using demo mode.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
)

export async function uploadCardImage(file, contactId, side) {
  const ext = file.name?.split('.').pop() || 'jpg'
  const path = `cards/${contactId}/${side}.${ext}`
  const { error } = await supabase.storage
    .from('card-images')
    .upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('card-images').getPublicUrl(path)
  return data.publicUrl
}

export async function getContacts({ search, industry, relationship_type, geography } = {}) {
  let query = supabase
    .from('contacts')
    .select('*')
    .order('date_met', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,company.ilike.%${search}%,notes_raw.ilike.%${search}%`
    )
  }
  if (industry) query = query.eq('industry', industry)
  if (relationship_type) query = query.eq('relationship_type', relationship_type)
  if (geography) query = query.eq('geography', geography)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getContact(id) {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function saveContact(contact) {
  if (contact.id) {
    const { id, created_at, ...updates } = contact
    const { data, error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('contacts')
      .insert(contact)
      .select()
      .single()
    if (error) throw error
    return data
  }
}

export async function toggleFollowUp(id, current) {
  const { error } = await supabase
    .from('contacts')
    .update({ follow_up_flag: !current })
    .eq('id', id)
  if (error) throw error
}

export async function deleteContact(id) {
  const { error } = await supabase.from('contacts').delete().eq('id', id)
  if (error) throw error
}
